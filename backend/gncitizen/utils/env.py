import logging
import os
import sys
from pathlib import Path

from flasgger import Swagger
from flask_admin import Admin
from flask_ckeditor import CKEditor
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from gncitizen.utils.toml import load_toml

from gncitizen import __version__

# from datetime import timedelta


ROOT_DIR = Path(__file__).absolute().parent.parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
DEFAULT_VIRTUALENV_DIR = BACKEND_DIR / "venv"
with open(str((ROOT_DIR / "VERSION"))) as v:
    GNCITIZEN_VERSION = v.read()
DEFAULT_CONFIG_FILE = ROOT_DIR / "config/config.toml"
GNC_EXTERNAL_MODULE = ROOT_DIR / "external_modules"
ALLOWED_EXTENSIONS = set(["png", "jpg", "jpeg"])


logger = logging.getLogger(__name__)


def get_config_file_path(config_file=None):
    """Return the config file path by checking several sources

    1 - Parameter passed
    2 - GNCITIZEN_CONFIG_FILE env var
    3 - Default config file value
    """
    config_file = config_file or os.environ.get("GNCITIZEN_CONFIG_FILE")
    return Path(config_file or DEFAULT_CONFIG_FILE)


def load_config(config_file=None):
    """Load the geonature-citizen configuration from a given file"""
    config_gnc = load_toml(get_config_file_path())
    config_gnc["FLASK_ADMIN_FLUID_LAYOUT"] = True
    config_gnc["MAPBOX_MAP_ID"] = "light-v10"
    config_gnc["DEFAULT_CENTER_LAT"] = 5
    config_gnc["DEFAULT_CENTER_LONG"] = 45
    # config_gnc["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=20)
    # config_gnc["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=40)
    # if not "MAPBOX_MAP_ID" in config_gnc:
    # print("MAPBOXID")
    # config_gnc["MAPBOX_MAP_ID"] = "light-v10"
    return config_gnc


def valid_api_url(url):
    """Return a valid API URL ending with /"""
    url = url if url[-1:] == "/" else url + "/"
    return url


app_conf = load_config()
MEDIA_DIR = str(ROOT_DIR / app_conf["MEDIA_FOLDER"])
SQLALCHEMY_DATABASE_URI = app_conf["SQLALCHEMY_DATABASE_URI"]

db = SQLAlchemy()
jwt = JWTManager()
ckeditor = CKEditor()
migrate = Migrate()

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": f"API Doc {app_conf['appName']}",
        "description": f"Backend API for {app_conf['appName']}, source code available at https://github.com/PnX-SI/GeoNature-citizen",
        "contact": {
            "url": "https://github.com/PnX-SI/GeoNature-citizen",
        },
        "version": __version__,
    },
    "components": {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
}

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/flasgger_static",
    # "static_folder": "static",  # must be set by user
    "swagger_ui": True,
    "specs_route": "/api/docs/",
}

swagger = Swagger(template=swagger_template, config=swagger_config)

# admin_url = "/".join([urlparse(app_conf["URL_APPLICATION"]).path, "/api/admin"])

admin = Admin(
    name=f"GN-Citizen: Backoffice d'administration (version: {__version__})",
    template_mode="bootstrap4",
    url="/api/admin",
)


taxhub_url = valid_api_url(app_conf.get("API_TAXHUB", ""))

taxhub_lists_url = taxhub_url + "biblistes/"

API_CITY = app_conf.get(
    "API_CITY", "https://nominatim.openstreetmap.org/reverse"
)


def list_and_import_gnc_modules(app, mod_path=GNC_EXTERNAL_MODULE):
    """
    Get all the module enabled from gn_commons.t_modules
    """
    # with app.app_context():
    #     data = db.session.query(TModules).filter(
    #         TModules.active_backend == True
    #     )
    #     enabled_modules = [d.as_dict()['module_name'] for d in data]

    # iter over external_modules dir
    #   and import only modules which are enabled
    for f in mod_path.iterdir():
        if f.is_dir():
            conf_manifest = load_toml(str(f / "manifest.toml"))
            module_name = conf_manifest["module_name"]
            module_path = Path(GNC_EXTERNAL_MODULE / module_name)
            module_parent_dir = str(module_path.parent)
            module_name = "{}.config.conf_schema_toml".format(module_path.name)
            sys.path.insert(0, module_parent_dir)
            module_name = "{}.backend.blueprint".format(module_path.name)
            module_blueprint = __import__(module_name, globals=globals())
            sys.path.pop(0)

            conf_module = load_toml(str(f / "config/conf_gn_module.toml"))
            yield conf_module, conf_manifest, module_blueprint
