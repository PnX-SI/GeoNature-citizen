# import os
import datetime
import uuid

import requests
from flask import (
    Blueprint,
    request,
    # redirect,
    # flash,
    # send_from_directory,
    # url_for,
    current_app,
)

# from werkzeug import secure_filename
from flask_jwt_extended import jwt_optional
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import Point, asShape

from gncitizen.core.taxonomy.models import Taxref
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import taxhub_lists_url, MEDIA_DIR, allowed_file
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.utilsjwt import get_id_role_if_exists
from gncitizen.utils.utilssqlalchemy import get_geojson_feature, json_resp
from server import db
from .models import ObservationModel

routes = Blueprint("observations", __name__)
obs_keys = (
    "cd_nom",
    "id_observation",
    "obs_txt",
    "count",
    "date",
    "comment",
    "timestamp_create",
)


def get_specie_from_cd_nom(cd_nom):
    """Renvoie le nom français et scientifique officiel (cd_nom = cd_ref) de l'espèce d'après le cd_nom"""  # noqa: E501
    result = Taxref.query.filter_by(cd_nom=cd_nom).first()
    official_taxa = Taxref.query.filter_by(cd_nom=result.cd_ref).first()
    common_names = official_taxa.nom_vern
    common_name = common_names.split(",")[0]
    sci_name = official_taxa.lb_nom
    taxref = {}
    taxref["common_name"] = common_name
    taxref["sci_name"] = sci_name
    return taxref


def generate_observation_geojson(id_observation):
    """generate observation in geojson format from observation id"""

    # Crée le dictionnaire de l'observation
    result = ObservationModel.query.get(id_observation)
    result_dict = result.as_dict(True)

    # Populate "geometry"
    features = []
    feature = get_geojson_feature(result.geom)

    # Populate "properties"
    for k in result_dict:
        if k in obs_keys:
            feature["properties"][k] = result_dict[k]

    # Get official taxref scientific and common names (first one) from cd_nom where cd_nom = cd_ref  # noqa: E501
    taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
    for k in taxref:
        feature["properties"][k] = taxref[k]
    features.append(feature)
    return features


@routes.route("/observations/<int:pk>")
@json_resp
def get_observation(pk):
    """Get on observation by id
         ---
         tags:
          - observations
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
             description: A list of all observations
         """
    try:
        features = generate_observation_geojson(pk)
        return {"features": features}, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@routes.route("/photo", methods=["POST"])
@json_resp
def post_photo():
    """Test pour l'import de médias """
    if request.files:
        current_app.logger.debug(request.files)
        photo = request.files["photo"]
        current_app.logger.debug("FILE >>>", photo)
        current_app.logger.debug(allowed_file(photo))
        ext = photo.rsplit(".", 1).lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = "observation_sp" + 0000 + "_" + timestamp + ext
        path = MEDIA_DIR + "/" + filename
        photo.save(path)
        current_app.logger.debug(path)


@routes.route("/observations", methods=["POST"])
@json_resp
@jwt_optional
def post_observation():
    """Post a observation
    add a observation to database
        ---
        tags:
          - observations
        summary: Creates a new observation (JWT auth optional, if used, obs_txt replaced by username)
        consumes:
          - application/json
          - multipart/form-data
        produces:
          - application/json
        parameters:
          - name: json
            in: body
            description: JSON parameters.
            required: true
            schema:
              id: observation
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
                  description: User name
                  required: false
                  example: Martin Dupont
                count:
                  type: integer
                  description: Number of individuals
                  default:  none
                  example: 1
                date:
                  type: string
                  description: Date
                  required: false
                  example: "2018-09-20"
                geometry:
                  type: string
                  description: Geometry (GeoJson format)
                  example: {"type":"Point", "coordinates":[5,45]}
        responses:
          200:
            description: Adding a observation
        """
    try:
        request_datas = dict(request.get_json())

        datas2db = {}
        for field in request_datas:
            if hasattr(ObservationModel, field):
                datas2db[field] = request_datas[field]
        current_app.logger.debug("datas2db: %s", datas2db)
        try:
            if request.files:
                current_app.logger.debug("request.files: %s", request.files)
                file = request.files.get("photo", None)
                current_app.logger.debug("file: %s", file)
                if file and allowed_file(file):
                    ext = file.rsplit(".", 1).lower()
                    timestamp = datetime.datetime.now().strftime(
                        "%Y%m%d_%H%M%S"
                    )  # noqa: E501
                    filename = (
                        "obstax_" + datas2db["cd_nom"] + "_" + timestamp + ext
                    )
                    path = MEDIA_DIR + "/" + filename
                    file.save(path)
                    current_app.logger.debug("path: %s", path)
                    datas2db["photo"] = filename
        except Exception as e:
            current_app.logger.debug("file ", e)
            raise GeonatureApiError(e)

        else:
            file = None

        try:
            newobservation = ObservationModel(**datas2db)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        try:
            shape = asShape(request_datas["geometry"])
            newobservation.geom = from_shape(Point(shape), srid=4326)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role:
            newobservation.id_role = id_role
            role = UserModel.query.get(id_role)
            newobservation.obs_txt = role.username
            newobservation.email = role.email
        else:
            if (
                newobservation.obs_txt is None
                or len(newobservation.obs_txt) == 0
            ):
                newobservation.obs_txt = "Anonyme"

        newobservation.uuid_sinp = uuid.uuid4()

        db.session.add(newobservation)
        db.session.commit()
        # Réponse en retour
        features = generate_observation_geojson(newobservation.id_observation)
        return (
            {"message": "New observation created.", "features": features},
            200,
        )
    except Exception as e:
        current_app.logger.warning("Error: %s", str(e))
        return {"error_message": str(e)}, 400


