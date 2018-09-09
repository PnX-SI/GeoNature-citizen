# from geoalchemy2.shape import to_shape
# from geojson import GeometryCollection
# from marshmallow import pre_dump
from marshmallow import Schema, fields

from gncitizen.utils.utilspost import must_not_be_blank


# class SpecieSchema(Schema):
#     """Schéma Marschmallow des espèces"""
#     id = fields.Int()
#     cd_nom = fields.Int()
#     common_name = fields.Str()
#     sci_name = fields.Str()
#
#     def format_name(self, specie):
#         return '{}, (<i>{}</i>)'.format(specie.common_name, specie.sci_name)


class SightSchema(Schema):
    """Schéma marshmallow des observations"""
    id_sight = fields.Int(dump_only=True)
    cd_nom = fields.Int(required=True, validate=[must_not_be_blank])
    date = fields.Date(required=True, validate=[must_not_be_blank])
    count = fields.Integer(required=False)
    obs_txt = fields.String(required=False)
    email = fields.String(required=False)
    phone = fields.String(required=False)
    timestamp_create = fields.DateTime(dump_only=True)
    # municipality = fields.String(required=False)
    geom = fields.Dict(required=True, validate=[must_not_be_blank])

    # @pre_dump(pass_many=False)
    # def wkb_to_geojson(self, data):
    #     data.geom = GeometryCollection(to_shape(data.geom))
    #     return data


sight_schema = SightSchema()
sights_schema = SightSchema(many=True, only=('id_sight', 'count', 'id_role', 'obs_txt', 'geom', 'cd_nom'))
