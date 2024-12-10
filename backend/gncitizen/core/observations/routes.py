#!/usr/bin/env python3


import uuid
from typing import Dict, Tuple, Union

# from datetime import datetime
from flask import Blueprint, abort, current_app, json, request
from flask_jwt_extended import jwt_required
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import Point, asShape
from sqlalchemy import desc
from utils_flask_sqla.response import json_resp

from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.utils.env import admin
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.geo import get_municipality_id_from_wkb
from gncitizen.utils.helpers import get_filter_by_args
from gncitizen.utils.jwt import get_id_role_if_exists, get_user_if_exists
from gncitizen.utils.mail_check import send_user_email
from gncitizen.utils.media import save_upload_files
from gncitizen.utils.taxonomy import get_taxa_by_cd_nom, taxhub_rest_get_taxon_list, set_taxa_info_from_taxhub
from server import db

from .admin import ObservationView
from .models import (
    INVALIDATION_STATUSES,
    ObservationMediaModel,
    ObservationModel,
    ValidationStatus,
)

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
    "name",
)

if current_app.config.get("VERIFY_OBSERVATIONS_ENABLED", False):
    obs_keys = obs_keys + ("validation_status",)


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
            current_app.logger.debug("[post_observation] nowobs ", newobs)
        except Exception as e:
            current_app.logger.warning("[post_observation] data2db ", e)
            raise GeonatureApiError(e)

        try:
            _coordinates = json.loads(request_datas["geometry"])
            _point = Point(_coordinates["x"], _coordinates["y"])
            _shape = asShape(_point)
            newobs.geom = from_shape(Point(_shape), srid=4326)
            current_app.logger.debug("[post_observation] newobs geom ", newobs.geom)
        except Exception as e:
            current_app.logger.warning("[post_observation] coords ", e)
            raise GeonatureApiError(e) from e

        try:
            json_data = request_datas.get("json_data")
            if json_data is not None:
                newobs.json_data = json.loads(json_data)
        except Exception as e:
            current_app.logger.warning("[post_observation] json_data ", e)
            raise GeonatureApiError(e) from e

        role = get_user_if_exists()
        program = ProgramsModel.query.get(newobs.id_program)
        if role:
            newobs.id_role = role.id_user
            newobs.obs_txt = role.username
            newobs.email = role.email
        elif program.registration_required:
            return {"message": "registration required"}, 403
        else:
            if newobs.obs_txt is None or len(newobs.obs_txt) == 0:
                newobs.obs_txt = "Anonyme"

        # If municipality is not provided: call API_CITY
        if not newobs.municipality:
            newobs.municipality = get_municipality_id_from_wkb(_coordinates)

        # If taxon name is not provided: call taxhub
        if not newobs.name:
            taxon = get_taxa_by_cd_nom(newobs.cd_nom)
            newobs.name = taxon.get("nom_vern", "")

        newobs.validation_status = ValidationStatus.NOT_VALIDATED

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
            current_app.logger.debug(
                "[post_observation] ObsTax UPLOAD FILE {}".format(file)
            )
            newobs = db.session.query(ObservationModel).options(
                db.joinedload(ObservationModel.medias)
            ).get(newobs.id_observation)
            features = newobs.get_feature()

            id_taxonomy_list = newobs.program_ref.taxonomy_list
            params = {'cd_nom': newobs.cd_nom}
            # Appel synchrone à taxhub_rest_get_taxon_list
            if id_taxonomy_list is not None:
                taxon_list_data = taxhub_rest_get_taxon_list(id_taxonomy_list, params)
            else:
                taxon_list_data = None

            features_with_taxhub_info = set_taxa_info_from_taxhub(taxon_list_data, [features])
        except Exception as e:
            current_app.logger.warning(
                "[post_observation] ObsTax ERROR ON FILE SAVING", str(e)
            )
            # raise GeonatureApiError(e)
        return (
            {
                "message": "Nouvelle observation créée.",
                "features": [
                    features_with_taxhub_info[0],
                ],
                "type": "FeatureCollection",
            },
            200,
        )

    except Exception as e:
        current_app.logger.critical("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["GET"])
@json_resp
@jwt_required(optional=True)
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
    validation_process = args.pop("validation_process", False)
    paginate = "per_page" in args
    per_page = int(args.pop("per_page", 1000))
    page = int(args.pop("page", 1))

    id_role = get_id_role_if_exists()

    if validation_process and id_role:
        args["id_role__notequal"] = id_role

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


        if len(observations) > 0:
            id_taxonomy_list = observations[0].program_ref.taxonomy_list
            cd_nom_list = ','.join(map(str, set(obs.cd_nom for obs in observations)))
        else:
            id_taxonomy_list = None

     
        if len(cd_nom_list) > 0:
            params = {'cd_nom': cd_nom_list}
        else:
            params = {}

        if id_taxonomy_list is not None:
            taxon_list_data = taxhub_rest_get_taxon_list(id_taxonomy_list, params)
        else:
            taxon_list_data = None

        features_with_taxhub_info = set_taxa_info_from_taxhub(taxon_list_data, features)
        feature_collection = FeatureCollection(features_with_taxhub_info)

        if paginate:
            feature_collection["per_page"] = query.per_page
            feature_collection["page"] = query.page
            feature_collection["total"] = query.total
            feature_collection["pages"] = query.pages
        return feature_collection
    except Exception as e:
        raise e


@obstax_api.route("/validation_statuses")
@json_resp
def get_validation_statuses():
    return (
        {status.name: status.value for status in ValidationStatus},
        200,
    )


@obstax_api.route("/invalidation_statuses")
@json_resp
def get_invalidation_statuses():
    return (
        INVALIDATION_STATUSES,
        200,
    )


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
    current_user = get_user_if_exists()
    observation_to_update = ObservationModel.query.filter_by(
        id_observation=request.form.get("id_observation")
    )
    if (
        observation_to_update.one().id_role != current_user.id_user
        and not current_user.validator
    ):
        abort(403, "unauthorized")

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
            "id_validator",
        ]:
            if prop in update_data:
                update_obs[prop] = update_data[prop]
        if "geometry" in update_data:
            try:
                _coordinates = json.loads(update_data["geometry"])
                _point = Point(_coordinates["x"], _coordinates["y"])
                _shape = asShape(_point)
                update_obs["geom"] = from_shape(Point(_shape), srid=4326)
                if not update_obs["municipality"]:
                    update_obs["municipality"] = get_municipality_id_from_wkb(
                        _coordinates
                    )
            except Exception as e:
                current_app.logger.warning("[post_observation] coords ", e)
                raise GeonatureApiError(e)
        if "json_data" in update_data:
            try:
                json_data = update_data.get("json_data")
                if json_data is not None:
                    update_obs["json_data"] = json.loads(json_data)
            except Exception as e:
                current_app.logger.warning("[update_observation] json_data ", e)
                raise GeonatureApiError(e)

        observation_to_update.update(update_obs, synchronize_session="fetch")

        try:
            # Delete selected existing media
            id_media_to_delete = json.loads(update_data.get("delete_media", "[]"))
            if len(id_media_to_delete):
                db.session.query(ObservationMediaModel).filter(
                    ObservationMediaModel.id_media.in_(tuple(id_media_to_delete)),
                    ObservationMediaModel.id_data_source
                    == update_data.get("id_observation"),
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
            current_app.logger.debug(
                "[post_observation] ObsTax UPLOAD FILE {}".format(file)
            )

        except Exception as e:
            current_app.logger.warning(
                "[post_observation] ObsTax ERROR ON FILE SAVING", str(e)
            )
            # raise GeonatureApiError(e)
        obs_validation = (
            "non_validatable_status" in update_data
            and "report_observer" in update_data
            and "id_validator" in update_data
        )
        non_validatable_status = update_data.get("non_validatable_status")
        if obs_validation:
            if not current_app.config.get("VERIFY_OBSERVATIONS_ENABLED", False):
                abort(400, "Validation module is not enabled")
            if current_user.id_user == observation_to_update.one().id_role:
                abort(403, "You cannot validate your own observations")
            obs_to_update_obj = observation_to_update.one()
            new_validation_status = ValidationStatus.VALIDATED
            if non_validatable_status:
                status = [
                    s
                    for s in INVALIDATION_STATUSES
                    if s["value"] == non_validatable_status
                ][0]
                new_validation_status = ValidationStatus[status["link"]]

            obs_to_update_obj.validation_status = new_validation_status

        db.session.commit()

        if obs_validation and update_data.get("report_observer").lower() == "true":
            if non_validatable_status:
                message = (
                    status["twice"]
                    if status["twice"]
                    and obs_to_update_obj.validation_status.name == status["link"]
                    else status["mail"]
                )
            elif update_data.get("cd_nom") != observation_to_update.one().cd_nom:
                message = f"Nous avons bien reçu votre observation, merci beaucoup pour votre participation. Il s'avère que l'espèce que vous avez observée est un[e] {update_data.get('name')}."
            else:
                message = f"L'espèce que vous avez observée est bien un[e] {update_data.get('name')}. Merci pour votre participation !"
            if obs_to_update_obj.id_role is not None:
                try:
                    observer = obs_to_update_obj.observer
                    send_user_email(
                        subject=current_app.config["VALIDATION_EMAIL"]["SUBJECT"],
                        to=observer.email,
                        html_message=current_app.config["VALIDATION_EMAIL"][
                            "HTML_TEMPLATE"
                        ].format(
                            message=message,
                            obs_link=f"{current_app.config['URL_APPLICATION']}/programs/{obs_to_update_obj.id_program}/observations/{obs_to_update_obj.id_observation}",
                            username=observer.username,
                        ),
                    )
                except Exception as e:
                    current_app.logger.warning(
                        "send validation_email failed. %s", str(e)
                    )
                    return {
                        "message": f"""send validation_email failed: "{str(e)}" """
                    }, 400

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
