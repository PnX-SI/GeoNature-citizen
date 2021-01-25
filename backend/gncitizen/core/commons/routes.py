#!/usr/bin/python3
# -*- coding:utf-8 -*-

import json
import urllib.parse
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_optional, get_jwt_identity
from flask_admin.form import SecureForm
from flask_admin.contrib.geoa import ModelView
from sqlalchemy.sql import func
from sqlalchemy import distinct, and_
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import MultiPolygon, asShape
from flask_ckeditor import CKEditorField

from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import json_resp
from gncitizen.utils.env import admin
from server import db

from .models import (
    TModules,
    ProjectModel,
    ProgramsModel,
    CustomFormModel,
    GeometryModel,
)
from gncitizen.core.users.models import UserModel
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.sites.models import VisitModel, SiteModel

from flask_jwt_extended.utils import (
    decode_token,
    has_user_loader,
    user_loader,
    verify_token_not_blacklisted,
)
from flask_jwt_extended.exceptions import UserLoadError
from gncitizen.core.commons.admin import (
    ProjectView,
    ProgramView,
    CustomFormView,
    UserView,
    GeometryView,
)
from gncitizen.core.sites.models import CorProgramSiteTypeModel


routes = Blueprint("commons", __name__)


admin.add_view(UserView(UserModel, db.session, "Utilisateurs"))
admin.add_view(ProjectView(ProjectModel, db.session, "Projets"))
admin.add_view(ProgramView(ProgramsModel, db.session, "Programmes"))
admin.add_view(CustomFormView(CustomFormModel, db.session, "Formulaires dynamiques"))
admin.add_view(GeometryView(GeometryModel, db.session, "Zones geographiques"))


@routes.route("/modules/<int:pk>", methods=["GET"])
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


@routes.route("/modules", methods=["GET"])
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


@routes.route("/stats", methods=["GET"])
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


@routes.route("/projects", methods=["GET"])
@routes.route("/projects/", methods=["GET"])
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


@routes.route("/projects/<int:pk>/programs", methods=["GET"])
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


@routes.route("/projects/<int:pk>/stats", methods=["GET"])
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
            func.count(distinct(ObservationModel.id_role),).label(
                "registered_contributors"
            ),
            func.count(distinct(ProgramsModel.id_program)).label("programs"),
            func.count(distinct(ObservationModel.cd_nom)).label("taxa"),
            func.count(distinct(SiteModel.id_site)).label("sites"),
        )
        .select_from(ProjectModel)
        .join(ProgramsModel, ProgramsModel.id_project == ProjectModel.id_project)
        .outerjoin(
            ObservationModel, ObservationModel.id_program == ProgramsModel.id_program
        )
        .outerjoin(SiteModel, SiteModel.id_program == ProgramsModel.id_program)
        .outerjoin(VisitModel, VisitModel.id_site == SiteModel.id_site)
        .filter(and_(ProjectModel.id_project == pk, ProgramsModel.is_active == True))
    )
    current_app.logger.debug(f"Query {type(query.first())} {dir(query.first())}")
    return query.first()._asdict()


@routes.route("/programs/<int:pk>", methods=["GET"])
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
    datas = ProgramsModel.query.filter_by(id_program=pk, is_active=True).limit(1)
    if datas.count() != 1:
        current_app.logger.warning("[get_program] Program not found")
        return {"message": "Program not found"}, 400
    else:
        features = []
        for data in datas:
            feature = data.get_geofeature()
            # Get sites types for sites programs. TODO condition
            if feature["properties"]["module"]["name"] == "sites":
                site_types_qs = CorProgramSiteTypeModel.query.filter_by(id_program=pk)
                site_types = [
                    {"value": st.site_type.id_typesite, "text": st.site_type.type}
                    for st in site_types_qs
                ]
                feature["site_types"] = site_types
            features.append(feature)
        return {"features": features}, 200
    # except Exception as e:
    #     current_app.logger.critical("[get_program] error : %s", str(e))
    #     return {"message": str(e)}, 400


@routes.route("/customform/<int:pk>", methods=["GET"])
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


@routes.route("/programs/<int:pk>/customform/", methods=["GET"])
@routes.route("/programs/<int:pk>/customform", methods=["GET"])
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


@routes.route("/programs", methods=["GET"])
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
        # get whith_geom argument from url (?with_geom=true)
        arg_with_geom = request.args.get("with_geom")
        if arg_with_geom:
            with_geom = json.loads(arg_with_geom.lower())
        else:
            with_geom = False
        programs = ProgramsModel.query.filter_by(is_active=True).all()
        count = len(programs)
        features = []
        for program in programs:
            if with_geom:
                feature = program.get_geofeature()
            else:
                feature = {}
            feature["properties"] = program.as_dict(True)
            features.append(feature)
        feature_collection = FeatureCollection(features)
        feature_collection["count"] = count
        return feature_collection
    except Exception as e:
        current_app.logger.critical("[get_programs] error : %s", str(e))
        return {"message": str(e)}, 400
