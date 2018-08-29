from marshmallow import Schema

from .models import LAreas, LiMunicipalities, BibAreasTypes


class LAreasSchema(Schema):
    class Meta:
        model = LAreas


class LiMunicipalitiesSchema(Schema):
    class Meta:
        model = LiMunicipalities

class BibAreasTypesSchema(Schema):
    class Meta:
        model = BibAreasTypes

#schémas
limunicipality_schema = LiMunicipalitiesSchema()
limunicipalities_schema = LiMunicipalitiesSchema(many=True)
larea_schema = LAreasSchema()
lareas_schema = LAreasSchema(many=True)
bibareatype_schema = BibAreasTypesSchema()
bibareastypes_schema = BibAreasTypesSchema(many=True)