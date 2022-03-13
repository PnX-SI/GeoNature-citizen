from gncitizen.utils.admin import (
    CustomJSONField,
    CustomTileView,
    json_formatter,
)


class ObservationView(CustomTileView):
    # column_exclude_list = ["geom"]
    form_overrides = {"json_schema": CustomJSONField}
    column_formatters = {
        "json_schema": json_formatter,
    }
    column_filters = (
        "email",
        "cd_nom",
        "date",
        "id_program",
        "program_ref.title",
        "program_ref.unique_id_program",
        "municipality",
    )
    column_searchable_list = (
        "email",
        "date",
        "program_ref.title",
        "program_ref.unique_id_program",
        "municipality",
    )
    can_create = False
