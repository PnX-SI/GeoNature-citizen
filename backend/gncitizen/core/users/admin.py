#!/usr/bin/python3
"""Users admin views"""

from flask import current_app
from flask_admin.contrib.sqla.view import ModelView
from wtforms import fields, validators

logger = current_app.logger


class UserView(ModelView):
    """Flask-Admin user view

    Args:
        ModelView (_type_): _description_
    """

    column_exclude_list = ["password"]
    column_filters = (
        "username",
        "name",
        "surname",
        "email",
        "active",
        "admin",
        "validator",
    )
    column_searchable_list = (
        "username",
        "name",
        "surname",
        "email",
    )
    form_columns = (
        "username",
        "name",
        "surname",
        "password",
        "email",
        "phone",
        "avatar",
        "active",
        "admin",
        "validator",
    )
    form_excluded_columns = [
        "timestamp_create",
        "timestamp_update",
        "validator_obs",
        "observer_obs",
    ]
    form_extra_fields = {
        "password": fields.PasswordField("Password"),
        "email": fields.EmailField("Email", validators=[validators.input_required()]),
    }
