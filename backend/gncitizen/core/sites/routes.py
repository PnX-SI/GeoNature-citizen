import io
import json
import uuid

import xlwt
from flask import Blueprint, current_app, make_response, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import Point, asShape
from sqlalchemy import or_
from utils_flask_sqla.response import json_resp
from utils_flask_sqla_geo.generic import get_geojson_feature

from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import admin
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.jwt import get_id_role_if_exists, get_user_if_exists
from gncitizen.utils.media import save_upload_files
from server import db

from .admin import SiteTypeView
from .models import MediaOnVisitModel, SiteModel, SiteTypeModel, VisitModel

sites_api = Blueprint("sites", __name__)


@sites_api.route("/types", methods=["GET"])
@json_resp
def get_types():
    """Get all sites types
    ---
    tags:
      - Sites (External module)
    responses:
      200:
        description: A list of all site types
    """
    try:
        data = []
        for t in SiteTypeModel.query.all():
            data.append(t.type)
        return {"count": len(data), "site_types": data}, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@sites_api.route("/<int:pk>", methods=["GET"])
@json_resp
def get_site(pk):
    """Get a site by id
    ---
    tags:
      - Sites (External module)
    parameters:
      - name: pk
        in: path
        type: integer
        required: true
        example: 1
    definitions:
      properties:
        type: dict
        description: site properties
      geometry:
        type: geojson
        description: GeoJson geometry
    responses:
      200:
        description: A site detail
    """
    try:
        site = SiteModel.query.get(pk)
        formatted_site = format_site(site)
        photos = get_site_photos(pk)
        visits = get_site_visits(pk)
        formatted_site["properties"]["photos"] = photos
        formatted_site["properties"]["visits"] = visits
        return {"features": [formatted_site]}, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@sites_api.route("/<int:pk>/jsonschema", methods=["GET"])
@json_resp
def get_site_jsonschema(pk):
    try:
        site = SiteModel.query.get(pk)
        data_dict = site.site_type.custom_form.json_schema
        return data_dict, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


def get_site_photos(site_id):
    photos = (
        db.session.query(
            MediaModel,
            VisitModel,
        )
        .filter(VisitModel.id_site == site_id)
        .join(
            MediaOnVisitModel,
            MediaOnVisitModel.id_media == MediaModel.id_media,
        )
        .join(
            VisitModel, VisitModel.id_visit == MediaOnVisitModel.id_data_source
        )
        .all()
    )
    return [
        {
            "url": "/media/{}".format(p.MediaModel.filename),
            "date": p.VisitModel.as_dict()["date"],
            "author": p.VisitModel.obs_txt,
            "visit_id": p.VisitModel.id_visit,
            "id_media": p.MediaModel.id_media,
        }
        for p in photos
    ]


def get_site_visits(site_id):
    visits = (
        db.session.query(
            VisitModel,
        )
        .filter(VisitModel.id_site == site_id)
        .order_by(VisitModel.timestamp_update.desc())
        .all()
    )

    return [
        {
            "id_visit": v.id_visit,
            "date": v.as_dict()["date"],
            "json_data": v.json_data,
            "author": v.obs_txt,
        }
        for v in visits
    ]


def format_site(site, dashboard=False):
    feature = get_geojson_feature(site.geom)
    site_dict = site.as_dict(True, exclude=["program"])
    for k in site_dict:
        if k not in ("geom",):
            feature["properties"][k] = site_dict[k]
    if dashboard:
        # Site creator can delete it only if no visit have been added by others
        feature["properties"]["creator_can_delete"] = (
            site.id_role
            and VisitModel.query.filter_by(id_site=site.id_site)
            .filter(
                or_(
                    VisitModel.id_role != site.id_role,
                    VisitModel.id_role.is_(None),
                )
            )
            .count()
            == 0
        )
    return feature


def prepare_sites(sites, dashboard=False):
    count = len(sites)
    features = []
    for site in sites:
        formatted = format_site(site, dashboard)
        photos = get_site_photos(site.id_site)
        if len(photos) > 0:
            formatted["properties"]["photo"] = photos[0]
        features.append(formatted)
    data = FeatureCollection(features)
    data["count"] = count
    return data


