#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import uuid
from typing import Union, Tuple, Dict

# from sqlalchemy import func

# from datetime import datetime
import requests
from flask import Blueprint, current_app, request, json, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from geojson import FeatureCollection
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, asShape
from sqlalchemy import desc
from sqlalchemy import func
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.ref_geo.models import LAreas
from .models import ObservationMediaModel, ObservationModel
from gncitizen.core.users.models import UserModel

from gncitizen.core.taxonomy.models import Taxref, TMedias

# DOING: TaxRef REST as alternative
# from gncitizen.core.taxonomy.routes import get_list

from gncitizen.utils.env import taxhub_lists_url, MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.jwt import get_id_role_if_exists
from gncitizen.utils.geo import get_municipality_id_from_wkb  # , get_area_informations
from gncitizen.utils.media import save_upload_files
from gncitizen.utils.sqlalchemy import get_geojson_feature, json_resp
from gncitizen.utils.taxonomy import get_specie_from_cd_nom, mkTaxonRepository
from server import db


obstax_api = Blueprint("obstax", __name__)

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
            ObservationModel, UserModel.username, LAreas.area_name, LAreas.area_code
        )
        .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
        .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True)
        .filter(ObservationModel.id_observation == id_observation)
    ).one()

    photos = (
        db.session.query(MediaModel, ObservationModel)
        .filter(ObservationModel.id_observation == id_observation)
        .join(
            ObservationMediaModel,
            ObservationMediaModel.id_data_source == ObservationModel.id_observation,
        )
        .join(MediaModel, ObservationMediaModel.id_media == MediaModel.id_media)
        .all()
    )

    result_dict = observation.ObservationModel.as_dict(True)
    result_dict["observer"] = {"username": observation.username}
    result_dict["municipality"] = {
        "name": observation.area_name,
        "code": observation.area_code,
    }

    # Populate "geometry"
    features = []
    feature = get_geojson_feature(observation.ObservationModel.geom)

    # Populate "properties"
    for k in result_dict:
        if k in obs_keys:
            feature["properties"][k] = result_dict[k]

    feature["properties"]["photos"] = [
        {
            "url": "/media/{}".format(p.MediaModel.filename),
            "date": p.ObservationModel.as_dict()["date"],
            "author": p.ObservationModel.obs_txt,
        }
        for p in photos
    ]

    if current_app.config.get("API_TAXHUB") is None:
        current_app.logger.debug("Selecting TaxHub Medias schema.")
        # Get official taxref scientific and common names (first one) from cd_nom where cd_nom = cd_ref
        # taxref = get_specie_from_cd_nom(feature["properties"]["cd_nom"])
        # for k in taxref:
        #     feature["properties"][k] = taxref[k]
        taxref = Taxref.query.filter(
            Taxref.cd_nom == observation.ObservationModel.cd_nom
        ).first()
        if taxref:
            feature["properties"]["taxref"] = taxref.as_dict(True)

        medias = TMedias.query.filter(
            TMedias.cd_ref == observation.ObservationModel.cd_nom
        ).all()
        if medias:
            feature["properties"]["medias"] = [media.as_dict(True) for media in medias]

    else:
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

        newobs.municipality = get_municipality_id_from_wkb(newobs.geom)
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

        return ({"message": "Nouvelle observation créée.", "features": features}, 200)

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
                LAreas.area_name,
                LAreas.area_code,
            )
            .filter(ObservationModel.id_program == program_id, ProgramsModel.is_active)
            .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
            .group_by(
                ObservationModel.id_observation,
                UserModel.username,
                UserModel.avatar,
                LAreas.area_name,
                LAreas.area_code,
            )
        )

        observations = observations.order_by(desc(ObservationModel.timestamp_create))
        # current_app.logger.debug(str(observations))
        observations = observations.all()
        if current_app.config.get("API_TAXHUB") is not None:
            taxhub_list_id = (
                ProgramsModel.query.filter_by(id_program=program_id).one().taxonomy_list
            )
            taxon_repository = mkTaxonRepository(taxhub_list_id)

        features = []
        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            feature["properties"]["municipality"] = {
                "name": observation.area_name,
                "code": observation.area_code,
            }

            # Observer
            feature["properties"]["observer"] = {
                "username": observation.username,
                "userAvatar": observation.avatar,
            }

            # Observer submitted media
            feature["properties"]["image"] = (
                "/".join(
                    ["/api", current_app.config["MEDIA_FOLDER"], observation.images[0]]
                )
                if observation.images and observation.images != [None]
                else None
            )

            # Municipality
            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys and k != "municipality":
                    feature["properties"][k] = observation_dict[k]

            # TaxRef
            # if current_app.config.get("API_TAXHUB") is None:
            #     taxref = Taxref.query.filter(
            #         Taxref.cd_nom == observation.ObservationModel.cd_nom
            #     ).first()
            #     if taxref:
            #         feature["properties"]["taxref"] = taxref.as_dict(True)

            #     medias = TMedias.query.filter(
            #         TMedias.cd_ref == observation.ObservationModel.cd_nom
            #     ).all()
            #     if medias:
            #         feature["properties"]["medias"] = [
            #             media.as_dict(True) for media in medias
            #         ]
            # else:
            try:
                taxon = next(
                    taxon
                    for taxon in taxon_repository
                    if taxon and taxon["cd_nom"] == feature["properties"]["cd_nom"]
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
        current_app.logger.critical("[get_program_observations] Error: %s", str(e))
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
                LAreas.area_name,
                LAreas.area_code,
            )
            .filter(ProgramsModel.is_active)
            .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
        )

        observations = observations.order_by(desc(ObservationModel.timestamp_create))
        # current_app.logger.debug(str(observations))
        observations = observations.all()

        # loop to retrieve taxonomic data from all programs
        if current_app.config.get("API_TAXHUB") is not None:
            programs = ProgramsModel.query.all()
            taxon_repository = []
            for program in programs:
                taxhub_list_id = (
                    ProgramsModel.query.filter_by(id_program=program.id_program)
                    .one()
                    .taxonomy_list
                )
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
            feature["properties"]["municipality"] = {
                "name": observation.area_name,
                "code": observation.area_code,
            }

            # Observer
            feature["properties"]["observer"] = {"username": observation.username}

            # Observer submitted media
            feature["properties"]["image"] = (
                "/".join(
                    ["/api", current_app.config["MEDIA_FOLDER"], observation.image,]
                )
                if observation.image
                else None
            )

            # Municipality
            observation_dict = observation.ObservationModel.as_dict(True)
            for k in observation_dict:
                if k in obs_keys and k != "municipality":
                    feature["properties"][k] = observation_dict[k]

            # TaxRef
            if current_app.config.get("API_TAXHUB") is None:
                taxref = Taxref.query.filter(
                    Taxref.cd_nom == observation.ObservationModel.cd_nom
                ).first()
                if taxref:
                    feature["properties"]["taxref"] = taxref.as_dict(True)

                medias = TMedias.query.filter(
                    TMedias.cd_ref == observation.ObservationModel.cd_nom
                ).all()
                if medias:
                    feature["properties"]["medias"] = [
                        media.as_dict(True) for media in medias
                    ]
            else:
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
        current_app.logger.critical("[get_program_observations] Error: %s", str(e))
        return {"message": str(e)}, 400




