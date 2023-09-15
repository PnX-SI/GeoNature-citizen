from gncitizen.utils.admin import (
    CustomJSONField,
    CustomTileView,
    json_formatter,
)


def enum_formatter(view, context, model, name):
    enum_attr = getattr(model, name)
    return enum_attr.value


class ObservationView(CustomTileView):
    can_export=True
    # column_exclude_list = ["geom"]
    form_overrides = {"json_schema": CustomJSONField}
    column_formatters = {
        "json_schema": json_formatter,
        "validation_status": enum_formatter,
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
