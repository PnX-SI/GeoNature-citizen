"""Flask-Admin views for site module"""

from flask_admin.contrib.sqla.view import ModelView
from gncitizen.utils.admin import CustomJSONField, CustomTileView, json_formatter
from markupsafe import Markup

from .models import VisitModel


def _visits_list_formatter(view, context, model, name):
    # returns the content of a row in h3 html tags
    visits = ", ".join([f"{visit.date}" for visit in model.visits])
    return Markup(visits)


class SiteView(CustomTileView):
    can_export = True
    inline_models = [
        VisitModel,
    ]
    column_formatters = {"visits": _visits_list_formatter}
    # column_exclude_list = ["geom"]
    column_list = [
        "id_site",
        "name",
        "visits",
        "site_type.type",
        "id_program",
        "program.title",
        "program.project.name",
        "geom",
        "timestamp_create",
        "timestamp_update",
    ]
    column_filters = (
        "name",
        "site_type.type",
        "program.title",
        "program.id_program",
        "program.unique_id_program",
        "program.project.id_project",
        "program.project.name",
        "program.project.unique_id_project",
    )
    column_searchable_list = [
        "name",
    ]
    can_create = False


class VisitView(CustomTileView):
    can_export = True
    form_overrides = {"json_data": CustomJSONField}
    column_list = [
        "id_visit",
        "id_site",
        "date",
        "json_data",
        "obs_txt",
        "email",
        "site.geom",
        "timestamp_create",
        "timestamp_update",
    ]
    column_formatters = {
        "json_data": json_formatter,
    }
    column_filters = (
        "date",
        "site.id_site",
        "site.name",
        "site.site_type.type",
        "site.program.title",
        "site.program.id_program",
        "site.program.unique_id_program",
        "site.program.project.id_project",
        "site.program.project.name",
        "site.program.project.unique_id_project",
    )
    column_searchable_list = ["date", "site.name"]
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
    can_create = False


class SiteTypeView(ModelView):
    form_excluded_columns = ["timestamp_create", "timestamp_update"]
