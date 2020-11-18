#!/usr/bin/python3
# -*- coding: utf-8 -*-

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey
from sqlalchemy.sql import expression
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

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
class ModulesModel(TimestampMixinModel, db.Model):
    """Table des modules de GeoNature-citizen"""

    __tablename__ = "t_modules"
    __table_args__ = {"schema": "gnc_core"}
    id_module = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    label = db.Column(db.String(50), nullable=False)
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

from geoalchemy2.functions import ST_GeomFromKML, ST_GeomFromGeoJSON

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
        name, ext = os.path.splitext(self.geom_file)
        with open(self.get_geom_file_path()) as geom_file:
            geo_data = geom_file.read()
            if ext in ['.geojson', '.json']:
                self.geom = ST_GeomFromGeoJSON(geo_data)
            elif ext == '.kml':
                self.geom = ST_GeomFromKML(geo_data)

    def __repr__(self):
        return self.name

from geoalchemy2.shape import to_shape
from geojson import Feature

@serializable
@geoserializable
class ProgramsModel(TimestampMixinModel, db.Model):
    """Table des Programmes de GeoNature-citizen"""

    __tablename__ = "t_programs"
    __table_args__ = {"schema": "gnc_core"}
    id_program = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    short_desc = db.Column(db.String(200), nullable=False)
    long_desc = db.Column(db.Text(), nullable=False)
    form_message = db.Column(db.String(500))
    image = db.Column(db.String(250))
    logo = db.Column(db.String(250))
    id_module = db.Column(
        db.Integer,
        ForeignKey(ModulesModel.id_module),
        nullable=False,
        default=1,
    )
    module = relationship("ModulesModel")
    taxonomy_list = db.Column(
        db.Integer, 
        #ForeignKey(BibListes.id_liste), 
        nullable=True
    )
    is_active = db.Column(
        db.Boolean(), server_default=expression.true(), default=True
    )
    # geom = db.Column(Geometry("GEOMETRY", 4326))
    id_geom = db.Column(
        db.Integer, db.ForeignKey(GeometryModel.id_geom), nullable=False
    )
    geometry = relationship("GeometryModel")
    id_form = db.Column(
        db.Integer, db.ForeignKey(CustomFormModel.id_form), nullable=True
    )
    custom_form = relationship("CustomFormModel")

    def get_geofeature(self, recursif=True, columns=None):
        geometry = to_shape(self.geometry.geom)
        feature = Feature(
            id=self.id_program,
            geometry=geometry,
            properties=self.as_dict(True),
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
