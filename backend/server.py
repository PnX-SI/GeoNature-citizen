import logging
import os

from flasgger import Swagger
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger()
logger.setLevel(10)
basedir = os.path.abspath(os.path.dirname(__file__))
print('media path:', os.path.join(basedir, '../media'))
app = Flask(__name__)

app.debug = True

# Configuration de la bdd

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+psycopg2://gncdbuser:gncdbpwd@127.0.0.1:5432/gncitizen'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MEDIA_FOLDER'] = os.path.join(basedir, '../media')
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

db = SQLAlchemy(app)

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# JWTManager
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']

jwt = JWTManager(app)

swagger = Swagger(app)

from gncitizen.sights.routes import sights_url
from gncitizen.auth.routes import auth_url
from gncitizen.georepos.routes import georepos_url

app.register_blueprint(sights_url)
app.register_blueprint(auth_url)
app.register_blueprint(georepos_url)


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token['jti']


@app.before_first_request
def create_tables():
    print('Création des tables de la bdd')
    db.create_all()


if __name__ == '__main__':
    # db.create_all()
    app.run(debug=True, port=5001)
