from flask_admin.actions import action
from flask_admin.contrib.sqla.view import ModelView
from gncitizen.utils.admin import CustomJSONField, CustomTileView, json_formatter
from server import db
from wtforms import SelectField

from .models import SiteModel, VisitModel


def enum_formatter(view, context, model, name):
    enum_attr = getattr(model, name)
    return enum_attr.value


class SiteView(CustomTileView):
    can_export = True
    inline_models = [
        VisitModel,
    ]
    # column_exclude_list = ["geom"]
    column_list = [
        "id_site",
        "name",
        "visits",
        "site_type.type",
        "id_program",
        "program.title",
        "geom",
    ]
    column_filters = (
        "name",
        "site_type.type",
        "id_program",
        "program.title",
        "program.unique_id_program",
    )
    column_searchable_list = (
        "name",
        "site_type.type",
        "id_program",
        "program.title",
        "program.unique_id_program",
    )
    can_create = False


class VisitView(CustomTileView):
    can_export = True
    form_overrides = {"json_data": CustomJSONField}
    column_formatters = {
        "json_data": json_formatter,
    }
    # column_exclude_list = ["geom"]
    column_filters = (
        "date",
        "site.site_type.type",
        "site.id_program",
        "site.program.title",
        "site.program.unique_id_program",
    )
    can_create = False


class SiteTypeView(ModelView):
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
