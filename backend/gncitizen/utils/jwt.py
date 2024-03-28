#!/usr/bin/env python3

"""A module to manage jwt"""

from functools import wraps

from flask import current_app, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_

from gncitizen.core.users.models import UserModel

logger = current_app.logger


def get_user_if_exists() -> UserModel:
    """[summary]"""
    current_user = get_jwt_identity()
    return (
        UserModel.query.filter(
            or_(
                UserModel.email == current_user,
                UserModel.username == current_user,
            )
        ).one()
        if current_user
        else None
    )


def get_id_role_if_exists():
    """get id_role if exists from ``get_jwt_identity()``

    :return: user id
    :rtype: int
    """
    logger.debug(f"GET_USER_IF_EXISTS() {get_user_if_exists()}")
    return get_user_if_exists().id_user if get_user_if_exists() else None


def admin_required(func):
    """Admin required decorator that check if user is an ``admin``

    :param func: decorated function
    :type func: func

    :return: decorated function
    :rtype: func
    """

    @wraps(func)
    def decorated_function(*args, **kwargs):
        current_user = get_user_if_exists()
        try:
            if not current_user.admin:
                return {"message": "Special authorization required"}, 403
            return func(*args, **kwargs)
        except Exception as e:
            return jsonify(message=e), 500

    return decorated_function
