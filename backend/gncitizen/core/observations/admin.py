from wtforms import SelectField
from flask_admin.actions import action

from gncitizen.utils.admin import (
    CustomJSONField,
    CustomTileView,
    json_formatter,
)

from .models import ValidationStatus, ObservationModel
from server import db


def enum_formatter(view, context, model, name):
    enum_attr = getattr(model, name)
    return enum_attr.value


class ObservationView(CustomTileView):
    can_export=True
    # column_exclude_list = ["geom"]
    form_overrides = {
        "json_schema": CustomJSONField,
        "validation_status": SelectField
    }
    form_args = {"validation_status": {"choices": ValidationStatus.choices(), "coerce": ValidationStatus.coerce}}
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


    @action('validate', 'Validate observations', 'Are you sure you want to validate selected observation(s)?')
    def action_validate(self, ids):
        observations_to_validate = db.session.query(ObservationModel).filter(ObservationModel.id_observation.in_(ids))
        for observation in observations_to_validate:
            observation.validation_status = ValidationStatus.VALIDATED
        db.session.commit()
