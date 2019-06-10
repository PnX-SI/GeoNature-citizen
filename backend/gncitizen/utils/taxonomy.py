#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from functools import lru_cache
from flask import current_app

if current_app.config.get("API_TAXHUB") is None:
    from gncitizen.core.taxonomy.models import Taxref, TMedias

else:
    import requests

    TAXHUB_API = current_app.config["API_TAXHUB"] + \
        "/" if current_app.config["API_TAXHUB"][-1] != "/" else current_app.config["API_TAXHUB"]


def taxhub_rest_get_taxon_list(_id: int):

    payload = {
        "existing": "true",
        "order": "asc",
        "orderby": "taxref.nom_complet"
    }
    req = requests.get(
        "{}biblistes/taxons/{}".format(TAXHUB_API, _id),
        params=payload,
        timeout=1
    )
    req.raise_for_status()
    return req.json()


def taxhub_rest_get_taxon(taxhub_id):
    req = requests.get(
        "{}bibnoms/{}".format(TAXHUB_API, taxhub_id))
    req.raise_for_status()
    taxon_res = req.json()

    data = dict()
    data["nom"] = {
        k: taxon_res[k]
        for k in taxon_res
        if k in {"id_nom", "cd_nom", "cd_ref", "nom_vern", "nom_vern_eng"}
    }
    data["medias"] = [
        media
        for media in taxon_res["medias"]
        if media
        # and not media["supprime"]
        and media["is_public"]
        and media["url"]
    ]
    data["taxref"] = taxon_res["taxref"]
    return data["nom"], data["medias"]


def taxhub_rest_get_full_taxa_from_list(taxon_list_id):
    taxa = taxhub_rest_get_taxon_list(taxon_list_id)
    taxon_ids = [item["id_nom"] for item in taxa.get("items")]

    results = []
    for taxon_id in taxon_ids:
        data = taxhub_rest_get_taxon(taxon_id)
        results.append(data)

    return results


@lru_cache(maxsize=64)
def taxhub_rest_medias(cd_nom):
    req = requests.get(
        "{}bibnoms/taxoninfo/{}".format(TAXHUB_API, cd_nom))
    # "{}tmedias/bycdref/{}".format(TAXHUB_API, cdref))
    req.raise_for_status()
    return req.json()


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
    return taxref
