#!/usr/bin/python3

from flask import Blueprint, current_app, request, send_from_directory
from flask_admin.contrib.fileadmin import FileAdmin
from flask_jwt_extended import jwt_required
from geojson import FeatureCollection
from gncitizen.core.observations.models import ObservationMediaModel, ObservationModel
from gncitizen.core.sites.admin import SiteTypeView
from gncitizen.core.sites.models import (
    CorProgramSiteTypeModel,
    MediaOnVisitModel,
    SiteModel,
    SiteTypeModel,
    VisitModel,
)
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import MEDIA_DIR, admin
from gncitizen.utils.helpers import get_filter_by_args, set_media_links
from gncitizen.utils.jwt import get_id_role_if_exists
from server import db
from sqlalchemy import and_, case, desc, distinct
from sqlalchemy.sql import func
from utils_flask_sqla.response import json_resp

from .admin import CustomFormView, GeometryView, ProgramView, ProjectView
from .models import (
    CustomFormModel,
    GeometryModel,
    MediaModel,
    ProgramsModel,
    ProjectModel,
    TModules,
)

commons_api = Blueprint("commons", __name__)

admin.add_view(FileAdmin(MEDIA_DIR, "/api/media/", name="Medias"))
admin.add_view(ProjectView(ProjectModel, db.session, "1 - Projets", category="Enquêtes"))
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
admin.add_view(SiteTypeView(SiteTypeModel, db.session, "3b - Types de site", category="Enquêtes"))
admin.add_view(ProgramView(ProgramsModel, db.session, "4 - Programmes", category="Enquêtes"))


@commons_api.route("media/<filename>")
def get_media(filename):
    return send_from_directory(str(MEDIA_DIR), filename)


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
        stats["nb_program"] = ProgramsModel.query.filter(ProgramsModel.is_active).count()
        stats["nb_espece"] = ObservationModel.query.distinct(ObservationModel.cd_nom).count()
        stats["nb_site"] = SiteModel.query.count()
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
        .join(ProgramsModel, ProgramsModel.id_project == ProjectModel.id_project)
        .outerjoin(
            ObservationModel,
            ObservationModel.id_program == ProgramsModel.id_program,
        )
        .outerjoin(SiteModel, SiteModel.id_program == ProgramsModel.id_program)
        .outerjoin(VisitModel, VisitModel.id_site == SiteModel.id_site)
        .filter(and_(ProjectModel.id_project == pk, ProgramsModel.is_active))
    )
    current_app.logger.debug(f"Query {type(query.first())} {dir(query.first())}")
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
                    "form_message",
                    "id_module",
                    "is_active",
                    "registration_required",
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


@commons_api.route("/medias", methods=["GET"])
@jwt_required(optional=True)
@json_resp
def get_medias():
    # Filters
    args = request.args
    obs_args = {key: args[key] for key in ["id_observation", "cd_nom"] if key in args}
    validation_args = {
        key: args[key] for key in args.keys() if key.startswith("validation_status") if key in args
    }
    obs_args = {**obs_args, **validation_args}
    visit_args = {key: args[key] for key in ["id_site", "id_visit"] if key in args}
    site_args = {key: args[key] for key in [] if key in args}
    id_role = request.args.get("id_role")
    id_program = request.args.get("id_program")
    no_pagination = request.args.get("no_pagination", default=False, type=bool)
    page_size = request.args.get("page_size", default=100, type=int)
    page = request.args.get("page", default=1, type=int)

    validation_process = request.args.get("validation_process", default=False, type=bool)

    qs = (
        MediaModel.query.outerjoin(ObservationMediaModel)
        .outerjoin(ObservationModel)
        .outerjoin(MediaOnVisitModel)
        .outerjoin(VisitModel)
        .outerjoin(SiteModel)
        .outerjoin(
            ProgramsModel,
            func.coalesce(ObservationModel.id_program, SiteModel.id_program)
            == ProgramsModel.id_program,
        )
        .filter(
            (func.coalesce(ObservationModel.id_observation, MediaOnVisitModel.id_data_source))
            is not None
        )
        .with_entities(
            MediaModel.id_media,
            MediaModel.filename,
            (
                func.coalesce(ObservationModel.id_observation, MediaOnVisitModel.id_data_source)
            ).label("id_data_source"),
            ObservationModel.cd_nom,
            func.coalesce(ObservationModel.name, SiteModel.name).label("name"),
            func.coalesce(ObservationModel.obs_txt, VisitModel.obs_txt).label("observer"),
            func.coalesce(ObservationModel.id_role, VisitModel.id_role).label("id_role"),
            func.coalesce(ObservationModel.date, VisitModel.date).label("date"),
            # TODO: Attribution auto des municipalités aux sites # [fixme]
            ObservationModel.municipality,
            SiteModel.id_site,
            ProgramsModel.title.label("program"),
            ProgramsModel.id_program.label("id_program"),
            case(
                (ObservationMediaModel.id_media is not None, "observations"),
                (MediaOnVisitModel.id_media is not None, "sites"),
            ).label("type_program"),
        )
    )

    qs = qs.filter(*get_filter_by_args(ObservationModel, obs_args)) if bool(obs_args) else qs
    qs = qs.filter(*get_filter_by_args(VisitModel, visit_args)) if bool(visit_args) else qs
    qs = qs.filter(*get_filter_by_args(SiteModel, site_args)) if bool(site_args) else qs

    if id_program:
        qs = qs.filter(
            func.coalesce(ObservationModel.id_program, SiteModel.id_program) == id_program
        )
    if id_role:
        qs = qs.filter(func.coalesce(ObservationModel.id_role, VisitModel.id_role) == id_role)
    if validation_process:
        user = get_id_role_if_exists()
        qs = (
            qs.filter(func.coalesce(ObservationModel.id_role, VisitModel.id_role) != user)
            if user
            else qs
        )

    if no_pagination:
        return [set_media_links(media) for media in qs.all()]

    qs = qs.order_by(desc(func.coalesce(ObservationModel.date, VisitModel.date))).paginate(
        per_page=page_size, page=page
    )
    return {
        "page": qs.page,
        "pages": qs.pages,
        "total": qs.total,
        "page_size": page_size,
        "items": [set_media_links(media) for media in qs.items],
    }
