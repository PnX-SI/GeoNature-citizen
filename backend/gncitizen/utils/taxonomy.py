#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from functools import lru_cache
from typing import Dict, List, Union

import requests
from flask import current_app

TAXHUB_API = (
    current_app.config["API_TAXHUB"] + "/"
    if current_app.config["API_TAXHUB"][-1] != "/"
    else current_app.config["API_TAXHUB"]
)

logger = current_app.logger

Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]


def taxhub_rest_get_taxon_list(taxhub_list_id: int) -> Dict:
    payload = {
        "existing": "true",
        "order": "asc",
        "orderby": "taxref.nom_complet",
    }
    res = requests.get(
        "{}biblistes/taxons/{}".format(TAXHUB_API, taxhub_list_id),
        params=payload,
        timeout=1,
    )
    logger.debug(f"<taxhub_rest_get_taxon_list> URL {res.url}")
    res.raise_for_status()
    return res.json()


def taxhub_rest_get_all_lists() -> Dict:
    res = requests.get("{}biblistes".format(TAXHUB_API))
    logger.debug(f"<taxhub_rest_get_all_lists> URL {res.url}")
    res.raise_for_status()
    return res.json().get("data", [])


def taxhub_rest_get_taxon(taxhub_id: int) -> Taxon:
    if not taxhub_id:
        raise ValueError("Null value for taxhub taxon id")
    res = requests.get("{}bibnoms/{}".format(TAXHUB_API, taxhub_id), timeout=1)
    logger.debug(f"<taxhub_rest_get_taxon> URL {res.url}")
    res.raise_for_status()
    data = res.json()
    data.pop("listes", None)
    data.pop("attributs", None)
    if len(data["medias"]) > 0:
        media_types = ("Photo_gncitizen", "Photo_principale", "Photo")
        i = 0
        while i < len(media_types):
            filtered_medias = [d for d in data["medias"] if d["nom_type_media"] == media_types[i]]
            if len(filtered_medias) >= 1:
                break
            i += 1
        medias = filtered_medias[:1]
        data["medias"] = medias

    return data


@lru_cache()
def mkTaxonRepository(taxhub_list_id: int) -> List[Taxon]:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items")]
    r = [taxhub_rest_get_taxon(taxon_id) for taxon_id in taxon_ids]

    return sorted(r, key=lambda item: item["nom_francais"])


def get_specie_from_cd_nom(cd_nom):
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """

    res = requests.get(f"{TAXHUB_API}/taxref?is_ref=true&cd_nom={cd_nom}")
    official_taxa = res.json().get("items", [{}])[0]

    common_names = official_taxa.get("nom_vern", "")
    common_name = common_names.split(",")[0]
    common_name_eng = official_taxa.get("nom_vern_eng", "")
    sci_name = official_taxa.get("lb_nom", "")
    taxref = {}
    taxref["common_name"] = common_name
    taxref["common_name_eng"] = common_name_eng
    taxref["sci_name"] = sci_name
    for k in official_taxa:
        taxref[k] = official_taxa.get(k, "")
    return taxref
