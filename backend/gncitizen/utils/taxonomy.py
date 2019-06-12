#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from typing import Dict, List
from functools import lru_cache
from flask import current_app

if current_app.config.get("API_TAXHUB") is None:
    from gncitizen.core.taxonomy.models import Taxref
else:
    import requests

    TAXHUB_API = (
        current_app.config["API_TAXHUB"] + "/"
        if current_app.config["API_TAXHUB"][-1] != "/"
        else current_app.config["API_TAXHUB"]
    )


def taxhub_rest_get_taxon_list(taxhub_list_id: int) -> Dict:
    payload = {"existing": "true", "order": "asc", "orderby": "taxref.nom_complet"}
    req = requests.get(
        "{}biblistes/taxons/{}".format(TAXHUB_API, taxhub_list_id),
        params=payload,
        timeout=1,
    )
    req.raise_for_status()
    return req.json()


def taxhub_rest_get_taxon(taxhub_id: int) -> Dict[List[str], List[str]]:
    req = requests.get("{}bibnoms/{}".format(TAXHUB_API, taxhub_id), timeout=1)
    req.raise_for_status()
    return req.json()


@lru_cache()
def mkTaxonRepository(taxhub_list_id: int) -> List:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items")]
    return [taxhub_rest_get_taxon(taxon_id) for taxon_id in taxon_ids]


def get_specie_from_cd_nom(cd_nom):
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """

    result = Taxref.query.filter_by(cd_nom=cd_nom).first()
    official_taxa = Taxref.query.filter_by(cd_nom=result.cd_ref).first()

    common_names = official_taxa.nom_vern
    common_name = common_names.split(",")[0]
    common_name_eng = official_taxa.get("nom_vern_eng")
    sci_name = official_taxa.lb_nom
    taxref = {}
    taxref["common_name"] = common_name
    taxref["common_name_eng"] = common_name_eng
    taxref["sci_name"] = sci_name
    for k in official_taxa:
        taxref[k] = official_taxa[k]
    return taxref
