from gncitizen.utils.admin import (
    CustomJSONField,
    CustomTileView,
    json_formatter,
)


class ObservationView(CustomTileView):
    tile_layer_url = "a.tile.openstreetmap.org/{z}/{x}/{y}.png"
    tile_layer_attribution = "some string or html goes here"
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
        "municipality_ref.area_name",
        "municipality_ref.area_code",
    )
    column_searchable_list = (
        "email",
        "date",
        "program_ref.title",
        "program_ref.unique_id_program",
        "municipality_ref.area_name",
        "municipality_ref.area_code",
    )
