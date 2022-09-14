import geojson
import json
import uuid
from server import db
from flask import current_app
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon, asShape

from gncitizen.core.sites.models import SiteModel, VisitModel

def convert_coordinates_to_geom(f):
    """ Returns a valid shape for creating a WGS84 geometry from an array of coordinates """

    shape = asShape(f["geometry"])
    if f["geometry"]["type"] == "Point":
        return from_shape(Point(shape), srid=4326)
    elif f["geometry"]["type"] == "LineString":
        return from_shape(LineString(shape), srid=4326)
    elif f["geometry"]["type"] == "Polygon":
        return from_shape(Polygon(shape), srid=4326)

def safe_json(string):
    """ Encodes a string a json and escape single quote for postgresql"""
    return json.dumps(string.replace("'", "''"))

def safe_text(string):
    return string.replace("'", "''")

def convert_feature_to_json(feature, program_name):
    """ Returns a string with a json of properties """

    res = f'"hauteur": {feature["properties"]["H"]},' if feature["properties"]["H"] else ''
    res += f'"etatsanitaire": {feature["properties"]["SANIT"]},' if feature["properties"]["SANIT"] else ''
    res += f'"remarques": {safe_json(feature["properties"]["COMMENTAIR"])},' if feature["properties"]["COMMENTAIR"] else ''

    if program_name == 'ARHEM_ARBRES':
        res += f'"circonference": {feature["properties"]["CIRC"]},' if feature["properties"]["CIRC"] else ''
        res += f'"espece": {safe_json(feature["properties"]["SPFR"])},' if feature["properties"]["SPFR"] else ''
    elif program_name == 'ARHEM_HAIES':
        res += f'"espece_1": {safe_json(feature["properties"]["SPFR"])},' if feature["properties"]["SPFR"] else ''

    return '\'{' + res[:-1] + '}\','

def import_geojson(data, feature_name, program, site_type):
    """ Import a geojson """

    for i,f in enumerate(data['features']):
        current_app.logger.critical(f)
        id_site = store_site_feature(f, feature_name, program, site_type)
        store_visit_feature(f, id_site)


def store_site_feature(f, feature_name, program, site_type):
    """
    Store Site feature

    :param f: geojson feature
    :type f: feature object
    :param feature_name: name of the field that stores the name
    :type feature_name: string
    :param program: id of the program to which data will be uploaded
    :type program: integer
    :param site_type: id of the site_type for the feature
    :type site_type: integer
    :return: id_site
    :rtype: integer
    """
    new_site = SiteModel()
    new_site.name = f["properties"].get(feature_name)
    new_site.uuid_sinp = uuid.uuid4()
    new_site.obs_txt = 'test import'
    new_site.id_program = program
    new_site.id_type = site_type
    new_site.geom = convert_coordinates_to_geom(f)

    db.session.add(new_site)
    db.session.commit()

    return new_site.id_site


def store_visit_feature(f, id_site):
    """
    Store Visit feature

    :param f: geojson feature
    :type f: feature object
    :param feature_name: name of the field that stores the name
    :param id_site: id of the site that was just uploaded
    :type id_site: integer
    :type feature_name: string
    :return: void
    """
    new_visit = VisitModel()
    new_visit.id_site = id_site
    new_visit.obs_txt = 'test import'
    new_visit.json_data = convert_feature_to_json(f, 'ARHEM_ARBRES') #TODO, check the results, quid ARHEM_ARBRES (hardcoded??)

    db.session.add(new_visit)
    db.session.commit()
