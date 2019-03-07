from flask import Blueprint, request, current_app
from .models import SiteType, SiteModel, VisitModel
from gncitizen.core.users.models import UserModel
import uuid
import datetime

from geojson import FeatureCollection
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from shapely.geometry import asShape
from gncitizen.utils.jwt import get_id_role_if_exists
from gncitizen.utils.env import MEDIA_DIR
from gncitizen.utils.media import allowed_file
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import get_geojson_feature, json_resp
from server import db
from flask_jwt_extended import jwt_optional

routes = Blueprint("sites_url", __name__)


@routes.route("/types", methods=["GET"])
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
        for t in SiteType:
            data.append(t.name)
        return {"count": len(data), "site_types": data}, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


@routes.route("/<int:pk>", methods=["GET"])
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
        result = SiteModel.query.get(pk)
        result_dict = result.as_dict(True)
        features = []
        feature = get_geojson_feature(result.geom)
        for k in result_dict:
            if k not in ("id_creator", "geom"):
                feature["properties"][k] = result_dict[k]
        features.append(feature)
        return {"features": features}, 200
    except Exception as e:
        return {"error_message": str(e)}, 400


def format_site(site):
    feature = get_geojson_feature(site.geom)
    site_dict = site.as_dict(True)
    for k in site_dict:
        if k not in ("id_role", "geom"):
            feature["properties"][k] = site_dict[k]
    return feature


def format_sites(sites):
    count = len(sites)
    features = []
    for site in sites:
        features.append(format_site(site))
    data = FeatureCollection(features)
    data["count"] = count
    return data


@routes.route("/", methods=["GET"])
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
        return format_sites(sites)
    except Exception as e:
        return {"error_message": str(e)}, 400


@routes.route("/programs/<int:id>", methods=["GET"])
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
        return format_sites(sites)
    except Exception as e:
        return {"error_message": str(e)}, 400


@routes.route("/", methods=["POST"])
@json_resp
@jwt_optional
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
                site_type:
                  type: string
                  description: must be one of the supported site types
                  required: True
                  example: "mare"
                geometry:
                  type: string
                  example: {"type":"Point", "coordinates":[5,45]}
        responses:
          200:
            description: Site created
        """
    try:
        request_datas = dict(request.get_json())

        datas2db = {}
        for field in request_datas:
            if hasattr(SiteModel, field):
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
                    filename = "site_" + "_" + timestamp + ext
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
            newsite = SiteModel(**datas2db)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        try:
            shape = asShape(request_datas["geometry"])
            newsite.geom = from_shape(Point(shape), srid=4326)
        except Exception as e:
            current_app.logger.debug(e)
            raise GeonatureApiError(e)

        id_role = get_id_role_if_exists()
        if id_role:
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
                   "features": [format_site(result)]
               }, 200
    except Exception as e:
        current_app.logger.warning("Error: %s", str(e))
        return {"error_message": str(e)}, 400