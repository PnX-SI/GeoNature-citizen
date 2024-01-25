#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import uuid
from typing import Dict, Tuple, Union

# from datetime import datetime
from flask import Blueprint, current_app, json, request
from flask_jwt_extended import jwt_required
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import admin
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.geo import get_municipality_id_from_wkb
from gncitizen.utils.helpers import get_filter_by_args
from gncitizen.utils.jwt import get_id_role_if_exists, get_user_if_exists
from gncitizen.utils.media import save_upload_files
from gncitizen.utils.taxonomy import get_specie_from_cd_nom, taxhub_full_lists
from server import db
from shapely.geometry import Point, asShape
from sqlalchemy import desc, func
from utils_flask_sqla.response import json_resp
from utils_flask_sqla_geo.generic import get_geojson_feature

from .admin import ObservationView
from .models import ObservationMediaModel, ObservationModel

# from sqlalchemy import func


# DOING: TaxRef REST as alternative
# from gncitizen.core.taxonomy.routes import get_list


obstax_api = Blueprint("obstax", __name__)

admin.add_view(ObservationView(ObservationModel, db.session, "Observations"))

"""Used attributes in observation features"""
obs_keys = (
    "cd_nom",
    "id_observation",
    "observer",
    "id_program",
    "municipality",
    "obs_txt",
    "count",
    "date",
    "comment",
    "timestamp_create",
    "json_data",
)


def get_one_observation(pk):
    """Get one observation queryset"""
    observation = (
        db.session.query(
            ObservationModel,
        ).filter(ObservationModel.id_observation == pk)
    ).one()

    return observation