@sites_api.route("/", methods=["GET"])
@json_resp
def get_sites():
    """Get all sites
    ---
    tags:
      - Sites (External module)
    definitions:
      FeatureCollection:
        properties:
          type: dict
          description: site properties
        geometry:
          type: geojson
          description: GeoJson geometry
    responses:
      200:
        description: List of all sites
    """
    try:
        sites = SiteModel.query.all()
        return prepare_sites(sites)
        # return sites
    except Exception as e:
        return {"error_message": str(e)}, 400


@sites_api.route("/programs/<int:id>", methods=["GET"])
@json_resp
def get_program_sites(id):
    """Get all sites
    ---
    tags:
      - Sites (External module)
    definitions:
      FeatureCollection:
        properties:
          type: dict
          description: site properties
        geometry:
          type: geojson
          description: GeoJson geometry
    responses:
      200:
        description: List of all sites
    """
    try:
        sites = SiteModel.query.filter_by(id_program=id).all()
        return prepare_sites(sites)
    except Exception as e:
        return {"error_message": str(e)}, 400


def _get_user_sites(user_id):
    created_sites = (
        SiteModel.query.filter_by(id_role=user_id)
        .order_by(SiteModel.timestamp_create.desc())
        .all()
    )
    visited_sites = (
        db.session.query(SiteModel)
        .filter(VisitModel.id_role == user_id)
        .filter(or_(SiteModel.id_role != user_id, SiteModel.id_role.is_(None)))
        .join(VisitModel, SiteModel.id_site == VisitModel.id_site)
        .group_by(SiteModel.id_site)
        .all()
    )
    user_sites = created_sites + visited_sites
    return user_sites


@sites_api.route("/users/<int:user_id>", methods=["GET"])
@json_resp
def get_user_sites(user_id):
    try:
        return prepare_sites(_get_user_sites(user_id), dashboard=True)
    except Exception as e:
        return {"error_message": str(e)}, 400


@sites_api.route("/", methods=["POST"])
@json_resp
@jwt_required(optional=True)
def post_site():
    """Ajout d'un site
    Post a site
        ---
        tags:
          - Sites (External module)
        summary: Creates a new site
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
              id: Site
              properties:
                id_program:
                  type: integer
                  description: Program foreign key
                  required: true
                  example: 1
                name:
                  type: string
                  description: Site name
                  default:  none
                  example: "Site 1"
                id_type:
                  type: integer
                  description: must be one of the supported site types' id
                  required: True
                  example: 1
                geometry:
                  type: string
                  example: {"type":"Point", "coordinates":[5,45]}
        responses:
          200:
            description: Site created
    """
    try:
        request_data = dict(request.get_json())

        datas2db = {}
        for field in request_data:
            if hasattr(SiteModel, field):
                datas2db[field] = request_data[field]
        current_app.logger.debug("datas2db: %s", datas2db)
        try:
            newsite = SiteModel(**datas2db)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        try:
            shape = asShape(request_data["geometry"])
            newsite.geom = from_shape(Point(shape), srid=4326)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role is not None:
            newsite.id_role = id_role
            role = UserModel.query.get(id_role)
            newsite.obs_txt = role.username
            newsite.email = role.email
        else:
            if newsite.obs_txt is None or len(newsite.obs_txt) == 0:
                newsite.obs_txt = "Anonyme"

        newsite.uuid_sinp = uuid.uuid4()

        db.session.add(newsite)
        db.session.commit()
        # Réponse en retour
        result = SiteModel.query.get(newsite.id_site)
        return {
            "message": "New site created.",
            "features": [format_site(result)],
        }, 200
    except Exception as e:
        current_app.logger.warning("Error: %s", str(e))
        return {"error_message": str(e)}, 400


@sites_api.route("/", methods=["PATCH"])
@json_resp
@jwt_required()
def update_site():
    try:
        current_user = get_user_if_exists()
        update_data = dict(request.get_json())
        update_site = {}
        for prop in ["name", "id_type"]:
            update_site[prop] = update_data[prop]
        try:
            shape = asShape(update_data["geometry"])
            update_site["geom"] = from_shape(Point(shape), srid=4326)
        except Exception as e:
            current_app.logger.warning("[update_site] coords ", e)
            raise GeonatureApiError(e)

        site = SiteModel.query.filter_by(id_site=update_data.get("id_site"))
        if current_user.id_user != site.first().id_role:
            return ("unauthorized"), 403
        site.update(update_site, synchronize_session="fetch")
        db.session.commit()
        return ("site updated successfully"), 200
    except Exception as e:
        current_app.logger.critical("[update_site] Error: %s", str(e))
        return {"message": str(e)}, 400


