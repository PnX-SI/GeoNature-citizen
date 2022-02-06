import logging
import os
import sys

from flask import Flask, current_app
from flask_cors import CORS

from gncitizen.utils.env import (
    admin,
    ckeditor,
    db,
    jwt,
    list_and_import_gnc_modules,
    swagger,
)
from gncitizen.utils.init_data import create_schemas, populate_modules

basedir = os.path.abspath(os.path.dirname(__file__))


class ReverseProxied(object):
    def __init__(self, app, script_name=None, scheme=None, server=None):
        self.app = app
        self.script_name = script_name
        self.scheme = scheme
        self.server = server

    def __call__(self, environ, start_response):
        script_name = environ.get("HTTP_X_SCRIPT_NAME", "") or self.script_name
        if script_name:
            environ["SCRIPT_NAME"] = script_name
            path_info = environ["PATH_INFO"]
            if path_info.startswith(script_name):
                environ["PATH_INFO"] = path_info[len(script_name) :]
        scheme = environ.get("HTTP_X_SCHEME", "") or self.scheme
        if scheme:
            environ["wsgi.url_scheme"] = scheme
        server = environ.get("HTTP_X_FORWARDED_SERVER", "") or self.server
        if server:
            environ["HTTP_HOST"] = server
        return self.app(environ, start_response)


def get_app(config, _app=None, with_external_mods=True, url_prefix="/api"):
    # Make sure app is a singleton
    if _app is not None:
        return _app

    app = Flask(__name__)
    app.config.update(config)
    if app.config["DEBUG"]:
        import coloredlogs
        from flask.logging import default_handler

        app.config["SQLALCHEMY_ECHO"] = True
        logger = logging.getLogger("werkzeug")

        coloredlogs.install(
            level=logging.DEBUG,
            fmt="%(asctime)s %(hostname)s %(name)s[%(process)d] [in %(pathname)s:%(lineno)d] %(levelname)s %(message)s",
        )
        logger.removeHandler(default_handler)

    logging.getLogger("sqlalchemy.engine").setLevel(
        getattr(sys.modules["logging"], app.config["SQLALCHEMY_DEBUG_LEVEL"])
    )

    CORS(app, supports_credentials=True)
    # app.config['PROPAGATE_EXCEPTIONS'] = False
    # ... brings back those cors headers on error response in debug mode
    # to trace client-side error handling
    # but drops the embedded debugger ¯\_(ツ)_/¯
    # https://github.com/corydolphin/flask-cors/issues/67
    # https://stackoverflow.com/questions/29825235/getting-cors-headers-in-a-flask-500-error

    # Bind app to DB
    db.init_app(app)
    # JWT Auth
    jwt.init_app(app)
    swagger.init_app(app)
    admin.init_app(app)
    ckeditor.init_app(app)

    with app.app_context():
        from gncitizen.core.areas.routes import areas_api
        from gncitizen.core.commons.routes import commons_api
        from gncitizen.core.observations.routes import obstax_api
        from gncitizen.core.ref_geo.routes import geo_api
        from gncitizen.core.sites.routes import sites_api
        from gncitizen.core.taxonomy.routes import taxo_api
        from gncitizen.core.users.routes import users_api

        app.register_blueprint(users_api, url_prefix=url_prefix)
        app.register_blueprint(commons_api, url_prefix=url_prefix)
        app.register_blueprint(obstax_api, url_prefix=url_prefix)
        app.register_blueprint(geo_api, url_prefix=url_prefix)
        app.register_blueprint(taxo_api, url_prefix=url_prefix)
        app.register_blueprint(sites_api, url_prefix=url_prefix + "/sites")
        app.register_blueprint(areas_api, url_prefix=url_prefix + "/areas")

        if app.config["REWARDS_ENABLED"]:
            from gncitizen.core.badges.routes import badges_api

            app.register_blueprint(badges_api, url_prefix=url_prefix)

        CORS(app, supports_credentials=True)

        # Chargement des mosdules tiers
        if with_external_mods:
            for conf, manifest, module in list_and_import_gnc_modules(app):
                try:
                    prefix = url_prefix + conf["api_url"]
                except Exception as e:
                    current_app.logger.debug(e)
                    prefix = url_prefix
                app.register_blueprint(
                    module.backend.blueprint.blueprint, url_prefix=prefix
                )
                try:
                    module.backend.models.create_schema(db)
                except Exception as e:
                    current_app.logger.debug(e)
                # chargement de la configuration
                # du module dans le blueprint.config
                module.backend.blueprint.blueprint.config = conf
                app.config[manifest["module_name"]] = conf

        create_schemas(db)
        db.create_all()
        populate_modules(db)

    # _app = app

    return app
