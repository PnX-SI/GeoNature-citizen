import flask
from flask import request, Blueprint, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_raw_jwt,
    get_jwt_identity,
    jwt_refresh_token_required,
    jwt_required,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import json_resp
from server import db, jwt
from gncitizen.core.observations.models import ObservationModel
from .models import UserModel, RevokedTokenModel
from gncitizen.utils.jwt import admin_required
import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


routes = Blueprint("users", __name__)


@jwt.token_in_blacklist_loader
def check_if_token_in_blacklist(decrypted_token):
    jti = decrypted_token["jti"]
    return RevokedTokenModel.is_jti_blacklisted(jti)


@routes.route("/registration", methods=["POST"])
@json_resp
def registration():
    """
    User registration
    ---
    tags:
      - Authentication
    summary: Creates a new observation
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: body
        in: body
        description: JSON parameters
        required: true
        schema:
          required:
            - name
            - surname
            - username
            - email
            - password
          properties:
            name:
              type: string
            surname:
              type: string
            username:
              type: string
              example: user1
            email:
              type: string
            password:
              type: string
              example: user1
    responses:
      200:
        description: user created
    """
    try:
        request_datas = dict(request.get_json())

        # Génération du dictionnaire des données à sauvegarder
        datas_to_save = {}
        for data in request_datas:
            if hasattr(UserModel, data) and data != "password":
                datas_to_save[data] = request_datas[data]

        # Hashed password
        datas_to_save["password"] = UserModel.generate_hash(request_datas["password"])

        # Protection against admin creation from API
        datas_to_save["admin"] = False

        try:
            newuser = UserModel(**datas_to_save)
        except Exception as e:
            db.session.rollback()
            current_app.logger.critical(e)
            # raise GeonatureApiError(e)
            return ({"message": "La syntaxe de la requête est erronée."}, 400)

        try:
            newuser.save_to_db()
        except IntegrityError as e:
            db.session.rollback()
            # error causality ?
            current_app.logger.critical("IntegrityError: %s", str(e))

            if UserModel.find_by_username(newuser.username):
                return (
                    {
                        "message": """L'utilisateur "{}" existe déjà.""".format(
                            newuser.username
                        )
                    },
                    400,
                )

            elif (
                db.session.query(UserModel)
                .filter(UserModel.email == newuser.email)
                .one()
            ):
                return (
                    {
                        "message": """Un email correspondant est déjà enregistré.""".format(
                            newuser.email
                        )
                    },
                    400,
                )
            else:
                raise GeonatureApiError(e)

        access_token = create_access_token(identity=newuser.username)
        refresh_token = create_refresh_token(identity=newuser.username)
        return (
            {
                "message": """Félicitations, l'utilisateur "{}" a été créé""".format(
                    newuser.username
                ),
                "username": newuser.username,
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
            200,
        )

    except Exception as e:
        current_app.logger.critical("grab all: %s", str(e))
        return {"message": str(e)}, 500


@routes.route("/login", methods=["POST"])
@json_resp
def login():
    """
    User login
    ---
    tags:
      - Authentication
    summary: Login
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: body
        in: body
        description: JSON parameters
        required: true
        schema:
          required:
            - username
            - password
          properties:
            username:
              type: string
            password:
              type: string
    responses:
      200:
        description: user created
    """
    try:
        request_datas = dict(request.get_json())
        print(request_datas)
        username = request_datas["username"]
        password = request_datas["password"]
        print(username)
        current_user = UserModel.find_by_username(username)
        if not current_user:
            return (
                {
                    "message": """L'utilisateur "{}" n'est pas enregistré.""".format(
                        username
                    )
                },
                400,
            )
        if UserModel.verify_hash(password, current_user.password):
            access_token = create_access_token(identity=username)
            refresh_token = create_refresh_token(identity=username)
            return (
                {
                    "message": """Connecté en tant que "{}".""".format(username),
                    "username": username,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                },
                200,
            )
        else:
            return {"message": """Mauvaises informations d'identification"""}, 400
    except Exception as e:
        return {"message": str(e)}, 400


@routes.route("/logout", methods=["POST"])
@json_resp
@jwt_required
def logout():
    """
    User logout
    ---
    tags:
      - Authentication
    summary: Logout
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - name: authorization
        in: authorization
        description: JSON parameter
        required: true
        schema:
          required:
            - authorization
          properties:
            authorization:
              type: string
              example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGl0eSI6ImZjbG9pdHJlIiwiZnJlc2giOmZhbHNlLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNTMyMjA4Nzk0LCJqdGkiOiI5YmQ5OGEwNC1lMTYyLTQwNWMtODg4Zi03YzlhMTAwNTE2ODAiLCJuYmYiOjE1MzIyMDc4OTQsImlhdCI6MTUzMjIwNzg5NH0.oZKoybFIt4mIPF6LrC2cKXHP8o32vAEcet0xVjpCptE
    responses:
      200:
        description: user disconnected

    """
    jti = get_raw_jwt()["jti"]
    try:
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return {"msg": "Successfully logged out"}, 200
    except Exception:
        return {"message": "Something went wrong"}, 500


@routes.route("/token_refresh", methods=["POST"])
@jwt_refresh_token_required
@json_resp
def token_refresh():
    """Refresh token
    ---
    tags:
      - Authentication
    summary: Refresh token for logged user
    produces:
      - application/json
    responses:
      200:
        description: list all logged users
    """
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return {"access_token": access_token}


@routes.route("/allusers", methods=["GET"])
@json_resp
@jwt_required
@admin_required
def get_allusers():
    """list all users
    ---
    tags:
      - Authentication
    summary: List all registered users
    produces:
      - application/json
    responses:
      200:
        description: list all users
    """
    # allusers = UserModel.return_all()
    allusers = UserModel.return_all()
    print(allusers)
    return allusers, 200


@routes.route("/user/info", methods=["GET", "POST"])
@json_resp
@jwt_required
def logged_user():
    """current user model
    ---
    tags:
      - Authentication
    summary: current registered user
    produces:
      - application/json
    responses:
      200:
        description: current user model
    """
    try:
        current_user = get_jwt_identity()
        user = UserModel.query.filter_by(username=current_user).one()
        if flask.request.method == "GET":
            # base stats, to enhance as we go
            result = user.as_secured_dict(True)
            result["stats"] = {
                "platform_attendance": db.session.query(
                    func.count(ObservationModel.id_role)
                )
                .filter(ObservationModel.id_role == user.id_user)
                .one()[0]
            }

            return ({"message": "Vos données personelles", "features": result}, 200)

        if flask.request.method == "POST":
            is_admin = user.admin or False
            current_app.logger.debug("[logged_user] Update current user personnal data")
            request_data = dict(request.get_json())
            for data in request_data:
                if hasattr(UserModel, data) and data not in {
                    "id_user",
                    "password",
                    "admin",
                }:
                    setattr(user, data, request_data[data])

            user.password = UserModel.generate_hash(request_data["password"])
            user.admin = is_admin
            # QUESTION: do we want to update corresponding obs IDs ... in any case ?
            user.update()
            return (
                {
                    "message": "Informations personnelles mises à jour. Merci.",
                    "features": user.as_secured_dict(True),
                },
                200,
            )

    except Exception as e:
        # raise GeonatureApiError(e)
        current_app.logger.error("AUTH ERROR:", str(e))
        return (
            {"message": "Connectez vous pour obtenir vos données personnelles."},
            400,
        )


@routes.route("/user/delete", methods=["DELETE"])
@json_resp
@jwt_required
def delete_user():
    """list all logged users
    ---
    tags:
      - Authentication
    summary: Delete current logged user
    consumes:
      - application/json
    produces:
      - application/json
    responses:
      200:
        description: Delete current logged user
    """
    # Get logged user
    current_app.logger.debug("[delete_user] Delete current user")

    current_user = get_jwt_identity()
    if current_user:
        current_app.logger.debug(
            "[delete_user] current user is {}".format(current_user)
        )
        user = UserModel.query.filter_by(username=current_user)
        # get username
        username = user.one().username
        # delete user
        try:
            db.session.query(UserModel).filter(
                UserModel.username == current_user
            ).delete()
            db.session.commit()
            current_app.logger.debug(
                "[delete_user] user {} succesfully deleted".format(username)
            )
        except Exception as e:
            db.session.rollback()
            raise GeonatureApiError(e)
            return {"message": str(e)}, 400

        return (
            {
                "message": """Account "{}" have been successfully deleted""".format(
                    username
                )
            },
            200,
        )


@routes.route("/user/resetpasswd", methods=["POST"])
@json_resp
def reset_user_password():
    request_datas = dict(request.get_json())
    email = request_datas["email"]
    username = request_datas["username"]

    try:
        user = UserModel.query.filter_by(username=username, email=email).one()
    except Exception:
        return (
            {"message": """L'email "{}" n'est pas enregistré.""".format(email)},
            400,
        )

    passwd = uuid.uuid4().hex[0:6]
    passwd_hash = UserModel.generate_hash(passwd)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = current_app.config["RESET_PASSWD"]["SUBJECT"]
    msg["From"] = current_app.config["RESET_PASSWD"]["FROM"]
    msg["To"] = user.email

    # Record the MIME types of both parts - text/plain and text/html.
    part1 = MIMEText(
        current_app.config["RESET_PASSWD"]["TEXT_TEMPLATE"].format(
            passwd=passwd, app_url=current_app.config["URL_APPLICATION"]
        ),
        "plain",
    )
    part2 = MIMEText(
        current_app.config["RESET_PASSWD"]["HTML_TEMPLATE"].format(
            passwd=passwd, app_url=current_app.config["URL_APPLICATION"]
        ),
        "html",
    )

    # Attach parts into message container.
    # According to RFC 2046, the last part of a multipart message, in this case
    # the HTML message, is best and preferred.
    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL(
            current_app.config["MAIL"]["MAIL_HOST"],
            int(current_app.config["MAIL"]["MAIL_PORT"]),
        ) as server:
            server.login(
                str(current_app.config["MAIL"]["MAIL_AUTH_LOGIN"]),
                str(current_app.config["MAIL"]["MAIL_AUTH_PASSWD"]),
            )
            server.sendmail(
                current_app.config["MAIL"]["MAIL_FROM"], user.email, msg.as_string()
            )
            server.quit()
        user.password = passwd_hash
        db.session.commit()
        return (
            {"message": "Check your email, you credentials have been updated."},
            200,
        )
    except Exception as e:
        current_app.logger.warning(
            "reset_password: failled to send new credentials. %s", str(e)
        )
        return (
            {
                "message": """Echec d'envoi des informations de connexion: "{}".""".format(
                    str(e)
                )
            },
            500,
        )
