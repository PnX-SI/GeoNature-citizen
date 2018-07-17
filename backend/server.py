import logging

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

logger = logging.getLogger()
logger.setLevel(10)

app = Flask(__name__)

app.debug = True

# Configuration de la bdd
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# JWTManager
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']

jwt = JWTManager(app)

from gncitizen.sights.routes import sights_url
from gncitizen.auth.models import RevokedTokenModel
from gncitizen.auth.routes import auth

app.register_blueprint(sights_url)
app.register_blueprint(auth)


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token['jti']
    return RevokedTokenModel.is_jti_blacklisted(jti)


@app.before_first_request
def create_tables():
    db.create_all()


if __name__ == '__main__':
    # db.create_all()
    app.run(debug=True, port=5001)
