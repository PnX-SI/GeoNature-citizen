#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage jwt"""

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from gncitizen.core.users.models import UserModel


def get_id_role_if_exists():
    """get id_role if exists from ``get_jwt_identity()``

    :return: user id
    :rtype: int
    """
    if get_jwt_identity() is not None:
        current_user = get_jwt_identity()
        id_role = (
            UserModel.query.filter_by(username=current_user).first().id_user
        )
    else:
        id_role = None
    return id_role


def admin_required(func):
    """Admin required decorator that check if user is an ``admin``

    :param func: decorated function
    :type func: func

    :return: decorated function
    :rtype: func
    """

    @wraps(func)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        print("CURRENT USER IS", current_user)
        try:
            is_admin = (
                UserModel.query.filter_by(username=current_user).first().admin
            )
            if not is_admin:
                return {"message": "Special authorization required"}, 403
            return func(*args, **kwargs)
        except Exception as e:
            return jsonify(message=e), 500

    return decorated_function


