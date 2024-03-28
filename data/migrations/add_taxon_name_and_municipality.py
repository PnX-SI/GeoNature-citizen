#!/usr/bin/env python3
""" Script de mise à jour des données obstax lors de la montée en version v0.99.4 > v1.0

  Faisant suite à la suppression des schémas taxonomie et ref_geo en base de données,
  le nom d'espèce ainsi que la commune sont maintenant récupérés par API et stockés
  en dur dans la table gnc_obstax.t_obstax.
    - Communes: récupérées par nominatim.
    - Espèces: récupérées via TaxHub.

"""

__author__ = "@mvergez (NaturalSolutions)"

import json
import logging
from os.path import exists
from urllib.parse import urljoin

import requests

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

GNC_API = (
    input("GeoNature-citizen API URL (default: http://localhost:5002/api/):")
    or "http://localhost:5002/api/"
)

GNC_API = f"{GNC_API}/" if GNC_API[-1] != "/" else GNC_API

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
INPN_URL = "https://taxref.mnhn.fr/api/taxa/"
GNC_ALL_OBS = GNC_API + "programs/all/observations"
GNC_OBS = GNC_API + "observations"
GNC_LOGIN = GNC_API + "login"


def check_api():
    MODULES_API = f"{GNC_API}modules"
    logger.info(f"Check API {MODULES_API}")
    try:
        resp = requests.get(MODULES_API)
        if resp.status_code == 200:
            logger.info(f"GnCitizen Backend works!!!")
        else:
            logger.error(f"API seems broken with status code {resp.status_code}")
            exit("API seems broken")
    except Exception:
        exit("No connection to API")


def get_municipality_name(x: int, y: int):
    municipality = get_municipality_from_lat_long(lat=y, lon=x)
    # Chaining if conditions since the nominatim API does not return
    # the same attributes depending on the "city"
    available_city_keys = ["village", "town", "city", "municipality"]
    municipality_id = None
    i = 0
    while municipality_id is None and i < len(available_city_keys) - 1:
        municipality_id = municipality.get(available_city_keys[i], None)
        i += 1

    return municipality_id


def get_municipality_from_lat_long(lat: int, lon: int) -> dict:
    municipality = {}
    resp = requests.get(f"{NOMINATIM_URL}?lat={lat}&lon={lon}&format=json", timeout=10)
    if resp.ok:
        municipality = resp.json().get("address", {})
    return municipality


def get_taxa_name(taxa_id: int) -> dict:
    url = urljoin(INPN_URL, f"{taxa_id}")
    resp = requests.get(url)
    if resp.status_code == 200:
        return resp.json().get("frenchVernacularName")
    else:
        exit("Cannot get infos from inpn")


def get_observations():
    resp = requests.get(GNC_ALL_OBS)
    logger.debug(resp.url)
    if resp.status_code == 200:
        return resp.json().get("features", {})
    else:
        exit("Cannot get infos from citizen")


def render_observations(observations: list):
    changed_obs = []
    for obs in observations:
        coords = obs.get("geometry", {}).get("coordinates", [])
        coords_dict = {"x": coords[0], "y": coords[1]}
        props = obs.get("properties")
        dic = {
            "geometry": json.dumps(coords_dict),
            "cd_nom": props["cd_nom"],
            "name": get_taxa_name(taxa_id=props["cd_nom"]),
            "date": props["date"],
            "municipality": get_municipality_name(x=coords[0], y=coords[1]),
            "count": props["count"],
            "comment": props["comment"],
            "id_observation": props["id_observation"],
            "delete_media": json.dumps([]),
        }
        changed_obs.append(dic)

    return changed_obs


def login() -> str:
    # Post Method is invoked if data != None
    username = input("username: ")
    password = input("password: ")
    resp = requests.post(GNC_LOGIN, json={"email": username, "password": password})
    # Response
    if resp.status_code == 200:
        return resp.json().get("access_token")
    else:
        exit(f"Can't login with provided (status_code: {resp.status_code})")


def set_observations(observations, token):
    for obs in observations:
        obs_id = obs.get("id_observation", 0)
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.patch(GNC_OBS, data=obs, headers=headers)
        logger.debug(f"STATUS {resp.status_code}")
        if not resp.ok:
            logger.debug(f"OBS values : {obs}")
            raise RuntimeError(f"Cannot update this observation: n°{obs_id}")
        else:
            print(f"Done for obs n°{obs_id}")


if __name__ == "__main__":
    check_api()
    export_exists = exists("./obs_save.json")
    if not export_exists:
        obs = get_observations()
        obs = render_observations(obs)
        with open("./obs_save.json", "w") as f:
            json.dump(obs, f)
    else:
        with open("./obs_save.json", "r") as f:
            obs = json.load(f)
    token = login()
    print(set_observations(obs, token=token))
