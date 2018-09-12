import logging
import os

from flasgger import Swagger
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from gncitizen.utils.env import db, list_and_import_gn_modules

logger = logging.getLogger()
logger.setLevel(10)
basedir = os.path.abspath(os.path.dirname(__file__))
print('media path:', os.path.join(basedir, '../media'))
app = Flask(__name__)

app.debug = True

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)


class ReverseProxied(object):

    def __init__(self, app, script_name=None, scheme=None, server=None):
        self.app = app
        self.script_name = script_name
        self.scheme = scheme
        self.server = server

    def __call__(self, environ, start_response):
        script_name = environ.get('HTTP_X_SCRIPT_NAME', '') or self.script_name
        if script_name:
            environ['SCRIPT_NAME'] = script_name
            path_info = environ['PATH_INFO']
            if path_info.startswith(script_name):
                environ['PATH_INFO'] = path_info[len(script_name):]
        scheme = environ.get('HTTP_X_SCHEME', '') or self.scheme
        if scheme:
            environ['wsgi.url_scheme'] = scheme
        server = environ.get('HTTP_X_FORWARDED_SERVER', '') or self.server
        if server:
            environ['HTTP_HOST'] = server
        return self.app(environ, start_response)


def get_app(config, _app=None, with_external_mods=True, url_prefix='/api'):
    # Make sure app is a singleton
    if _app is not None:
        return _app

    app = Flask(__name__)
    app.config.update(config)

    # Bind app to DB
    db.init_app(app)

    # JWT Auth
    jwt = JWTManager(app)

    # flasgger disponible à l'adresse '/apidocs'
    # app.config['SWAGGER'] = {
    #     'title': 'GeoNature-citizen API',
    #     'uiversion': 3
    # }
    swagger = Swagger(app)

    with app.app_context():
        from gncitizen.utils.logs import mail_handler
        if app.config['MAILERROR']['MAIL_ON_ERROR']:
            logging.getLogger().addHandler(mail_handler)
        db.create_all()

        from gncitizen.core.sights.routes import routes
        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.auth.routes import routes
        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.ref_geo.routes import routes
        app.register_blueprint(routes, url_prefix=url_prefix)

        from gncitizen.core.taxonomy.routes import routes
        app.register_blueprint(routes, url_prefix=url_prefix)

        # app.wsgi_app = ReverseProxied(app.wsgi_app, script_name=config['API_ENDPOINT'])

        CORS(app, supports_credentials=True)
        # Chargement des mosdules tiers
        if with_external_mods:
            for conf, manifest, module in list_and_import_gn_modules(app):
                try:
                    prefix = url_prefix + conf['api_url']
                except:
                    prefix = url_prefix
                print(prefix)
                app.register_blueprint(
                    module.backend.blueprint.blueprint,
                    url_prefix=prefix
                )
                # chargement de la configuration du module dans le blueprint.config
                module.backend.blueprint.blueprint.config = conf
                app.config[manifest['module_name']] = conf

        _app = app

        db.create_all()
    return app