@obstax_api.route("/dev_rewards/<int:id>")
@json_resp
def get_rewards(id):
    from gncitizen.utils.rewards import get_rewards, get_badges

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
                    func.json_build_array(MediaModel.filename, MediaModel.id_media)
                ).label("images"),
                LAreas.area_name,
                LAreas.area_code,
            )
            .filter(ObservationModel.id_role == user_id)
            .join(LAreas, LAreas.id_area == ObservationModel.municipality, isouter=True)
            .join(
                ProgramsModel,
                ProgramsModel.id_program == ObservationModel.id_program,
                isouter=True,
                full=True,
            )
            .join(
                ObservationMediaModel,
                ObservationMediaModel.id_data_source == ObservationModel.id_observation,
                isouter=True,
            )
            .join(
                MediaModel,
                ObservationMediaModel.id_media == MediaModel.id_media,
                isouter=True,
            )
            .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
            .group_by(
                ObservationModel.id_observation,
                ProgramsModel.id_program,
                UserModel.username,
                LAreas.area_name,
                LAreas.area_code,
            )
        )

        observations = observations.order_by(desc(ObservationModel.timestamp_create))
        # current_app.logger.debug(str(observations))
        observations = observations.all()

        try:
            if current_app.config.get("API_TAXHUB") is not None:
                taxon_repository = []
                taxhub_list_id = []
                for observation in observations:
                    if observation.ProgramsModel.taxonomy_list not in taxhub_list_id:
                        taxhub_list_id.append(observation.ProgramsModel.taxonomy_list)
                for tax_list in taxhub_list_id:
                    taxon_repository.append(mkTaxonRepository(tax_list))

            features = []
        except Exception as e:
            return {"message": str(e)}, 500

        for observation in observations:
            feature = get_geojson_feature(observation.ObservationModel.geom)
            feature["properties"]["municipality"] = {
                "name": observation.area_name,
                "code": observation.area_code,
            }

            # Observer
            feature["properties"]["observer"] = {"username": observation.username}
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
                    feature["properties"][k] = observation_dict[k]
            # Program
            program_dict = observation.ProgramsModel.as_dict(True)
            for program in program_dict:
                if program == "title":
                    feature["properties"]["program_title"] = program_dict[program]
            # TaxRef
            if current_app.config.get("API_TAXHUB") is None:
                taxref = Taxref.query.filter(
                    Taxref.cd_nom == observation.ObservationModel.cd_nom
                ).first()
                if taxref:
                    feature["properties"]["taxref"] = taxref.as_dict(True)

                medias = TMedias.query.filter(
                    TMedias.cd_ref == observation.ObservationModel.cd_nom
                ).all()
                if medias:
                    feature["properties"]["medias"] = [
                        media.as_dict(True) for media in medias
                    ]
            else:
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

    except Exception as e:
        raise e
        current_app.logger.critical("[get_program_observations] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/observations", methods=["PATCH"])
