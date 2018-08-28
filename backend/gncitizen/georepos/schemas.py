from marshmallow import Schema

from .models import MunicipalityModel, NaturalAreaModel, PortalAreaModel


class MunicipalitySchema(Schema):
    class Meta:
        model = MunicipalityModel


class NaturalAreaSchema(Schema):
    class Meta:
        model = NaturalAreaModel

class PortalAreaSchema(Schema):
    class Meta:
        model = PortalAreaModel

#schémas
municipality_schema = MunicipalitySchema()
municipalities_schema = MunicipalitySchema(many=True)
naturalarea_schema = NaturalAreaSchema()
naturalareas_schema = NaturalAreaSchema(many=True)
portalarea_schema = PortalAreaSchema()
portalareas_schema = PortalAreaSchema(many=True)