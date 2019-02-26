#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage taxonomy"""

from gncitizen.core.taxonomy.models import Taxref

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
    sci_name = official_taxa.lb_nom
    taxref = {}
    taxref["common_name"] = common_name
    taxref["sci_name"] = sci_name
    return taxref