@json_resp
@jwt_required()
def update_observation():
    try:
        update_data = request.form
        update_obs = {}
        for prop in ["cd_nom", "count", "comment", "date"]:
            update_obs[prop] = update_data[prop]
        try:
            _coordinates = json.loads(update_data["geometry"])
            _point = Point(_coordinates["x"], _coordinates["y"])
            _shape = asShape(_point)
            update_obs["geom"] = from_shape(Point(_shape), srid=4326)
            update_obs["municipality"] = get_municipality_id_from_wkb(
                update_obs["geom"]
            )
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

        ObservationModel.query.filter_by(
            id_observation=update_data.get("id_observation")
        ).update(update_obs, synchronize_session="fetch")

        try:
            # Delete selected existing media
            id_media_to_delete = json.loads(update_data.get("delete_media"))
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

        db.session.commit()

        return ("observation updated successfully"), 200
    except Exception as e:
        current_app.logger.critical("[post_observation] Error: %s", str(e))
        return {"message": str(e)}, 400


@obstax_api.route("/observations/<int:idObs>", methods=["DELETE"])
@json_resp
@jwt_required()
def delete_observation(idObs):
    current_user = get_jwt_identity()
    try:
        observation = (
            db.session.query(ObservationModel, UserModel)
            .filter(ObservationModel.id_observation == idObs)
            .join(UserModel, ObservationModel.id_role == UserModel.id_user, full=True)
            .first()
        )
        if current_user == observation.UserModel.email:
            ObservationModel.query.filter_by(id_observation=idObs).delete()
            db.session.commit()
            return ("observation deleted successfully"), 200
        else:
            return ("delete unauthorized"), 403
    except Exception as e:
        return {"message": str(e)}, 500
