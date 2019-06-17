#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import current_app

from gncitizen.core.ref_geo.models import LAreas, BibAreasTypes
from gncitizen.utils.env import db
from geoalchemy2 import func


# Get municipality id
#       newobs.municipality = get_municipality_id_from_wkb_point(
#           db, newobs.geom
#       )


def get_municipality_id_from_wkb(wkb):
    """Return municipality id from wkb geometry

    :param wkb: WKB geometry (epsg 4326)
    :type wkb: str

    :return: municipality id
    :rtype: int
    """
    try:
        srid = db.session.query(func.Find_SRID("ref_geo", "l_areas", "geom")).one()[0]
        current_app.logger.debug(
            "[get_municipality_id_from_wkb_point] SRID: {}".format(srid)
        )
        query = (
            db.session.query(LAreas)
            .join(BibAreasTypes)
            .filter(
                LAreas.geom.ST_Intersects(wkb.ST_Transform(2154)),
                BibAreasTypes.type_name == "Communes",
            )
            .first()
        )
        current_app.logger.debug(
            "[get_municipality_id_from_wkb_point] Query: {}".format(query)
        )
        municipality_id = query.id_area
        current_app.logger.debug(
            "[get_municipality_id_from_wkb_point] municipality id is {}".format(
                municipality_id
            )
        )
    except Exception as e:
        current_app.logger.debug(
            "[get_municipality_id_from_wkb_point] Can't get municipality id: {}".format(
                str(e)
            )
        )
        raise
        municipality_id = None
    return municipality_id


def get_area_informations(id_area):
    try:
        query = db.session.query(LAreas).filter(LAreas.id_area == id_area)
        result = query.first()
        area = {}
        area["name"] = result.area_name
        area["code"] = result.area_code
    except Exception as e:
        current_app.logger.debug(
            "[get_municipality_id_from_wkb_point] Can't get municipality id: {}".format(
                str(e)
            )
        )
        raise
        area = None
    return area
