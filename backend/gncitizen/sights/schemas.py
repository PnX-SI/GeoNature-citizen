from marshmallow import Schema, fields, ValidationError


def must_not_be_blank(data):
    if not data:
        raise ValidationError('Data not provided.')

class SpecieSchema(Schema):
    """Schéma Marschmallow des espèces"""
    id = fields.Int()
    cd_nom = fields.Int()
    common_name = fields.Str()
    sci_name = fields.Str()

    def format_name(self, specie):
        return '{}, (<i>{}</i>)'.format(specie.common_name, specie.sci_name)


class SightSchema(Schema):
    """Schéma marshmallow des observations"""
    id = fields.Int(dump_only=True)
    specie = fields.Nested(SpecieSchema, validate=[must_not_be_blank])
    date = fields.Date(required=True, validate=[must_not_be_blank])
    count = fields.Integer(required=False)
    timestamp_create = fields.DateTime(dump_only=True)


specie_schema = SpecieSchema()
species_schema = SpecieSchema(many=True)
sight_schema = SightSchema()
sights_schema = SightSchema(many=True, only=('id_sight', 'count', 'specie'))