@obstax_api.route("/observations/<int:pk>", methods=["GET"])
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
        feature = get_one_observation(pk).get_feature()
        return feature, 200
    except Exception as e:
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["POST"])
@json_resp
@jwt_required(optional=True)
def post_observation():
    """Post a observation
    add a observation to database
        ---
        tags:
          - observations
        # security:
        #   - bearerAuth: []
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
                id_program:
                  type: string
                  description: Program unique id
                  example: 1
                  default: 1
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
        request_datas = request.form
        current_app.logger.debug("[post_observation] request data:", request_datas)
        datas2db = {}
        for field in request_datas:
            if hasattr(ObservationModel, field):
                datas2db[field] = request_datas[field]
        current_app.logger.debug("[post_observation] datas2db: %s", datas2db)

        try:
            newobs = ObservationModel(**datas2db)
        except Exception as e:
            current_app.logger.warning("[post_observation] data2db ", e)
            raise GeonatureApiError(e)

        try:
            _coordinates = json.loads(request_datas["geometry"])
            _point = Point(_coordinates["x"], _coordinates["y"])
            _shape = asShape(_point)
            newobs.geom = from_shape(Point(_shape), srid=4326)
        except Exception as e:
            current_app.logger.warning("[post_observation] coords ", e)
            raise GeonatureApiError(e)

        try:
            json_data = request_datas.get("json_data")
            if json_data is not None:
                newobs.json_data = json.loads(json_data)
        except Exception as e:
            current_app.logger.warning("[post_observation] json_data ", e)
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role:
            newobs.id_role = id_role
            role = UserModel.query.get(id_role)
            newobs.obs_txt = role.username
            newobs.email = role.email
        else:
            if newobs.obs_txt is None or len(newobs.obs_txt) == 0:
                newobs.obs_txt = "Anonyme"

        # If municipality is not provided: call API_CITY
        if not newobs.municipality:
            newobs.municipality = get_municipality_id_from_wkb(_coordinates)

        # If taxon name is not provided: call taxhub
        if not newobs.name:
            taxon = get_specie_from_cd_nom(newobs.cd_nom)
            newobs.name = taxon.get("nom_vern", "")

        newobs.uuid_sinp = uuid.uuid4()
        db.session.add(newobs)
        db.session.commit()
        current_app.logger.debug(newobs.as_dict())
        # Réponse en retour
        features = get_one_observation(newobs.id_observation).get_feature()
        current_app.logger.debug("FEATURES: {}".format(features))
        # Enregistrement de la photo et correspondance Obs Photo
        try:
            file = save_upload_files(
                request.files,
                "obstax",
                datas2db["cd_nom"],
                newobs.id_observation,
                ObservationMediaModel,
            )
            current_app.logger.debug("[post_observation] ObsTax UPLOAD FILE {}".format(file))
            features[0]["properties"]["images"] = file

        except Exception as e:
            current_app.logger.warning("[post_observation] ObsTax ERROR ON FILE SAVING", str(e))
            # raise GeonatureApiError(e)

        return (
            {"message": "Nouvelle observation créée.", "features": features},
            200,
        )

    except Exception as e:
        current_app.logger.critical("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["GET"])
@json_resp
def get_all_observations() -> Union[FeatureCollection, Tuple[Dict, int]]:
    """Get all observations from all programs
    GET
        ---
        tags:
          - observations
        responses:
          200:
            description: A list of all species lists
    """
    args = request.args.to_dict()
    paginate = "per_page" in args
    per_page = int(args.pop("per_page", 1000))
    page = int(args.pop("page", 1))
    filters = get_filter_by_args(ObservationModel, args)
    try:
        query = (
            db.session.query(
                ObservationModel,
            )
            .filter(ProgramsModel.is_active)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .order_by(desc(ObservationModel.timestamp_create))
            .filter(*filters)
        )

        if paginate:
            query = query.paginate(page=page, per_page=per_page)
            observations = query.items
        else:
            observations = query.all()
        features = [obs.get_feature() for obs in observations]
        feature_collection = FeatureCollection(features)

        if paginate:
            feature_collection["per_page"] = query.per_page
            feature_collection["page"] = query.page
            feature_collection["total"] = query.total
            feature_collection["pages"] = query.pages
        return feature_collection
    except Exception as e:
        # if current_app.config["DEBUG"]:
        # import traceback
        # import sys

        # import pdb
        # pdb.set_trace()
        # etype, value, tb = sys.exc_info()
        # trace = str(traceback.print_exception(etype, value, tb))
        # trace = traceback.format_exc()
        # return("<pre>" + trace + "</pre>"), 500
        raise e
        current_app.logger.critical("[get_program_observations] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/dev_rewards/<int:id>")
@json_resp
def get_rewards(id):
    from gncitizen.utils.rewards import get_badges, get_rewards

    badges, rewards = get_badges(id), get_rewards(id)
    current_app.logger.debug("rewards: %s", json.dumps(rewards, indent=4))
    return (
        {
            "badges": badges,
            "rewards": rewards,
            "REWARDS": current_app.config["REWARDS"],
        },
        200,
    )


@obstax_api.route("/observations", methods=["PATCH"])
@json_resp
@jwt_required()
def update_observation():
    try:
        update_data = request.form
        update_obs = {}
        for prop in [
            "cd_nom",
            "name",
            "count",
            "comment",
            "date",
            "municipality",
        ]:
            update_obs[prop] = update_data[prop]
        try:
            _coordinates = json.loads(update_data["geometry"])
            _point = Point(_coordinates["x"], _coordinates["y"])
            _shape = asShape(_point)
            update_obs["geom"] = from_shape(Point(_shape), srid=4326)
            if not update_obs["municipality"]:
                update_obs["municipality"] = get_municipality_id_from_wkb(_coordinates)
        except Exception as e:
            current_app.logger.warning("[post_observation] coords ", e)
            raise GeonatureApiError(e)

        try:
            json_data = update_data.get("json_data")
            if json_data is not None:
                update_obs["json_data"] = json.loads(json_data)
        except Exception as e:
            current_app.logger.warning("[update_observation] json_data ", e)
            raise GeonatureApiError(e)

        ObservationModel.query.filter_by(id_observation=update_data.get("id_observation")).update(
            update_obs, synchronize_session="fetch"
        )

        try:
            # Delete selected existing media
            id_media_to_delete = json.loads(update_data.get("delete_media"))
            if len(id_media_to_delete):
                db.session.query(ObservationMediaModel).filter(
                    ObservationMediaModel.id_media.in_(tuple(id_media_to_delete)),
                    ObservationMediaModel.id_data_source == update_data.get("id_observation"),
                ).delete(synchronize_session="fetch")
                db.session.query(MediaModel).filter(
                    MediaModel.id_media.in_(tuple(id_media_to_delete))
                ).delete(synchronize_session="fetch")
        except Exception as e:
            current_app.logger.warning("[update_observation] delete media ", e)
            raise GeonatureApiError(e)

        try:
            file = save_upload_files(
                request.files,
                "obstax",
                update_data.get("cd_nom"),
                update_data.get("id_observation"),
                ObservationMediaModel,
            )
            current_app.logger.debug("[post_observation] ObsTax UPLOAD FILE {}".format(file))

        except Exception as e:
            current_app.logger.warning("[post_observation] ObsTax ERROR ON FILE SAVING", str(e))
            # raise GeonatureApiError(e)

        db.session.commit()

        return ("observation updated successfully"), 200
    except Exception as e:
        current_app.logger.critical("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/observations/<int:id_obs>", methods=["DELETE"])
@json_resp
@jwt_required()
def delete_observation(id_obs):
    current_user = get_user_if_exists()

    try:
        if current_user:
            ObservationModel.query.filter(
                ObservationModel.id_observation == id_obs,
                ObservationModel.id_role == current_user.id_user,
            ).delete()
            db.session.commit()
            return {"message": "observation deleted successfully"}, 200
        else:
            return {"message": "delete unauthorized"}, 403
    except Exception as e:
        return {"message": str(e)}, 500
