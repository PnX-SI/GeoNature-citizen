from geoalchemy2 import Geometry
from gncitizen.utils.sqlalchemy import serializable, geoserializable

from server import db


@serializable
@geoserializable
class LAreas(db.Model):
    __tablename__ = "l_areas"
    __table_args__ = {"schema": "ref_geo"}
    id_area = db.Column(db.Integer, primary_key=True)
    id_type = db.Column(
        db.Integer, db.ForeignKey("ref_geo.bib_areas_types.id_type")
    )
    area_name = db.Column(db.Unicode)
    area_code = db.Column(db.Unicode)
    source = db.Column(db.Unicode)
    enable = db.Column(db.Boolean)
    geom = db.Column(Geometry("GEOMETRY", 4326))

    def get_geofeature(self, recursif=True):
        return self.as_geofeature("geom", "id_area", recursif)


@serializable
@geoserializable
class BibAreasTypes(db.Model):
    __tablename__ = "bib_areas_types"
    __table_args__ = {"schema": "ref_geo"}
    id_type = db.Column(db.Integer, primary_key=True)
    type_name = db.Column(db.Unicode)
    type_code = db.Column(db.Unicode)
    type_desc = db.Column(db.Unicode)
    ref_name = db.Column(db.Unicode)
    ref_version = db.Column(db.Integer)
    num_version = db.Column(db.Unicode)


@serializable
@geoserializable
class LiMunicipalities(db.Model):
    __tablename__ = "li_municipalities"
    __table_args__ = {"schema": "ref_geo"}
    id_municipality = db.Column(db.Unicode, primary_key=True, unique=True)
    nom_com = db.Column(db.Unicode)
    id_area = db.Column(
        db.Integer, db.ForeignKey("ref_geo.l_areas.id_area"), unique=True
    )
    insee_com = db.Column(db.Integer)

