#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import uuid
from enum import Enum
from typing import Dict, Tuple, Union

# from datetime import datetime
import requests
from flask import Blueprint, current_app, json, request, send_from_directory, abort
from flask_jwt_extended import jwt_required
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import Point, asShape
from sqlalchemy import desc, func
from utils_flask_sqla.response import json_resp
from utils_flask_sqla_geo.generic import get_geojson_feature

from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import MEDIA_DIR, admin, taxhub_lists_url
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.geo import (
    get_municipality_id_from_wkb
)
from gncitizen.utils.jwt import get_id_role_if_exists, get_user_if_exists
from gncitizen.utils.media import save_upload_files
from gncitizen.utils.taxonomy import get_specie_from_cd_nom, mkTaxonRepository, taxhub_rest_get_all_lists
from server import db
from gncitizen.utils.mail_check import send_user_email

from .admin import ObservationView
from .models import ObservationMediaModel, ObservationModel, ValidationStatus, INVALIDATION_STATUSES

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

if current_app.config.get("VERIFY_OBSERVATIONS_ENABLED", False):
    obs_keys = obs_keys + ("validation_status",)


def generate_observation_geojson(id_observation):
    """generate observation in geojson format from observation id

    :param id_observation: Observation unique id
    :type id_observation: int

    :return features: Observations as a Feature dict
    :rtype features: dict
    """

    # Crée le dictionnaire de l'observation
    observation = (
        db.session.query(
            ObservationModel,
            UserModel.username,
        )
        .join(
            UserModel, ObservationModel.id_role == UserModel.id_user, full=True
        )
        .filter(ObservationModel.id_observation == id_observation)
    ).one()

    photos = (
        db.session.query(MediaModel, ObservationModel)
        .filter(ObservationModel.id_observation == id_observation)
        .join(
            ObservationMediaModel,
            ObservationMediaModel.id_data_source
            == ObservationModel.id_observation,
        )
        .join(
            MediaModel, ObservationMediaModel.id_media == MediaModel.id_media
        )
        .all()
    )

    result_dict = observation.ObservationModel.as_dict(True)
    result_dict["observer"] = {"username": observation.username}
    name = observation.ObservationModel.municipality
    result_dict["municipality"] = {
        "name": name
    }

    # Populate "geometry"
    features = []
    feature = get_geojson_feature(observation.ObservationModel.geom)

    # Populate "properties"
    for k in result_dict:
        if k in obs_keys:
            feature["properties"][k] = result_dict[k].name if isinstance(result_dict[k], Enum) else result_dict[k]

    feature["properties"]["photos"] = [
        {
            "url": "/media/{}".format(p.MediaModel.filename),
            "date": p.ObservationModel.as_dict()["date"],
            "author": p.ObservationModel.obs_txt,
        }
        for p in photos
    ]

    taxhub_list_id = (
        ProgramsModel.query.filter_by(
            id_program=observation.ObservationModel.id_program
        )
        .one()
        .taxonomy_list
    )
    taxon_repository = mkTaxonRepository(taxhub_list_id)
    try:
        taxon = next(
            taxon
            for taxon in taxon_repository
            if taxon and taxon["cd_nom"] == feature["properties"]["cd_nom"]
        )
        feature["properties"]["taxref"] = taxon["taxref"]
        feature["properties"]["medias"] = taxon["medias"]
    except StopIteration:
        pass

    features.append(feature)
    return features


