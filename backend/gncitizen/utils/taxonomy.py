#!/usr/bin/env python3

"""A module to manage taxonomy"""

from threading import Thread
import unicodedata
from typing import Dict, List, Optional, Union

import requests
from flask import current_app
from requests.adapters import HTTPAdapter, Retry

session = requests.Session()

retries = Retry(total=5, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])

session.mount("https://", HTTPAdapter(max_retries=retries))


logger = current_app.logger


TAXHUB_API = (
    current_app.config["API_TAXHUB"] + "/"
    if current_app.config["API_TAXHUB"][-1] != "/"
    else current_app.config["API_TAXHUB"]
)

if "TAXHUB_LISTS_EXCLUDE" in current_app.config:
    excluded_list_ids = set(current_app.config["TAXHUB_LISTS_EXCLUDE"])
else:
    excluded_list_ids = set()

logger.info(f"TAXHUB_EXCLUDED_LISTS {excluded_list_ids}")

Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]

taxhub_full_lists = {}
taxonomy_lists = []


def taxhub_rest_get_taxon_list(taxhub_list_id: int, params_to_update: Dict = {}) -> Dict:
    url = f"{TAXHUB_API}taxref"
    params = {
        "id_liste": taxhub_list_id,
        "fields": "medias,attributs",
        "existing": "true",
        "order": "asc",
        "orderby": "nom_complet",
        "limit": 100,
    }
    if params_to_update:
        params.update(params_to_update)
    res = session.get(
        url,
        params=params,
        timeout=5,
    )
    res.raise_for_status()
    return res.json()


def taxhub_rest_get_all_lists() -> Optional[Dict]:
    url = f"{TAXHUB_API}biblistes"
    res = session.get(
        url,
        timeout=5,
    )
    res.raise_for_status()
    if res.status_code == 200:
        try:
            taxa_lists = res.json()["data"]
            taxa_lists = [taxa for taxa in taxa_lists if not taxa["id_liste"] in excluded_list_ids]
            for taxa_list in taxa_lists:
                taxonomy_lists.append((taxa_list["id_liste"], f'[{taxa_list["code_liste"]}] {taxa_list["nom_liste"]} ({taxa_list["nb_taxons"]} taxon(s))'))
            print(f"taxonomy_lists {taxonomy_lists}")
        except Exception as e:
            logger.critical(str(e))
        return res.json().get("data", [])
    return None



def get_specie_from_cd_nom(cd_nom) -> Dict:
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """
    url = f"{TAXHUB_API}taxref/{cd_nom}"
    params = {
        "is_ref": True,
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
    logger.info("Pre loading taxhub lists information (nb lists, list names)")
    taxhub_lists = taxhub_rest_get_all_lists()
    if not taxhub_lists:
        logger.warning("ERROR: No taxhub lists available")
    return taxhub_lists

def get_all_medias_types() -> Dict:
    """get all medias types"""
    url = f"{TAXHUB_API}tmedias/types"
    res = session.get(
        url,
        timeout=5,
    )
    res.raise_for_status()
    if res.status_code == 200:
        try:
            medias_types = res.json()
        except Exception as e:
            logger.critical(str(e))
        return medias_types
    return None


def get_all_attributes() -> Dict:
    """get all attributs types"""
    url = f"{TAXHUB_API}bibattributs"
    res = session.get(
        url,
        timeout=5,
    )
    res.raise_for_status()
    if res.status_code == 200:
        try:
            attributes = res.json()
        except Exception as e:
            logger.critical(str(e))
        return attributes
    return None


daemon = Thread(target=refresh_taxonlist, daemon=True, name="Monitor")
daemon.start()


def reformat_taxa(taxa):
    result = []

    items = taxa.get("items", [taxa])
    # On parcours chaque item de taxa et on peut ici choisir de garder ou non certains champs pertinent pour citizen
    # TODO: pour éviter de tout charger peut être alléger l'objet taxref si pas utilisé ?
    TAXREF_FIELDS = [
        "cd_nom",
        "cd_ref",
        "cd_sup",
        "cd_taxsup",
        "classe",
        "famille",
        "group1_inpn",
        "group2_inpn",
        "id_habitat",
        "id_rang",
        "id_statut",
        "lb_auteur",
        "lb_nom",
        "nom_complet",
        "nom_complet_html",
        "nom_valide",
        "nom_vern",
        "nom_vern_eng",
        "ordre",
        "phylum",
        "regne",
        "sous_famille",
        "tribu",
        "url"
    ]

    for item in items:
        taxon = {
            "medias": [],
            "attributs": [],
            "cd_nom": item.get("cd_nom"),
            "nom_francais": None,
            "taxref": { field: item.get(field) for field in TAXREF_FIELDS }
        }
        # Récupérer tous les médias sans condition de types
        for media in item.get("medias", []):
            taxon["medias"].append(media)

        # Récupérer tous les attributs si non vides
        for attribut in item.get("attributs", []):
            if attribut:  # Vérifie simplement que l'attribut n'est pas vide
                taxon["attributs"].append(attribut)

        result.append(taxon)
    return result


def get_taxa_by_cd_nom(cd_nom,  params_to_update: Dict = {}) -> Dict:
    """get taxa datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int
    :rtype: dict
    """
    # url = f"{TAXHUB_API}/taxref?is_ref=true&cd_nom={cd_nom}"
    url = f"{TAXHUB_API}taxref/{cd_nom}"
    params = {
        "is_ref": True,
        # "cd_nom": cd_nom,
    }
    if params_to_update:
        params.update(params_to_update)
    res = session.get(url, params=params)
    taxon_info = res.json()
    return reformat_taxa(taxon_info)


def set_taxa_info_from_taxhub(taxhub_data, features):
    for taxon in taxhub_data["items"]:  # Parcours des taxons dans les données TaxHub
        for feature in features:  # Parcours des features
            if feature["properties"]["cd_nom"] == taxon["cd_nom"]:
                excluded_keys = {"medias", "attributs"}
                filtered_data = {key: value for key, value in taxon.items() if key not in excluded_keys}

                if "taxref" not in feature["properties"] or feature["properties"]["taxref"] is None:
                    feature["properties"]["taxref"] = {}
                feature["properties"]["taxref"].update(filtered_data)

                if "medias" not in feature["properties"]:
                    feature["properties"]["medias"] = []

                feature["properties"]["medias"] = taxon.get("medias", [])

    return features