@sites_api.route("/<int:site_id>/visits", methods=["POST"])
@json_resp
@jwt_required(optional=True)
def post_visit(site_id):
    try:
        request_data = request.get_json()

        new_visit = VisitModel(
            id_site=site_id,
            date=request_data["date"],
            json_data=request_data["data"],
        )

        id_role = get_id_role_if_exists()
        if id_role is not None:
            new_visit.id_role = id_role
            role = UserModel.query.get(id_role)
            new_visit.obs_txt = role.username
            new_visit.email = role.email
        else:
            if new_visit.obs_txt is None or len(new_visit.obs_txt) == 0:
                new_visit.obs_txt = "Anonyme"

        db.session.add(new_visit)
        db.session.commit()

        # Réponse en retour
        result = VisitModel.query.get(new_visit.id_visit)
        return {
            "message": "New visit created.",
            "features": [result.as_dict()],
        }, 200
    except Exception as e:
        current_app.logger.warning("Error: %s", str(e))
        return {"error_message": str(e)}, 400


@sites_api.route("/visits/<int:visit_id>", methods=["PATCH"])
@json_resp
@jwt_required()
def update_visit(visit_id):
    try:
        current_user = get_user_if_exists()
        update_data = dict(request.get_json())
        visit = VisitModel.query.filter_by(id_visit=visit_id).first()
        if current_user.id_user != visit.id_role:
            return ("unauthorized"), 403

        try:
            # Delete selected existing media
            id_media_to_delete = json.loads(update_data.get("delete_media"))
            if len(id_media_to_delete):
                db.session.query(MediaOnVisitModel).filter(
                    MediaOnVisitModel.id_media.in_(tuple(id_media_to_delete)),
                    MediaOnVisitModel.id_data_source == visit_id,
                ).delete(synchronize_session="fetch")
                db.session.query(MediaModel).filter(
                    MediaModel.id_media.in_(tuple(id_media_to_delete))
                ).delete(synchronize_session="fetch")
        except Exception as e:
            current_app.logger.warning("[update_visit] delete media ", e)
            raise GeonatureApiError(e)

        visit.date = update_data.get("date")
        visit.json_data = update_data.get("data")
        db.session.commit()
        return ("Visit updated successfully"), 200
    except Exception as e:
        current_app.logger.critical("[update_visit] Error: %s", str(e))
        return {"message": str(e)}, 400


@sites_api.route(
    "/<int:site_id>/visits/<int:visit_id>/photos", methods=["POST"]
)
@json_resp
@jwt_required(optional=True)
def post_photo(site_id, visit_id):
    try:
        current_app.logger.debug("UPLOAD FILE? " + str(request.files))
        if request.files:
            files = save_upload_files(
                request.files,
                "site",
                site_id,
                visit_id,
                MediaOnVisitModel,
            )
            current_app.logger.debug("UPLOAD FILE {}".format(files))
            return files, 200
        return [], 200
    except Exception as e:
        current_app.logger.error("Error: %s", str(e))
        return {"error_message": str(e)}, 400


@sites_api.route("/<int:site_id>", methods=["DELETE"])
@json_resp
@jwt_required()
def delete_site(site_id):
    current_user = get_user_if_exists()
    try:
        site = (
            db.session.query(SiteModel, UserModel)
            .filter(SiteModel.id_site == site_id)
            .join(UserModel, SiteModel.id_role == UserModel.id_user, full=True)
            .first()
        )
        if current_user.id_user == site.SiteModel.id_role:
            SiteModel.query.filter_by(id_site=site_id).delete()
            db.session.commit()
            return ("Site deleted successfully"), 200
        else:
            return ("delete unauthorized"), 403
    except Exception as e:
        return {"message": str(e)}, 500


@sites_api.route("/visit/<int:visit_id>", methods=["DELETE"])
@json_resp
@jwt_required()
def delete_visit(visit_id):
    current_user = get_user_if_exists()
    # try:
    visit = (
        db.session.query(VisitModel)
        .filter(VisitModel.id_visit == visit_id)
        .first()
    )
    if current_user.id_user == visit.id_role:
        VisitModel.query.filter_by(id_visit=visit_id).delete()
        db.session.commit()
        return ("Site deleted successfully"), 200
    else:
        return ("delete unauthorized"), 403
    # except Exception as e:
    #     return {"message": str(e)}, 500


