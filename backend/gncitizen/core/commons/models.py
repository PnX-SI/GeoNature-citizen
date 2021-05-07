#!/usr/bin/python3
# -*- coding: utf-8 -*-

from datetime import datetime
import uuid

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey
from sqlalchemy.sql import expression
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID

from gncitizen.core.taxonomy.models import BibListes
from gncitizen.utils.env import db, MEDIA_DIR
from gncitizen.utils.sqlalchemy import serializable, geoserializable
import os


class TimestampMixinModel(object):
    """Structure commune de suivi des modifications d'une table"""

    @declared_attr
    def timestamp_create(cls):
        return db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @declared_attr
    def timestamp_update(cls):
        return db.Column(
            db.DateTime,
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        )


@serializable
class TModules(TimestampMixinModel, db.Model):
    """Table des modules de GeoNature-citizen"""

    __tablename__ = "t_modules"
    __table_args__ = {"schema": "gnc_core"}
    id_module = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    label = db.Column(db.String(50), nullable=False, unique=True)
    desc = db.Column(db.String(200))
    icon = db.Column(db.String(250))
    on_sidebar = db.Column(db.Boolean(), default=False)

    def __repr__(self):
        return self.name


@serializable
class CustomFormModel(TimestampMixinModel, db.Model):
    """Table des Formulaires spécifiques associés aux programmes"""

    __tablename__ = "t_custom_form"
    __table_args__ = {"schema": "gnc_core"}
    id_form = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.String(250))
    json_schema = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return self.name


from geoalchemy2.functions import ST_GeomFromKML, ST_GeomFromGeoJSON, ST_SetSRID
import json
import xml.etree.ElementTree as ET


@serializable
class GeometryModel(TimestampMixinModel, db.Model):
    """Table des géométries associées aux programmes"""

    __tablename__ = "t_geometries"
    __table_args__ = {"schema": "gnc_core"}
    id_geom = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text(), nullable=True)
    geom = db.Column(Geometry("GEOMETRY", 4326))
    geom_file = db.Column(db.String(250), nullable=True)

    def get_geom_file_path(self):
        return os.path.join(str(MEDIA_DIR), self.geom_file)

    def set_geom_from_geom_file(self):
        gnc_invalid_err_message = "Géométrie non valide pour GNC"
        name, ext = os.path.splitext(self.geom_file)
        with open(self.get_geom_file_path()) as geom_file:
            geo_data = geom_file.read()
            if ext in [".geojson", ".json"]:
                json_geom = json.loads(geo_data)["features"][0]["geometry"]
                # Validate geometry type
                if not json_geom["type"] in ["Polygon", "MultiPolygon"]:
                    raise Exception(gnc_invalid_err_message)
                else:
                    # Minimal coordinate system check
                    coords = json_geom["coordinates"][0][0]
                    if json_geom["type"] == "MultiPolygon":
                        coords = coords[0]
                    x, y = coords
                    if abs(x) > 180 or abs(y) > 180:
                        raise Exception("Mauvais système de projection")
                # Convert Geo
                self.geom = ST_SetSRID(ST_GeomFromGeoJSON(json.dumps(json_geom)), 4326)
            elif ext == ".kml":
                kml_root = ET.fromstring(geo_data)
                kml_geom_elt = None
                # Find first MultiGeometry or Polygon node
                for child in kml_root.iter():
                    if "MultiGeometry" in child.tag or "Polygon" in child.tag:
                        kml_geom_elt = child
                        if "MultiGeometry" in child.tag:
                            # We want only Polygon nodes inside the geometry
                            for elt in kml_geom_elt.getchildren():
                                if not "Polygon" in elt.tag:
                                    raise Exception(gnc_invalid_err_message)
                if kml_geom_elt is None:
                    raise Exception(gnc_invalid_err_message)
                kml_geom = ET.tostring(kml_geom_elt, encoding="unicode", method="xml")
                self.geom = ST_GeomFromKML(kml_geom)  # KML is always 4326 srid

    def __repr__(self):
        return self.name


from geoalchemy2.shape import to_shape
from geojson import Feature


@serializable
class ProjectModel(TimestampMixinModel, db.Model):
    """Table des projets regroupant les programmes"""

    __tablename__ = "t_projects"
    __table_args__ = {"schema": "gnc_core"}
    id_project = db.Column(db.Integer, primary_key=True)
    unique_id_project = db.Column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False
    )
    name = db.Column(db.String(50), nullable=False)
    short_desc = db.Column(db.String(200), nullable=True)
    long_desc = db.Column(db.Text(), nullable=True)

    def __repr__(self):
        return self.name


@serializable
@geoserializable
class ProgramsModel(TimestampMixinModel, db.Model):
    """Table des Programmes de GeoNature-citizen"""

    __tablename__ = "t_programs"
    __table_args__ = {"schema": "gnc_core"}
    id_program = db.Column(db.Integer, primary_key=True)
    unique_id_program = db.Column(
        UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False
    )
    id_project = db.Column(
        db.Integer, db.ForeignKey(ProjectModel.id_project), nullable=False
    )
    title = db.Column(db.String(50), nullable=False)
    short_desc = db.Column(db.String(200), nullable=False)
    long_desc = db.Column(db.Text(), nullable=False)
    form_message = db.Column(db.String(500))
    image = db.Column(db.String(250))
    logo = db.Column(db.String(250))
    id_module = db.Column(
        db.Integer, ForeignKey(TModules.id_module), nullable=False, default=1,
    )
    module = relationship("TModules")
    taxonomy_list = db.Column(db.Integer, nullable=True)
    registration_required = db.Column(db.Boolean(), default=False)
    is_active = db.Column(db.Boolean(), server_default=expression.true(), default=True)
    id_geom = db.Column(
        db.Integer, db.ForeignKey(GeometryModel.id_geom), nullable=False
    )
    id_form = db.Column(
        db.Integer, db.ForeignKey(CustomFormModel.id_form), nullable=True
    )
    custom_form = relationship("CustomFormModel")
    geometry = relationship("GeometryModel")
    project = relationship("ProjectModel")

    def get_geofeature(self, recursif=True, columns=None):
        geometry = to_shape(self.geometry.geom)
        feature = Feature(
            id=self.id_program, geometry=geometry, properties=self.as_dict(True),
        )
        return feature

    def __repr__(self):
        return self.title


@serializable
@geoserializable
class MediaModel(TimestampMixinModel, db.Model):
    """Table des Programmes de GeoNature-citizen
        """

    __tablename__ = "t_medias"
    __table_args__ = {"schema": "gnc_core"}
    id_media = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return self.filename
