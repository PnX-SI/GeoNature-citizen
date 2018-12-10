from flask_jwt_extended import get_jwt_identity, jwt_refresh_token_required
from functools import wraps
from gncitizen.core.users.models import UserModel
from gncitizen.utils.utilssqlalchemy import json_resp
from flask import jsonify


def get_id_role_if_exists():
    if get_jwt_identity() is not None:
        current_user = get_jwt_identity()
        id_role = UserModel.query.filter_by(
            username=current_user).first().id_user
    else:
        id_role = None
    return id_role


def admin_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        print("CURRENT USER IS", current_user)
        try:
            is_admin = UserModel.query.filter_by(
                username=current_user).first().admin
            if not is_admin:
                return jsonify(message='You do not have access'), 403
            return func(*args, **kwargs)
        except Exception as e:
            return jsonify('messge': e), 500
    return decorated_function
