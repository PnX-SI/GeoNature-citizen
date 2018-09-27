import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (jwt_optional)
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from marshmallow import ValidationError
from shapely.geometry import Point, asShape
from sqlalchemy.exc import IntegrityError

from gncitizen.utils.utilsjwt import get_id_role_if_exists
from gncitizen.utils.utilssqlalchemy import get_geojson_feature, json_resp
from gncitizen.utils.errors import GeonatureApiError
from server import db
from .models import SightModel
from .schemas import sight_schema
from gncitizen.core.auth.models import UserModel


routes = Blueprint('sights', __name__)


@routes.route('/sights/<int:pk>')
# @jwt_optional
# @json_resp
def get_sight(pk):
    """Gestion des observations
     If method is POST, add a sight to database else, return all sights
         ---
         tags:
          - Sights
         parameters:
          - name: pk
            in: path
            type: integer
            required: true
            example: 1
         definitions:
           cd_nom:
             type: integer
             description: cd_nom taxref
           geometry:
             type: dict
             description: Géométrie de la donnée
           name:
             type: string
           geom:
             type: geojson
         responses:
           200:
             description: A list of all sights
         """
    try:
        result = SightModel.query.get(pk)
        result_dict = result.as_dict(True)
        features = []
        feature = get_geojson_feature(result.geom)
        for k in result_dict:
            if k in ('specie','id_sight','obs_txt', 'count','date','comment','timestamp_create'):
                feature['properties'][k] = result_dict[k]
        features.append(feature) 
        return jsonify({'features': features}), 200
    except Exception as e:
        return jsonify({'message': e}), 400
    


@routes.route('/sights/', methods=['POST'])
@jwt_optional
def post_sight():
    """Gestion des observations
    If method is POST, add a sight to database else, return all sights
        ---
        tags:
          - Sights
        summary: Creates a new sight
        consumes:
          - application/json
        produces:
          - application/json
        parameters:
          - name: body
            in: body
            description: JSON parameters.
            required: true
            schema:
              id: Sight
              required:
                - cd_nom
                - date
                - geom
              properties:
                cd_nom:
                  type: string
                  description: CD_Nom Taxref
                  example: 3582
                obs_txt:
                  type: string
                  default:  none
                  required: false
                  example: Martin Dupont
                count:
                  type: integer
                  default:  none
                  example: 1
                date:
                  type: string
                  required: false
                  example: "2018-09-20"
                geometry:
                  type: string
                  example: {"type":"Point", "coordinates":[45,5]}
        responses:
          200:
            description: Adding a sight
        """
    request_datas = dict(request.get_json())

    if request.files:
        file = request.files['file']
        file.save()
    else:
        file = None

    datas2db = {}
    for field in request_datas:
        if hasattr(SightModel, field):
            datas2db[field] = request_datas[field]

    try:
        newsight = SightModel(**datas2db)
    except Exception as e:
        print(e)
        raise GeonatureApiError(e)

    try:
        shape = asShape(request_datas['geometry'])
        newsight.geom = from_shape(Point(shape), srid=4326)
    except Exception as e:
        print(e)
        raise GeonatureApiError(e)

    if newsight.count is None:
        count = 1

    id_role = get_id_role_if_exists()
    print(id_role)
    if id_role is not None:
        newsight.id_role = id_role
        role = UserModel.query.get(id_role)
        newsight.obs_txt = role.username
        newsight.email = role.email
    else:
        if newsight.obs_txt is None or len(newsight.obs_txt) == 0 :
            newsight.obs_txt = 'Anonyme'

    newsight.uuid_sinp = uuid.uuid4()

    db.session.add(newsight)
    db.session.commit()
    # Réponse en retour
    result = SightModel.query.get(newsight.id_sight)
    result_dict = result.as_dict(True)
    features = []
    feature = get_geojson_feature(result.geom)
    print("DICOOOOOOO", result_dict)
    for k in result_dict:
        if k in ('specie','id_sight','obs_txt', 'count','date','comment','timestamp_create'):
            feature['properties'][k] = result_dict[k]
    features.append(feature)
    return jsonify({
        'message': 'New sight created.',
        'features': features,
    }), 200


@routes.route('/sights/', methods=['GET'])
@jwt_optional
@json_resp
def get_sights():
    """Gestion des observations
    If method is POST, add a sight to database else, return all sights
        ---
        tags:
          - Sights
        definitions:
          cd_nom:
            type: integer
            description: cd_nom taxref
          geometry:
            type: dict
            description: Géométrie de la donnée
          name:
            type: string
          geom:
            type: geometry
        responses:
          200:
            description: A list of all sights
        """
    sights = SightModel.query.all()
    features = []
    for sight in sights:
        feature = get_geojson_feature(sight.geom)
        sight_dict = sight.as_dict(True)
        for k in sight_dict:
            if k in ('specie','id_sight','obs_txt', 'count','date','comment','timestamp_create'):
                feature['properties'][k] = sight_dict[k]
        features.append(feature)
    return FeatureCollection(features)
