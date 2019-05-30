#!/usr/bin/python3
# -*- coding: utf-8 -*-
import enum
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import UUID, JSONB

from gncitizen.core.commons.models import (
    ProgramsModel,
    TimestampMixinModel,
    MediaModel,
)
from gncitizen.core.users.models import ObserverMixinModel
from gncitizen.utils.sqlalchemy import serializable, geoserializable
from gncitizen.core.observations.models import ObservationModel
from server import db
from gncitizen.core.commons.models import ProgramsModel


def create_schema(db):
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_sites")
    db.session.commit()


class SiteType(enum.Enum):
    """Liste et paramêtres des types de sites supportés
    (pour l'instant seulement "mare").
    """

    mare = "..."  #TODO: json_schema file path goes here

    def __init__(self, form_schema):
        self.form_schema = form_schema


@serializable
@geoserializable
class SiteModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sites"""

    __tablename__ = "t_sites"
    __table_args__ = {"schema": "gnc_sites"}
    id_site = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    id_program = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program), nullable=False
    )
    name = db.Column(db.String(250))
    site_type = db.Column(db.Enum(SiteType), nullable=False)
    geom = db.Column(Geometry("POINT", 4326))

    def __repr__(self):
        return "<Site {0}>".format(self.id_site)


@serializable
class CorProgramSiteTypeModel(TimestampMixinModel, db.Model):
    __tablename__ = "cor_program_typesites"
    __table_args__ = {"schema": "gnc_sites"}
    id_cor_program_typesite = db.Column(
        db.Integer, primary_key=True, unique=True
    )
    id_program = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program, ondelete="CASCADE")
    )
    site_type = db.Column(db.Enum(SiteType), nullable=False)


@serializable
class VisitModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sessions de suivis des sites"""

    __tablename__ = "t_visit"
    __table_args__ = {"schema": "gnc_sites"}
    id_visit = db.Column(db.Integer, primary_key=True, unique=True)
    id_site = db.Column(
        db.Integer, db.ForeignKey(SiteModel.id_site, ondelete="CASCADE")
    )
    date = db.Column(db.Date)
    json_data = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return "<Visit {0}>".format(self.id_visit)


class MediaOnVisitModel(TimestampMixinModel, db.Model):
    """Table de correspondance des médias avec les visites de sites"""

    __tablename__ = "cor_visites_media"
    __table_args__ = {"schema": "gnc_sites"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(VisitModel.id_visit, ondelete="SET NULL"),
        nullable=False,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="SET NULL"),
        nullable=False,
    )


class ObservationsOnSiteModel(TimestampMixinModel, db.Model):
    """Table de correspondance des observations avec les sites"""

    __tablename__ = "cor_sites_obstax"
    __table_args__ = {"schema": "gnc_sites"}
    id_cor_site_obstax = db.Column(db.Integer, primary_key=True, unique=True)
    id_site = db.Column(
        db.Integer,
        db.ForeignKey(SiteModel.id_site, ondelete="SET NULL"),
        nullable=False,
    )
    id_obstax = db.Column(
        db.Integer,
        db.ForeignKey(ObservationModel.id_observation, ondelete="SET NULL"),
        nullable=False,
    )