def format_observations_dashboards(observations):
    try:
        if current_app.config.get("API_TAXHUB") is not None:
            taxon_repository = []
            taxhub_list_id = []
            for observation in observations:
                if (
                    observation.ProgramsModel.taxonomy_list
                    not in taxhub_list_id
                ):
                    taxhub_list_id.append(
                        observation.ProgramsModel.taxonomy_list
                    )
            for tax_list in taxhub_list_id:
                taxon_repository.append(mkTaxonRepository(tax_list))

        features = []
    except Exception as e:
        return {"message": str(e)}, 500

    for observation in observations:
        feature = get_geojson_feature(observation.ObservationModel.geom)
        name = observation.ObservationModel.municipality
        feature["properties"]["municipality"] = {
            "name": name
        }

        # Observer
        feature["properties"]["observer"] = {
            "username": observation.username
        }
        # Observer submitted media
        feature["properties"]["image"] = (
            "/".join(
                [
                    "/api",
                    current_app.config["MEDIA_FOLDER"],
                    observation.images[0][0],
                ]
            )
            if observation.images and observation.images != [[None, None]]
            else None
        )
        # Photos
        feature["properties"]["photos"] = [
            {"url": "/media/{}".format(filename), "id_media": id_media}
            for filename, id_media in observation.images
            if id_media is not None
        ]
        # Municipality
        observation_dict = observation.ObservationModel.as_dict(True)
        for k in observation_dict:
            if k in obs_keys and k != "municipality":
                feature["properties"][k] = observation_dict[k].name if isinstance(observation_dict[k], Enum) else observation_dict[k]
        # Program
        program_dict = observation.ProgramsModel.as_dict(True)
        for program in program_dict:
            if program == "title":
                feature["properties"]["program_title"] = program_dict[
                    program
                ]
        # TaxRef
        try:
            for taxon_rep in taxon_repository:
                for taxon in taxon_rep:
                    if (
                        taxon["taxref"]["cd_nom"]
                        == observation.ObservationModel.cd_nom
                    ):
                        feature["properties"]["nom_francais"] = taxon[
                            "nom_francais"
                        ]
                        feature["properties"]["taxref"] = taxon["taxref"]
                        feature["properties"]["medias"] = taxon["medias"]

        except StopIteration:
            pass
        features.append(feature)

    return FeatureCollection(features), 200


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
        features = generate_observation_geojson(pk)
        return {"features": features}, 200
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
        current_app.logger.debug(
            "[post_observation] request data:", request_datas
        )
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
            newobs.name = taxon.get('nom_vern', '')

        if current_app.config.get("VERIFY_OBSERVATIONS_ENABLED", False):
            newobs.validation_status = ValidationStatus.NOT_VALIDATED

        newobs.uuid_sinp = uuid.uuid4()
        db.session.add(newobs)
        db.session.commit()
        current_app.logger.debug(newobs.as_dict())
        # Réponse en retour
        features = generate_observation_geojson(newobs.id_observation)
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
            features[0]["properties"]["images"] = file

        except Exception as e:
            current_app.logger.warning(
                "[post_observation] ObsTax ERROR ON FILE SAVING", str(e)
            )
            # raise GeonatureApiError(e)

        return (
            {"message": "Nouvelle observation créée.", "features": features},
            200,
        )

    except Exception as e:
        current_app.logger.critical("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


# @obstax_api.route("/observations", methods=["GET"])
# @json_resp
# def get_observations():
#     """Get all observations
#         ---
#         tags:
#           - observations
#         definitions:
#           cd_nom:
#             type: integer
#             description: cd_nom taxref
#           geometry:
#             type: dict
#             description: Géométrie de la donnée
#           name:
#             type: string
#           geom:
#             type: geometry
#         responses:
#           200:
#             description: A list of all observations
#         """
#     try:
#         observations = ObservationModel.query.order_by(
#             desc(ObservationModel.timestamp_create)
#         ).all()
#         features = []
#         for observation in observations:
#             feature = get_geojson_feature(observation.geom)
#             observation_dict = observation.as_dict(True)
#             for k in observation_dict:
#                 if k in obs_keys:
#                     feature["properties"][k] = observation_dict[k]

#             taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
#             for k in taxref:
#                 feature["properties"][k] = taxref[k]
#             features.append(feature)
#         return FeatureCollection(features)
#     except Exception as e:
#         current_app.logger.critical("[get_observations] Error: %s", str(e))
#         return {"message": str(e)}, 400


# @obstax_api.route("/observations/lists/<int:id>", methods=["GET"])
# @json_resp
# def get_observations_from_list(id):  # noqa: A002
#     """Get all observations from a taxonomy list
#     GET
#         ---
#         tags:
#           - observations
#         parameters:
#           - name: id
#             in: path
#             type: integer
#             required: true
#             example: 1
#         definitions:
#           cd_nom:
#             type: integer
#             description: cd_nom taxref
#           geometry:
#             type: dict
#             description: Géométrie de la donnée
#           name:
#             type: string
#           geom:
#             type: geometry
#         responses:
#           200:
#             description: A list of all species lists
#         """
#     # taxhub_url = load_config()['TAXHUB_API_URL']
#     taxhub_lists_taxa_url = taxhub_lists_url + "taxons/" + str(id)
#     rtaxa = requests.get(taxhub_lists_taxa_url)
#     if rtaxa.status_code == 200:
#         try:
#             taxa = rtaxa.json()["items"]
#             current_app.logger.debug(taxa)
#             features = []
#             for t in taxa:
#                 current_app.logger.debug("R", t["cd_nom"])
#                 datas = (
#                     ObservationModel.query.filter_by(cd_nom=t["cd_nom"])
#                     .order_by(desc(ObservationModel.timestamp_create))
#                     .all()
#                 )
#                 for d in datas:
#                     feature = get_geojson_feature(d.geom)
#                     observation_dict = d.as_dict(True)
#                     for k in observation_dict:
#                         if k in obs_keys:
#                             feature["properties"][k] = observation_dict[k]
#                     taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
#                     for k in taxref:
#                         feature["properties"][k] = taxref[k]
#                     features.append(feature)
#             return FeatureCollection(features)
#         except Exception as e:
#             current_app.logger.critical(
#                 "[get_observations_from_list] Error: %s", str(e)
#             )
#             return {"message": str(e)}, 400


@obstax_api.route("/programs/<int:program_id>/observations", methods=["GET"])
@json_resp
def get_program_observations(
    program_id: int,
) -> Union[FeatureCollection, Tuple[Dict, int]]:
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
        observations = (
            db.session.query(
                ObservationModel,
                UserModel.username,
                UserModel.avatar,
                func.array_agg(MediaModel.filename).label("images"),
            )
            .filter(
                ObservationModel.id_program == program_id,
                ProgramsModel.is_active,
            )
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source
                == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(
                UserModel,
                ObservationModel.id_role == UserModel.id_user,
                full=True,
            )
            .group_by(
                ObservationModel.id_observation,
                UserModel.username,
                UserModel.avatar,
            )
        )

        observations = observations.order_by(
            desc(ObservationModel.timestamp_create)
        )
        # current_app.logger.debug(str(observations))
        observations = observations.all()
        if current_app.config.get("API_TAXHUB") is not None:
            taxhub_list_id = (
                ProgramsModel.query.filter_by(id_program=program_id)
                .one()
                .taxonomy_list
            )
            taxon_repository = mkTaxonRepository(taxhub_list_id)

        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            name = observation.ObservationModel.municipality
            feature["properties"]["municipality"] = {
                "name": name
            }

            # Observer
            feature["properties"]["observer"] = {
                "username": observation.username,
                "userAvatar": observation.avatar,
            }

            # Observer submitted media
            feature["properties"]["image"] = (
                "/".join(
                    [
                        "/api",
                        current_app.config["MEDIA_FOLDER"],
                        observation.images[0],
                    ]
                )
                if observation.images and observation.images != [None]
                else None
            )

            # Municipality
            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys and k != "municipality":
                    feature["properties"][k] = observation_dict[k].name if isinstance(observation_dict[k], Enum) else observation_dict[k]

            try:
                taxon = next(
                    taxon
                    for taxon in taxon_repository
                    if taxon
                    and taxon["cd_nom"] == feature["properties"]["cd_nom"]
                )
                feature["properties"]["nom_francais"] = taxon["nom_francais"]
                feature["properties"]["taxref"] = taxon["taxref"]
                feature["properties"]["medias"] = taxon["medias"]
            except StopIteration:
                pass
            features.append(feature)

        return FeatureCollection(features)

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
        current_app.logger.critical(
            "[get_program_observations] Error: %s", str(e)
        )
        return {"message": str(e)}, 400


@obstax_api.route("/programs/all/observations", methods=["GET"])
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
    try:
        observations = (
            db.session.query(
                ObservationModel,
                UserModel.username,
                MediaModel.filename.label("image"),
            )
            .filter(ProgramsModel.is_active)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source
                == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(
                UserModel,
                ObservationModel.id_role == UserModel.id_user,
                full=True,
            )
            .group_by(
                ObservationModel.id_observation,
                UserModel.username,
                UserModel.avatar,
            )
        )

        observations = observations.order_by(
            desc(ObservationModel.timestamp_create)
        )
        observations = observations.all()

        # loop to retrieve taxonomic data from all programs
        taxon_repository = []
        if current_app.config.get("API_TAXHUB") is not None:  # and use_taxhub_param:
            programs = db.session.query(ProgramsModel).filter(ProgramsModel.id_program.in_(
                {observation.ObservationModel.id_program for observation in observations}
            ))

            processed_taxhub_ids = []
            for program in programs:
                taxhub_list_id = (
                    ProgramsModel.query.filter_by(
                        id_program=program.id_program
                    )
                    .one()
                    .taxonomy_list
                )

                if taxhub_list_id in processed_taxhub_ids:
                    continue
                processed_taxhub_ids.append(taxhub_list_id)

                taxon_data = mkTaxonRepository(taxhub_list_id)
                try:
                    for taxon in taxon_data:
                        if taxon not in taxon_repository:
                            taxon_repository.append(taxon)
                except Exception as e:
                    current_app.logger.critical(str(e))

        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            name = observation.ObservationModel.municipality
            feature["properties"]["municipality"] = {
                "name": name
            }

            # Observer
            feature["properties"]["observer"] = {
                "username": observation.username
            }

            # Observer submitted media
            feature["properties"]["image"] = (
                "/".join(
                    [
                        "/api",
                        current_app.config["MEDIA_FOLDER"],
                        observation.images[0],
                    ]
                )
                if observation.images and observation.images != [None]
                else None
            )

            # Municipality
            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys and k != "municipality":
                    feature["properties"][k] = observation_dict[k].name if isinstance(observation_dict[k], Enum) else observation_dict[k]

            try:
                taxon = next(
                    taxon
                    for taxon in taxon_repository
                    if taxon
                    and taxon["cd_nom"] == feature["properties"]["cd_nom"]
                )
                feature["properties"]["taxref"] = taxon["taxref"]
                feature["properties"]["medias"] = taxon["medias"]
            except StopIteration:
                pass
            features.append(feature)

        return FeatureCollection(features)

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
        current_app.logger.critical(
            "[get_program_observations] Error: %s", str(e)
        )
        return {"message": str(e)}, 400


@obstax_api.route("/validation_statuses")
@json_resp
def get_validation_statuses():
    return (
        {
            status.name: status.value for status in ValidationStatus
        },
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


@obstax_api.route("/observations/users/<int:user_id>", methods=["GET"])
@json_resp
def get_observations_by_user_id(user_id):
    try:
        observations = (
            db.session.query(
                ObservationModel,
                ProgramsModel,
                UserModel.username,
                func.json_agg(
                    func.json_build_array(
                        MediaModel.filename, MediaModel.id_media
                    )
                ).label("images")
            )
            .filter(ObservationModel.id_role == user_id)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
                full=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source
                == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(
                UserModel,
                ObservationModel.id_role == UserModel.id_user,
                full=True,
            )
            .group_by(
                ObservationModel.id_observation,
                ProgramsModel.id_program,
                UserModel.username,
            )
        )

        observations = observations.order_by(
            desc(ObservationModel.timestamp_create)
        )
        # current_app.logger.debug(str(observations))
        return format_observations_dashboards(observations.all())

    except Exception as e:
        raise e
        current_app.logger.critical(
            "[get_program_observations] Error: %s", str(e)
        )
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["GET"])
@json_resp
def get_observations():
    exclude_status_param = request.args.get("exclude_status", default="")
    # use_taxhub_param = request.args.get("use_taxhub", default=True, type=lambda value: value.lower() != "false")

    filters = [ProgramsModel.is_active]
    if exclude_status_param:
        try:
            filters.append(
                ObservationModel.validation_status != ValidationStatus[exclude_status_param]
            )
        except KeyError:
            pass

    try:
        observations = (
            db.session.query(
                ObservationModel,
                ProgramsModel,
                UserModel.username,
                func.json_agg(
                    func.json_build_array(
                        MediaModel.filename, MediaModel.id_media
                    )
                ).label("images")
            )
            .filter(*filters)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source
                == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(
                UserModel,
                ObservationModel.id_role == UserModel.id_user,
                full=True,
            )
            .group_by(
                ObservationModel.id_observation,
                ProgramsModel.id_program,
                UserModel.username,
            )
        )

        observations = observations.order_by(
            desc(ObservationModel.timestamp_create)
        )
        # current_app.logger.debug(str(observations))
        return format_observations_dashboards(observations.all())

    except Exception as e:
        raise e
        current_app.logger.critical(
            "[get_program_observations] Error: %s", str(e)
        )
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["PATCH"])
@json_resp
@jwt_required()
def update_observation():
    current_user = get_user_if_exists()
    observation_to_update = ObservationModel.query.filter_by(
        id_observation=request.form.get("id_observation")
    )
    if observation_to_update.one().id_role != current_user.id_user and not current_user.validator:
        abort(403, "unauthorized")

    try:
        update_data = request.form
        update_obs = {}
        for prop in ["cd_nom", "name", "count", "comment", "date", "municipality", "id_validator"]:
            if prop in update_data:
                update_obs[prop] = update_data[prop]
        if "geometry" in update_data:
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
                    ObservationMediaModel.id_media.in_(
                        tuple(id_media_to_delete)
                    ),
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

        if obs_validation := "non_validatable_status" in update_data and "report_observer" in update_data and "id_validator" in update_data:
            obs_to_update_obj = observation_to_update.one()
            new_validation_status = ValidationStatus.VALIDATED
            if non_validatable_status := update_data.get("non_validatable_status"):
                status = [s for s in INVALIDATION_STATUSES if s["value"] == non_validatable_status][0]
                new_validation_status = ValidationStatus[status["link"]]

            obs_to_update_obj.validation_status = new_validation_status

        db.session.commit()

        if obs_validation and update_data.get("report_observer").lower() == "true":
            if non_validatable_status:
                message = status["twice"] if status["twice"] and obs_to_update_obj.validation_status.name == status["link"] else status["mail"]
            elif update_data.get("cd_nom") != observation_to_update.one().cd_nom:
                message = f"Nous avons bien reçu votre photo, merci beaucoup pour votre participation. Il s'avère que l'espèce que vous avez observée est un[e] {update_data.get('name')}."
            else:
                message = f"L'espèce que vous avez observée est bien un[e] {update_data.get('name')}. Merci pour votre participation !"
            try:
                send_user_email(
                    subject=current_app.config["VALIDATION_EMAIL"]["SUBJECT"],
                    to=UserModel.query.get(obs_to_update_obj.id_role).email,
                    html_message=current_app.config["VALIDATION_EMAIL"]["HTML_TEMPLATE"].format(
                        message=message,
                        obs_link=f"{current_app.config['URL_APPLICATION']}/programs/{obs_to_update_obj.id_program}/observations/{obs_to_update_obj.id_observation}",
                    ),
                )
            except Exception as e:
                current_app.logger.warning("send validation_email failed. %s", str(e))
                return {
                    "message": """ send validation_email failed: "{}".""".format(str(e))
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
            return ("observation deleted successfully"), 200
        else:
            return ("delete unauthorized"), 403
    except Exception as e:
        return {"message": str(e)}, 500
