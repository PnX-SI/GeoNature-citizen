import sys
import os
import logging

from flask import Flask, current_app
from flask_cors import CORS

from gncitizen.utils.env import db, list_and_import_gnc_modules, jwt, swagger, admin, ckeditor
from gncitizen.utils.sqlalchemy import create_schemas

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
                environ["PATH_INFO"] = path_info[len(script_name):]
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
        from flask.logging import default_handler
        import colorlog

        handler = colorlog.StreamHandler()
        handler.setFormatter(
            colorlog.ColoredFormatter(
                """%(log_color)s%(asctime)s %(levelname)s:%(name)s:%(message)s [in %(pathname)s:%(lineno)d]"""
            )
        )

        logger = logging.getLogger('werkzeug')
        logger.addHandler(handler)
        app.logger.removeHandler(default_handler)

        for l in logging.Logger.manager.loggerDict.values():
            if hasattr(l, 'handlers'):
                l.handlers = [handler]

    # else:
    #     # TODO: sourced from app.config['LOGGING']
    #     logging.basicConfig()
    #     logger = logging.getLogger()
    #     logger.setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(
        getattr(sys.modules['logging'], app.config["SQLALCHEMY_DEBUG_LEVEL"]))

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

    # Swagger for api documentation
    swagger.init_app(app)

    admin.init_app(app)

    ckeditor.init_app(app)

    with app.app_context():

        from gncitizen.core.users.routes import routes

        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.commons.routes import routes

        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.observations.routes import routes

        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.ref_geo.routes import routes

        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.taxonomy.routes import routes

        app.register_blueprint(routes, url_prefix=url_prefix)

        # Chargement des mosdules tiers
        if with_external_mods:
            for conf, manifest, module in list_and_import_gnc_modules(app):
                try:
                    prefix = url_prefix + conf["api_url"]
                except Exception as e:
                    current_app.logger.debug(e)
                    prefix = url_prefix
                print(prefix)
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

        _app = app

        create_schemas(db)
        db.create_all()

    return app
