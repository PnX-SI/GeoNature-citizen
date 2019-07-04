#!/usr/bin/python3
# -*- coding:utf-8 -*-

import json
import urllib.parse

import requests

from flask import Blueprint, current_app, request
from flask_admin.contrib.geoa import ModelView
from flask_admin.form import SecureForm
from flask_ckeditor import CKEditorField
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended.exceptions import UserLoadError
from flask_jwt_extended.utils import (decode_token, has_user_loader,
                                      user_loader,
                                      verify_token_not_blacklisted)
from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import MultiPolygon, asShape
from wtforms import SelectField

from gncitizen.core.users.models import UserModel
from gncitizen.utils.env import admin
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import json_resp
from server import db

from .models import ModulesModel, ProgramsModel
from gncitizen.core.taxonomy.models import BibListes

try:
    from flask import _app_ctx_stack as ctx_stack
except ImportError:  # pragma: no cover
    from flask import _request_ctx_stack as ctx_stack

def taxonomy_lists():
    taxonomy_lists = []
    if current_app.config.get("API_TAXHUB") is None:
        biblistes = BibListes.query.all()
        for tlist in biblistes:
            l = (tlist.id_liste, tlist.nom_liste)
            taxonomy_lists.append(l)
    else:
        from gncitizen.utils.env import taxhub_lists_url
        rtlists = requests.get(taxhub_lists_url)
        current_app.logger.warning(rtlists)
        if rtlists.status_code == 200:
            try:
                tlists = rtlists.json()["data"]
                current_app.logger.debug(tlists)
                for tlist in tlists:
                    l = (tlist['id_liste'], tlist['nom_liste'])
                    taxonomy_lists.append(l)
            except Exception as e:
                current_app.logger.critical(str(e))
    current_app.logger.debug(taxonomy_lists)
    return taxonomy_lists

        



class ProgramView(ModelView):
    form_base_class = SecureForm
    form_overrides = dict(long_desc=CKEditorField)
    # form_overrides = dict(long_desc=CKEditorField, taxonomy_list=SelectField)
    # form_args = dict(
    #     taxonomy_list=dict(
    #         choices=taxonomy_lists()
    #     ))
    create_template = 'edit.html'
    edit_template = 'edit.html'

    def is_accessible(self):
        try:

            token = request.args.get("jwt")
            if not token:
                token = urllib.parse.parse_qsl(request.args.get("url"))[0][1]
            decoded_token = decode_token(token)
            verify_token_not_blacklisted(decoded_token, request_type="access")
            ctx_stack.top.jwt = decoded_token
            if has_user_loader():
                user = user_loader(ctx_stack.top.jwt["identity"])
                if user is None:
                    raise UserLoadError("user_loader returned None for {}".format(user))
                else:
                    ctx_stack.top.jwt_user = user

            current_user = get_jwt_identity()
            is_admin = UserModel.query.filter_by(username=current_user).one().admin
            return current_user and is_admin
        except Exception as e:
            current_app.logger.critical("FAULTY ADMIN UI ACCESS: %s", str(e))
            return False
