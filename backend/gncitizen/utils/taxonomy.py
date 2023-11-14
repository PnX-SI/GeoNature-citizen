#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from typing import Dict, List, Union

import requests
from flask import current_app
from requests.adapters import HTTPAdapter, Retry

session = requests.Session()

retries = Retry(
    total=5, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504]
)

session.mount("https://", HTTPAdapter(max_retries=retries))

TAXHUB_API = (
    current_app.config["API_TAXHUB"] + "/"
    if current_app.config["API_TAXHUB"][-1] != "/"
    else current_app.config["API_TAXHUB"]
)

logger = current_app.logger

Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]

taxhub_lists = {}


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
    logger.debug(f"<taxhub_rest_get_taxon_list> URL {res.url}")
    res.raise_for_status()
    return res.json()


def taxhub_rest_get_all_lists() -> Dict:
    res = session.get("{}biblistes".format(TAXHUB_API))
    logger.debug(f"<taxhub_rest_get_all_lists> URL {res.url}")
    res.raise_for_status()
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

    logger.debug(f"<taxhub_rest_get_taxon> URL {res.url}")
    res.raise_for_status()
    data = res.json()
    data.pop("listes", None)
    data.pop("attributs", None)
    logger.debug(f"MEDIAS Length = {len(data['medias'])}")
    if len(data["medias"]) > 0:
        media_types = ("Photo_gncitizen", "Photo_principale", "Photo")
        i = 0
        while i < len(media_types):
            filtered_medias = [
                d
                for d in data["medias"]
                if d["nom_type_media"] == media_types[i]
            ]
            if len(filtered_medias) >= 1:
                break
            i += 1
        medias = filtered_medias[:1]
        logger.debug(f"MEDIAS Filtered {medias}")
        data["medias"] = medias

    return data


def mkTaxonRepository(taxhub_list_id: int) -> List[Taxon]:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items")]
    r = [taxhub_rest_get_taxon(taxon_id) for taxon_id in taxon_ids]
    return r


def get_specie_from_cd_nom(cd_nom):
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


def refresh_taxonlist():
    """refresh taxon list"""
    lists = taxhub_rest_get_all_lists()
    if lists:
        for list in lists:
            print(f"LIST {list}")
            r = mkTaxonRepository(list["id_liste"])
            taxhub_lists[list["id_liste"]] = r
            print(r)
    print(f"taxhub_lists {taxhub_lists}")
    return taxhub_lists


refresh_taxonlist()
