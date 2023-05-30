#!/usr/bin/python3
# -*- coding:utf-8 -*-
import requests
from flask import current_app, flash
from flask_admin.contrib.sqla.view import ModelView
from flask_admin.form.upload import FileUploadField
from flask_admin.model.form import InlineFormAdmin
from flask_ckeditor import CKEditorField
from wtforms import SelectField

from gncitizen.core.sites.models import CorProgramSiteTypeModel
from gncitizen.utils.admin import CustomJSONField, CustomTileView, json_formatter
from gncitizen.utils.env import MEDIA_DIR, taxhub_lists_url

logger = current_app.logger


def taxonomy_lists():
    taxonomy_lists = []

    taxa_lists = requests.get(taxhub_lists_url)
    logger.debug(taxa_lists)
    if taxa_lists.status_code == 200:
        try:
            taxa_lists = taxa_lists.json()["data"]
            logger.debug(taxa_lists)
            for taxa_list in taxa_lists:
                taxonomy_lists.append((taxa_list["id_liste"], taxa_list["nom_liste"]))
        except Exception as e:
            logger.critical(str(e))
    logger.debug(taxonomy_lists)
    return taxonomy_lists


class CorProgramSiteTypeModelInlineForm(InlineFormAdmin):
    form_columns = ("site_type",)


class ProjectView(ModelView):
    form_overrides = {"long_desc": CKEditorField}
    create_template = "edit.html"
    edit_template = "edit.html"
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    column_exclude_list = ["long_desc", "short_desc"]


class ProgramView(ModelView):
    form_overrides = {"long_desc": CKEditorField, "taxonomy_list": SelectField}
    form_args = {"taxonomy_list": {"choices": taxonomy_lists(), "coerce": int}}
    create_template = "edit.html"
    edit_template = "edit.html"
    form_excluded_columns = [
        "timestamp_create",
        "timestamp_update",
        "t_obstax",
    ]
    column_exclude_list = [
        "long_desc",
        "form_message",
        "short_desc",
        "image",
        "logo",
    ]
    column_filters = (
        "module.label",
        "project.name",
        "is_active",
    )
    column_searchable_list = (
        "title",
        "project.name",
    )

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
    form_overrides = {"json_schema": CustomJSONField}
    column_formatters = {
        "json_schema": json_formatter,
    }


class UserView(ModelView):
    column_exclude_list = ["password"]
    form_excluded_columns = [
        "timestamp_create",
        "timestamp_update",
        "password",
    ]
    can_create = False


def get_geom_file_path(obj, file_data):
    return "geometries/{}".format(file_data.filename)


class GeometryView(CustomTileView):
    # column_exclude_list = ["geom"]
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    column_exclude_list = ["geom", "geom_file"]
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
        logger.debug(f"data {form.data}")
        logger.debug(f"geom_file {form.geom_file}")
        logger.debug(f"model {dir(model)}")
        if form.data["geom_file"]:
            model.set_geom_from_geom_file()

    def handle_view_exception(self, exc):
        flash("Une erreur s'est produite ({})".format(exc), "error")
        logger.critical(exc)
        return True
