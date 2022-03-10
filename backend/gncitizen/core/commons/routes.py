#!/usr/bin/python3
# -*- coding:utf-8 -*-

import json

from flask import Blueprint, current_app, request, send_from_directory
from geojson import FeatureCollection
from sqlalchemy import and_, distinct
from sqlalchemy.sql import func
from utils_flask_sqla.response import json_resp

from gncitizen.core.commons.admin import (
    CustomFormView,
    GeometryView,
    ProgramView,
    ProjectView,
    UserView,
)
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.sites.admin import SiteTypeView
from gncitizen.core.sites.models import (
    CorProgramSiteTypeModel,
    SiteModel,
    SiteTypeModel,
    VisitModel,
)
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import MEDIA_DIR, admin
from server import db

from .models import (
    CustomFormModel,
    GeometryModel,
    ProgramsModel,
    ProjectModel,
    TModules,
)

commons_api = Blueprint("commons", __name__)


admin.add_view(UserView(UserModel, db.session, "Utilisateurs"))
admin.add_view(
    ProjectView(ProjectModel, db.session, "1 - Projets", category="Enquêtes")
)
admin.add_view(
    GeometryView(
        GeometryModel,
        db.session,
        "2 - Zones geographiques",
        category="Enquêtes",
    )
)
admin.add_view(
    CustomFormView(
        CustomFormModel,
        db.session,
        "3a - Formulaires dynamiques",
        category="Enquêtes",
    )
)
admin.add_view(
    SiteTypeView(
        SiteTypeModel, db.session, "3b - Types de site", category="Enquêtes"
    )
)
admin.add_view(
    ProgramView(
        ProgramsModel, db.session, "4 - Programmes", category="Enquêtes"
    )
)


@commons_api.route("media/<item>")
def get_media(item):
    return send_from_directory(str(MEDIA_DIR), item)


@commons_api.route("/modules/<int:pk>", methods=["GET"])
@json_resp
def get_module(pk):
    """Get a module by id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: A module description
    """
    try:
        datas = TModules.query.filter_by(id_module=pk).first()
        return datas.as_dict(), 200
    except Exception as e:
        current_app.logger.critical("[get_module] error : %s", str(e))
        return {"message": str(e)}, 400


@commons_api.route("/modules", methods=["GET"])
@json_resp
def get_modules():
    """Get all modules
    ---
    tags:
      - Core
    responses:
      200:
        description: A list of all programs
    """
    try:
        modules = TModules.query.all()
        count = len(modules)
        datas = []
        for m in modules:
            d = m.as_dict()
            datas.append(d)
        return {"count": count, "datas": datas}, 200
    except Exception as e:
        current_app.logger.critical("[get_modules] error : %s", str(e))
        return {"message": str(e)}, 400


@commons_api.route("/stats", methods=["GET"])
@json_resp
def get_stat():
    try:
        stats = {}
        stats["nb_obs"] = ObservationModel.query.count()
        stats["nb_user"] = UserModel.query.count()
        stats["nb_program"] = ProgramsModel.query.filter(
            ProgramsModel.is_active == True
        ).count()
        stats["nb_espece"] = ObservationModel.query.distinct(
            ObservationModel.cd_nom
        ).count()
        return (stats, 200)
    except Exception as e:
        current_app.logger.critical("[get_observations] Error: %s", str(e))
        return {"message": str(e)}, 400


@commons_api.route("/projects", methods=["GET"])
# @commons_api.route("/projects", methods=["GET"])
@json_resp
def get_projects():
    """Get a project description details by id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: Description of a project and their child programs
    """
    qprojects = ProjectModel.query.all()
    if len(qprojects) == 0:
        current_app.logger.warning("[get_projects] No projects")
        return {"message": "No projects available"}, 400
    data = {"count": len(qprojects), "items": [p.as_dict() for p in qprojects]}
    return data


@commons_api.route("/projects/<int:pk>/programs", methods=["GET"])
@json_resp
def get_project_programs(pk):
    """Get a project description details by id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: Description of a project and their child programs
    """
    qproject = ProjectModel.query.filter_by(id_project=pk).first()
    if not qproject:
        current_app.logger.warning("[get_project] Project not found")
        return {"message": "Project not found"}, 400
    else:
        programs = ProgramsModel.query.filter_by(id_project=pk).all()
    project = qproject.as_dict()

    project["programs"] = {
        "count": len(programs),
        "items": [p.as_dict() for p in programs],
    }
    return project


