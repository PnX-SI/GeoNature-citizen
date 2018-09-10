import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (jwt_optional)
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from marshmallow import ValidationError
from shapely.geometry import Point
from sqlalchemy.exc import IntegrityError

from gncitizen.utils.utilsjwt import get_id_role_if_exists
from gncitizen.utils.utilssqlalchemy import get_geojson_feature, json_resp
from server import db
from .models import SightModel
from .schemas import sight_schema

routes = Blueprint('sights', __name__)


# @routes.route('/sights/', methods=['GET'])
# @jwt_optional
# def get_sights():
#     sights = SightModel.query.all()
#     result = sights_schema.dump(sights)
#     return jsonify({'sights': result})


@routes.route('/sights/<int:pk>')
# @jwt_optional
@json_resp
def get_sight(pk):
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
    try:
        sight = SightModel.query.filter_by(id_sight=pk).limit(1)
        features = []
        for d in sight:
            feature = get_geojson_feature(d.geom)
            feature['properties'] = d.as_dict(True)
            features.append(feature)
    except IntegrityError:
        return jsonify({'message': 'Sight could not be found.'}), 400
    return FeatureCollection(features)


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
                count:
                  type: integer
                  default:  none
                  example: 5
                date:
                  type: string
                  format: date
                  required: false
                  example: 2018-09-06
                geom:
                  type: string
                  example: {"type":"Point", "coordinates":[45,5]}
=======
                cd_nom
                  type: string
                  description : CD_Nom Taxref
                  example : 65111
                obs_txt
                  type: string
                  default :  none
                  required : false
                count
                  type: integer
                  default :  none
                name: date
                  type: date
                  required: false
                  defaul:  none
                geom
                  type: string
                  required: true
>>>>>>> eab19846eac4c3c832f3fdcf40f0f12fa0a36238
        definitions:
          cd_nom:
            type: integer
          obs_txt:
            type: string
          name:
            type: string
          geom:
            type: string
        responses:
          200:
            description: Adding a sight
        """
    json_data = request.get_json()
    medias = request.files
    print('jsondata: ', json_data)
    if not json_data:
        return jsonify({'message': 'No input data provided'}), 400
    # Validate and deserialize input
    # info: manque la date
    try:
        data, errors = sight_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422
    try:
        cd_nom = data['cd_nom']
        try:
            geom = from_shape(Point(data['geom']['coordinates']), srid=4326)
        except:
            return jsonify('pb geom'), 422
        if data['count']:
            count = data['count']
        else:
            count = 1
        id_role = get_id_role_if_exists()
        if id_role is None:
            obs_txt = data['obs_txt']
        else:
            obs_txt = 'Anonyme'
        try:
            email = data['email']
        except:
            email = None
        # try:
        #     query = LiMunicipalities.query.join(LAreas, LAreas.ip_area == LiMunicipalities.id_area).add_columns(LiMunicipalities.nom_com).first()
        #     print(query)
        #     # municipality = db.session.query(query).filter(func.ST_Intersects(query.geom, geom))
        # except:
        #     return jsonify('impossible de trouver la commune'), 422
    except:
        return jsonify('Données incomplètes'), 422

    # Si l'utilisateur est connecté, attribut ajoute l'id_role de l'utilisateur.
    # Sinon, complète le champ obs_txt.
    # Si obs_txt est vice, indique 'Anonyme'

    # Create new sight
    sight = SightModel(
        cd_nom=cd_nom,
        count=count,
        timestamp_create=datetime.utcnow(),
        uuid_sinp=uuid.uuid4(),
        date=datetime.utcnow(),
        email=email,
        id_role=id_role,
        obs_txt=obs_txt,
        # municipality=municipality,
        geom=geom
    )
    db.session.add(sight)
    db.session.commit()
    # Réponse en retour
    result = SightModel.query.get(sight.id_sight)
    features = []
    feature = get_geojson_feature(result.geom)
    feature['properties'] = result.as_dict(True)
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
    for d in sights:
        feature = get_geojson_feature(d.geom)
        feature['properties'] = d.as_dict(True)
        features.append(feature)
    return FeatureCollection(features)
