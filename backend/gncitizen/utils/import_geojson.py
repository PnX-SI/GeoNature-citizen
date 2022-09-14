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
    current_app.logger.critical(data)
    for i,f in enumerate(data['features']):
        current_app.logger.critical(f)
        store_site_feature(i, f, feature_name, program, site_type)
        store_visit_feature(i, f)


def store_site_feature(i, f, feature_name, program, site_type):
    """
    Store Site feature

    :param i: index
    :type i: integer
    :param f: geojson feature
    :param feature_name: name of the field that stores the name
    :type feature_name: string
    """
    new_site = SiteModel()
    #new_site.id_site = 1000 + i #TODO better way of doing this! Compute the latest id, or better, get the id after the creation for the visits
    new_site.name = f["properties"].get(feature_name)
    new_site.uuid_sinp = uuid.uuid4()
    new_site.obs_txt = 'test import'
    new_site.id_program = program
    new_site.id_type = site_type
    new_site.geom = convert_coordinates_to_geom(f)

    db.session.add(new_site)
    db.session.commit()


def store_visit_feature(i, f):
    """
    Store Visit feature

    :param i: index
    :type i: integer
    :param f: geojson feature
    :param feature_name: name of the field that stores the name
    :type feature_name: string
    """
    new_visit = VisitModel()
    new_visit.id_site = 1000 + i
    new_visit.obs_txt = 'test import'
    new_visit.json_data = convert_feature_to_json(f, 'ARHEM_ARBRES')

    db.session.add(new_visit)
    db.session.commit()