@sites_api.route("/export/<int:user_id>", methods=["GET"])
@jwt_required()
def export_sites_xls(user_id):
    current_user = get_user_if_exists()
    try:
        if current_user.id_user != user_id:
            return ("unauthorized"), 403
        title_style = xlwt.easyxf("font: bold on")
        date_style = xlwt.easyxf(num_format_str="D/M/YY")
        wb = xlwt.Workbook()
        # SITES SHEET
        ws = wb.add_sheet("mes sites")
        sites = _get_user_sites(user_id)
        fields = (
            {"col_name": "id_site", "getter": lambda s: s.id_site},
            {"col_name": "Programme", "getter": lambda s: s.program.title},
            {"col_name": "Type", "getter": lambda s: s.site_type.type},
            {"col_name": "Nom", "getter": lambda s: s.name},
            {"col_name": "Coord. x", "getter": lambda s: s.coordinates[0]},
            {"col_name": "Coord. y", "getter": lambda s: s.coordinates[1]},
            {
                "col_name": "Date création",
                "getter": lambda s: s.timestamp_create,
                "style": date_style,
            },
        )
        row = 0
        for col, field in enumerate(fields):
            ws.write(row, col, field["col_name"], title_style)
        row += 1
        for site in sites:
            site.coordinates = get_geojson_feature(site.geom)["geometry"][
                "coordinates"
            ]
            for col, field in enumerate(fields):
                args = []
                if field.get("style"):
                    args.append(field.get("style"))
                ws.write(row, col, field["getter"](site), *args)
            row += 1
        # VISITS SHEET
        ws = wb.add_sheet("mes visites")
        visits = VisitModel.query.filter_by(id_role=user_id)
        basic_fields = (
            {"col_name": "id_visit", "getter": lambda s: s.id_visit},
            {"col_name": "Site", "getter": lambda s: s.site.name},
            {
                "col_name": "Date",
                "getter": lambda s: s.date,
                "style": date_style,
            },
        )
        json_keys = list(
            set([key for v in visits for key in v.json_data.keys()])
        )
        row, col = 0, 0
        for field in basic_fields:
            ws.write(row, col, field["col_name"], title_style)
            col += 1
        for key in json_keys:
            ws.write(row, col, key, title_style)
            col += 1
        row, col = 1, 0
        for visit in visits:
            for field in basic_fields:
                args = []
                if field.get("style"):
                    args.append(field.get("style"))
                ws.write(row, col, field["getter"](visit), *args)
                col += 1
            for key in json_keys:
                ws.write(row, col, visit.json_data.get(key))
                col += 1
            row += 1
            col = 0
        # In memory save and return xls file
        xls_file = io.BytesIO()
        wb.save(xls_file)
        output = make_response(xls_file.getvalue())
        output.headers["Content-Disposition"] = (
            "attachment; filename=" + "export_sites.xls"
        )
        output.headers["Content-type"] = "application/xls"
        return output
    except Exception as e:
        current_app.logger.warning("Error: %s", str(e))
        return {"error_message": str(e)}, 400


@sites_api.route("/medias", methods=["GET"])
@json_resp
def get_site_medias():
    """Get media list

    :return: _description_
    :rtype: _type_
    """

    medias = (
        MediaModel.query.join(MediaOnVisitModel)
        .join(VisitModel)
        .join(SiteModel)
        .join(SiteTypeModel)
        .join(ProgramsModel)
        .with_entities(
            MediaModel.id_media,
            MediaModel.filename,
            VisitModel.id_visit,
            SiteModel.name,
            VisitModel.obs_txt,
            VisitModel.id_role,
            ProgramsModel.title,
            ProgramsModel.id_program,
        )
    )

    # Filter by Program
    id_program = request.args.get("id_program")
    if id_program:
        medias = medias.filter(ProgramsModel.id_program == id_program)

    # Filter by observers
    id_role = request.args.get("id_role")
    if id_role:
        medias = medias.filter(VisitModel.id_role == id_role)

    # Filter by type site
    id_type = request.args.get("id_type")
    if id_type:
        medias = medias.filter(SiteTypeModel.id_type == id_type)

    # Filter by id_observation
    id_visit = request.args.get("id_visit")
    if id_visit:
        medias = medias.filter(VisitModel.id_visit == id_visit)

    return [media._asdict() for media in medias.all()]
