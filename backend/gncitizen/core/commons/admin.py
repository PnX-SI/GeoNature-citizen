#!/usr/bin/python3
# -*- coding:utf-8 -*-

import json
import urllib.parse

import requests

from flask import Blueprint, current_app, request, flash
from flask_admin.contrib.geoa import ModelView
from flask_admin.form.upload import FileUploadField
from flask_ckeditor import CKEditorField 

from geoalchemy2.shape import from_shape
from geojson import FeatureCollection
from shapely.geometry import MultiPolygon, asShape
from wtforms import SelectField

import json
from flask_admin.contrib.sqla.view import ModelView
from jinja2 import Markup

from gncitizen.core.users.models import UserModel
from gncitizen.core.sites.models import CorProgramSiteTypeModel
from gncitizen.utils.env import admin, MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.sqlalchemy import json_resp
from server import db

from .models import ProgramsModel
from gncitizen.core.taxonomy.models import BibListes
import os


def json_formatter(view, context, model, name):
    value = getattr(model, name)
    json_value = json.dumps(value, ensure_ascii=False, indent=2)
    return Markup("<pre>{}</pre>".format(json_value))


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
        # current_app.logger.warning(rtlists)
        if rtlists.status_code == 200:
            try:
                tlists = rtlists.json()["data"]
                # current_app.logger.debug(tlists)
                for tlist in tlists:
                    l = (tlist["id_liste"], tlist["nom_liste"])
                    taxonomy_lists.append(l)
            except Exception as e:
                current_app.logger.critical(str(e))
    # current_app.logger.debug(taxonomy_lists)
    return taxonomy_lists


from flask_admin.model.form import InlineFormAdmin


class CorProgramSiteTypeModelInlineForm(InlineFormAdmin):
    form_columns = ("site_type",)


class ProjectView(ModelView):
    form_overrides = {"long_desc": CKEditorField}
    create_template = "edit.html"
    create_template = "edit.html"
    edit_template = "edit.html"
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    column_exclude_list = ['long_desc','short_desc']


class ProgramView(ModelView):
    form_overrides = {"long_desc": CKEditorField, "taxonomy_list": SelectField}
    form_args = {"taxonomy_list": {"choices": taxonomy_lists(), "coerce": int}}
    create_template = "edit.html"
    edit_template = "edit.html"
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    column_exclude_list = ['long_desc','form_message','short_desc','image','logo']
    inline_models = [
        (
            CorProgramSiteTypeModel,
            dict(
                form_columns=["id_cor_program_typesite", "site_type"],
                form_label="Types de site",
            ),
        )
    ]


class CustomFormView(ModelView):
    column_formatters = {
        "json_schema": json_formatter,
    }


class UserView(ModelView):
    column_exclude_list = ["password"]
    form_excluded_columns = ["timestamp_create", "timestamp_update", "password"]


def get_geom_file_path(obj, file_data):
    return "geometries/{}".format(file_data.filename)


class GeometryView(ModelView):
    column_exclude_list = ["geom"]
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    form_overrides = dict(geom_file=FileUploadField)
    form_args = dict(
        geom_file=dict(
            label="Fichier zone",
            description="""
                Le fichier contenant la géométrie de la zone doit être au format geojson ou kml.<br>
                Seules les types Polygon et MultiPolygon (ou MultiGeometry pour kml) sont acceptées.<br>
                Les fichiers GeoJson fournis devront être en projection WGS84 (donc SRID 4326) 
                et respecter le format "FeatureCollection" tel que présenté ici :
                https://tools.ietf.org/html/rfc7946#section-1.5.
            """,
            base_path=str(MEDIA_DIR),
            allowed_extensions=["geojson", "json", "kml"],
            namegen=get_geom_file_path,
        )
    )

    def on_model_change(self, form, model, is_created):
        model.set_geom_from_geom_file()

    def handle_view_exception(self, exc):
        flash("Une erreur s'est produite ({})".format(exc), "error")
        return True

class ObservationView(ModelView):
    create_template = "edit.html"
    edit_template = "edit.html"
