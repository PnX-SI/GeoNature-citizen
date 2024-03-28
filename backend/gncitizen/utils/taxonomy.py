#!/usr/bin/env python3

"""A module to manage taxonomy"""

from threading import Thread
from typing import Dict, List, Union

import requests
from flask import current_app
from requests.adapters import HTTPAdapter, Retry

session = requests.Session()

retries = Retry(total=5, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])

session.mount("https://", HTTPAdapter(max_retries=retries))

TAXHUB_API = (
    current_app.config["API_TAXHUB"] + "/"
    if current_app.config["API_TAXHUB"][-1] != "/"
    else current_app.config["API_TAXHUB"]
)

logger = current_app.logger

Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]

taxhub_full_lists = {}
taxonomy_lists = []


def taxhub_rest_get_taxon_list(taxhub_list_id: int) -> Dict:
    url = f"{TAXHUB_API}biblistes/taxons/{taxhub_list_id}"
    params = {
        "existing": "true",
        "order": "asc",
        "orderby": "taxref.nom_complet",
    }
    res = session.get(
        url,
        params=params,
        timeout=5,
    )
    res.raise_for_status()
    return res.json()


def taxhub_rest_get_all_lists() -> Dict:
    url = f"{TAXHUB_API}biblistes"
    res = session.get(
        url,
        timeout=5,
    )
    res.raise_for_status()
    if res.status_code == 200:
        try:
            taxa_lists = res.json()["data"]
            for taxa_list in taxa_lists:
                taxonomy_lists.append((taxa_list["id_liste"], taxa_list["nom_liste"]))
        except Exception as e:
            logger.critical(str(e))
        return res.json().get("data", [])


def taxhub_rest_get_taxon(taxhub_id: int) -> Taxon:
    if not taxhub_id:
        raise ValueError("Null value for taxhub taxon id")
    url = f"{TAXHUB_API}bibnoms/{taxhub_id}"
    for _ in range(5):
        try:
            res = session.get(url, timeout=5)
            break
        except requests.exceptions.ReadTimeout:
            continue

    res.raise_for_status()
    data = res.json()
    data.pop("listes", None)
    data.pop("attributs", None)
    if len(data["medias"]) > 0:
        media_types = ("Photo_gncitizen", "Photo_principale", "Photo")
        i = 0
        while i < len(media_types):
            filtered_medias = [
                d for d in data["medias"] if d["nom_type_media"] == media_types[i]
            ]
            if len(filtered_medias) >= 1:
                break
            i += 1
        medias = filtered_medias[:1]
        data["medias"] = medias

    return data


def make_taxon_repository(taxhub_list_id: int) -> List[Taxon]:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items")]
    r = [taxhub_rest_get_taxon(taxon_id) for taxon_id in taxon_ids]
    return r


def get_specie_from_cd_nom(cd_nom) -> Dict:
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """
    url = f"{TAXHUB_API}/taxref?is_ref=true&cd_nom={cd_nom}"
    params = {
        "is_ref": True,
        "cd_nom": cd_nom,
    }
    res = session.get(url, params=params)
    official_taxa = res.json().get("items", [{}])[0]

    common_names = official_taxa.get("nom_vern", "")
    common_name = common_names.split(",")[0]
    common_name_eng = official_taxa.get("nom_vern_eng", "")
    sci_name = official_taxa.get("lb_nom", "")

    taxref = {
        "common_name": common_name,
        "common_name_eng": common_name_eng,
        "sci_name": sci_name,
    }

    for k in official_taxa:
        taxref[k] = official_taxa.get(k, "")
    return taxref


def refresh_taxonlist() -> Dict:
    """refresh taxon list"""
    logger.info("Pre loading taxhub data (taxa lists and medias)")
    taxhub_lists = taxhub_rest_get_all_lists()
    if taxhub_lists:
        count = 0
        for taxhub_list in taxhub_lists:
            count += 1
            logger.info(f"loading list {count}/{len(taxhub_list)}")
            r = make_taxon_repository(taxhub_list["id_liste"])
            taxhub_full_lists[taxhub_list["id_liste"]] = r
    else:
        logger.warning("ERROR: No taxhub lists available")
    return taxhub_full_lists


daemon = Thread(target=refresh_taxonlist, daemon=True, name="Monitor")
daemon.start()