@commons_api.route("/projects/<int:pk>/stats", methods=["GET"])
@json_resp
def get_project_stats(pk):
    """Get a project general stats
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: Project general statistics (various counters)
    """
    project = ProjectModel.query.filter_by(id_project=pk).first()
    if not project:
        current_app.logger.warning("[get_project] Project not found")
        return {"message": "Project not found"}, 400
    query = (
        db.session.query(
            (
                func.count(distinct(ObservationModel.id_observation))
                + func.count(distinct(VisitModel.id_visit))
            ).label("observations"),
            func.count(
                distinct(ObservationModel.id_role),
            ).label("registered_contributors"),
            func.count(distinct(ProgramsModel.id_program)).label("programs"),
            func.count(distinct(ObservationModel.cd_nom)).label("taxa"),
            func.count(distinct(SiteModel.id_site)).label("sites"),
        )
        .select_from(ProjectModel)
        .join(
            ProgramsModel, ProgramsModel.id_project == ProjectModel.id_project
        )
        .outerjoin(
            ObservationModel,
            ObservationModel.id_program == ProgramsModel.id_program,
        )
        .outerjoin(SiteModel, SiteModel.id_program == ProgramsModel.id_program)
        .outerjoin(VisitModel, VisitModel.id_site == SiteModel.id_site)
        .filter(
            and_(
                ProjectModel.id_project == pk, ProgramsModel.is_active == True
            )
        )
    )
    current_app.logger.debug(
        f"Query {type(query.first())} {dir(query.first())}"
    )
    return query.first()._asdict()


@commons_api.route("/programs/<int:pk>", methods=["GET"])
@json_resp
def get_program(pk):
    """Get an observation by id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: A list of all programs
    """
    # try:
    datas = ProgramsModel.query.filter_by(id_program=pk, is_active=True).limit(
        1
    )
    if datas.count() != 1:
        current_app.logger.warning("[get_program] Program not found")
        return {"message": "Program not found"}, 400
    else:
        features = []
        for data in datas:
            feature = data.get_geofeature()
            # Get sites types for sites programs. TODO condition
            if feature["properties"]["module"]["name"] == "sites":
                site_types_qs = CorProgramSiteTypeModel.query.filter_by(
                    id_program=pk
                )
                site_types = [
                    {
                        "value": st.site_type.id_typesite,
                        "text": st.site_type.type,
                    }
                    for st in site_types_qs
                ]
                feature["site_types"] = site_types
            features.append(feature)
        return {"features": features}, 200
    # except Exception as e:
    #     current_app.logger.critical("[get_program] error : %s", str(e))
    #     return {"message": str(e)}, 400


@commons_api.route("/customform/<int:pk>", methods=["GET"])
@json_resp
def get_custom_form(pk):
    """Get a custom form by id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: A custom form
    """
    try:
        form = CustomFormModel.query.get(pk)
        return form.as_dict(True), 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@commons_api.route("/programs/<int:pk>/customform/", methods=["GET"])
@commons_api.route("/programs/<int:pk>/customform", methods=["GET"])
@json_resp
def get_program_custom_form(pk):
    """Get a custom form by program id
    ---
    tags:
     - Core
    parameters:
     - name: pk
       in: path
       type: integer
       required: true
       example: 1
    responses:
      200:
        description: A custom form
    """
    try:
        program = ProgramsModel.query.get(pk)
        if program.id_form is not None:
            form = CustomFormModel.query.get(program.id_form)
            return form.as_dict(True), 200
        return None, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@commons_api.route("/programs", methods=["GET"])
@json_resp
def get_programs():
    """Get all programs
    ---
    tags:
      - Core
    parameters:
      - name: with_geom
        in: query
        type: boolean
        description: geom desired (true) or not (false, default)
    responses:
      200:
        description: A list of all programs
    """
    try:
        with_geom = "with_geom" in request.args
        programs = (
            ProgramsModel.query.filter_by(is_active=True)
            # .join(
            #     ProjectModel,
            #     ProgramsModel.id_project == ProjectModel.id_project,
            # )
            .all()
        )
        count = len(programs)
        features = []
        for program in programs:
            if with_geom:
                feature = program.get_geofeature()
            else:
                feature = {}
            feature["properties"] = program.as_dict(
                True,
                exclude=["t_obstax", "geometry", "custom_form", "site_types"],
                fields=[
                    "id_program",
                    "id_project",
                    "title",
                    "short_desc",
                    "long_desc",
                    "image",
                    "logo",
                    "id_module",
                    "is_active",
                    "taxonomy_list",
                    "timestamp_create",
                    "timestamp_update",
                ],
            )
            features.append(feature)
        feature_collection = FeatureCollection(features)
        feature_collection["count"] = count
        return feature_collection
    except Exception as e:
        current_app.logger.critical("[get_programs] error : %s", str(e))
        return {"message": str(e)}, 400