@routes.route("/observations", methods=["GET"])
@json_resp
def get_observations():
    """Get all observations
        ---
        tags:
          - observations
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
            description: A list of all observations
        """
    try:
        observations = ObservationModel.query.all()
        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.geom)
            observation_dict = observation.as_dict(True)
            for k in observation_dict:
                if k in obs_keys:
                    feature["properties"][k] = observation_dict[k]
            taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
            for k in taxref:
                feature["properties"][k] = taxref[k]
            features.append(feature)
        return FeatureCollection(features)
    except Exception as e:
        return {"error_message": str(e)}, 400


@routes.route("/observations/lists/<int:id>", methods=["GET"])
@json_resp
def get_observations_from_list(id):  # noqa: A002
    """Get all observations from a taxonomy list
    GET
        ---
        tags:
          - observations
        parameters:
          - name: id
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
            type: geometry
        responses:
          200:
            description: A list of all species lists
        """
    # taxhub_url = load_config()['TAXHUB_API_URL']
    taxhub_lists_taxa_url = taxhub_lists_url + "taxons/" + str(id)
    rtaxa = requests.get(taxhub_lists_taxa_url)
    if rtaxa.status_code == 200:
        try:
            taxa = rtaxa.json()["items"]
            current_app.logger.debug(taxa)
            features = []
            for t in taxa:
                current_app.logger.debug("R", t["cd_nom"])
                datas = ObservationModel.query.filter_by(
                    cd_nom=t["cd_nom"]
                ).all()
                for d in datas:
                    feature = get_geojson_feature(d.geom)
                    observation_dict = d.as_dict(True)
                    for k in observation_dict:
                        if k in obs_keys:
                            feature["properties"][k] = observation_dict[k]
                    taxref = get_specie_from_cd_nom(
                        feature["properties"]["cd_nom"]
                    )
                    for k in taxref:
                        feature["properties"][k] = taxref[k]
                    features.append(feature)
            return FeatureCollection(features)
        except Exception as e:
            return {"error_message": str(e)}, 400


@routes.route("programs/<int:id>/observations", methods=["GET"])
@json_resp
def get_program_observations(id):
    """Get all observations from a program
    GET
        ---
        tags:
          - observations
        parameters:
          - name: id
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
            type: geometry
        responses:
          200:
            description: A list of all species lists
        """
    try:
        observations = db.session\
            .query(
                ObservationModel,
                (
                    LAreas.area_name + ' (' + LAreas.area_code + ')'
                ).label('municipality'))\
            .filter_by(id_program=id)\
            .join(
                LAreas,
                LAreas.id_area == ObservationModel.municipality,
                isouter=True)\
            .all()
        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            feature['properties']['municipality'] = observation.municipality
            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys:
                    feature["properties"][k] = observation_dict[k]
            taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
            for k in taxref:
                feature["properties"][k] = taxref[k]
            features.append(feature)
        current_app.logger.debug(FeatureCollection(features))
        return FeatureCollection(features)
    except Exception as e:
        return {"error_message": str(e)}, 400
