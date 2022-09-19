import geojson
import json
import uuid
from server import db
from flask import current_app
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString, Polygon, asShape

from gncitizen.core.sites.models import SiteModel, VisitModel

def convert_coordinates_to_geom(f):
    """ Returns a valid shape for creating a WGS84 geometry from a feature """

    shape = asShape(f["geometry"])
    if f["geometry"]["type"] == "Point":
        return from_shape(Point(shape), srid=4326)
    elif f["geometry"]["type"] == "LineString":
        return from_shape(LineString(shape), srid=4326)
    elif f["geometry"]["type"] == "Polygon":
        return from_shape(Polygon(shape), srid=4326)

def convert_feature_to_json(feature, mapping_dict):
    """ Returns a object of properties """

    res = {}

    mapping_dict_left = dict(filter(lambda item: item[0].startswith('field_mapping_left'), mapping_dict.items()))

    for i,v in enumerate(mapping_dict_left.items()):
        value = feature["properties"].get(mapping_dict.get(f'field_mapping_left_{i}'))
        if value:
            res[mapping_dict.get(f'field_mapping_right_{i}')] = value

    return res

def import_geojson(data, request_form):
    """ Import a geojson """

    mapping_dict = dict(filter(lambda item: item[0].startswith('field_mapping_'), request_form.items()))

    # current_app.logger.critical(mapping_dict)
    for i,f in enumerate(data['features']):
        # current_app.logger.critical(f)
        id_site = store_site_feature(
            f,
            request_form['username'],
            request_form['feature_name'],
            request_form['program'],
            request_form['site_type']
        )

        store_visit_feature(f, request_form['username'], id_site, mapping_dict)


def store_site_feature(f, username, feature_name, program, site_type):
    """
    Store Site feature

    :param f: geojson feature
    :type f: feature object
    :param username: name for the username
    :type username: string
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
    new_site.obs_txt = username
    new_site.id_program = program
    new_site.id_type = site_type
    new_site.geom = convert_coordinates_to_geom(f)

    db.session.add(new_site)
    db.session.commit()

    return new_site.id_site


def store_visit_feature(f, username, id_site, mapping_dict):
    """
    Store Visit feature

    :param f: geojson feature
    :type f: feature object
    :param username: name for the username
    :type username: string
    :param feature_name: name of the field that stores the name
    :param id_site: id of the site that was just uploaded
    :type id_site: integer
    :type feature_name: string
    :return: void
    """
    new_visit = VisitModel()
    new_visit.id_site = id_site
    new_visit.obs_txt = username
    new_visit.json_data = convert_feature_to_json(f, mapping_dict)
    db.session.add(new_visit)
    db.session.commit()
