#!/usr/bin/python3
# -*- coding: utf-8 -*-
# import enum
import os

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from gncitizen.core.commons.models import (
    ProgramsModel,
    TimestampMixinModel,
    MediaModel,
)
from gncitizen.core.users.models import ObserverMixinModel, UserModel
from utils_flask_sqla_geo.serializers import geoserializable, serializable
from server import db
from gncitizen.core.commons.models import ProgramsModel


def create_schema(db):
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_areas")
    db.session.commit()


@serializable
@geoserializable
class AreaModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sites"""

    __tablename__ = "t_areas"
    __table_args__ = {"schema": "gnc_areas"}
    id_area = db.Column(db.Integer, primary_key=True, unique=True)
    id_program = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program), nullable=False
    )
    program = relationship("ProgramsModel")
    name = db.Column(db.String(250))
    geom = db.Column(Geometry("POLYGON"))
    municipality = db.Column(db.String(250))
    json_data = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return "<Area {0}>".format(self.id_area)


@serializable
class AreasAccessModel(TimestampMixinModel, db.Model):
    """Table de gestion des accès aux zones par utilisateur"""

    __tablename__ = "t_areas_access"
    __table_args__ = {"schema": "gnc_areas"}
    id_areas_access = db.Column(db.Integer, primary_key=True, unique=True)
    id_user = db.Column(
        db.Integer,
        db.ForeignKey(UserModel.id_user, ondelete="CASCADE"),
        nullable=False,
    )
    id_area = db.Column(
        db.Integer,
        db.ForeignKey(AreaModel.id_area, ondelete="CASCADE"),
        nullable=False,
    )


@serializable
@geoserializable
class SpeciesSiteModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sites d'espèces au sein de zones"""

    __tablename__ = "t_species_sites"
    __table_args__ = {"schema": "gnc_areas"}
    id_species_site = db.Column(db.Integer, primary_key=True, unique=True)
    id_area = db.Column(
        db.Integer, db.ForeignKey(AreaModel.id_area, ondelete="CASCADE")
    )
    name = db.Column(db.String(250))
    area = relationship("AreaModel")
    geom = db.Column(Geometry("POINT", 4326))
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    cd_nom = db.Column(db.Integer, nullable=False)

    json_data = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return "<SpeciesSite {0}>".format(self.id_species_site)


class MediaOnSpeciesSiteModel(TimestampMixinModel, db.Model):
    """Table de correspondance des médias avec les sites d'espèces"""

    __tablename__ = "cor_species_sites_media"
    __table_args__ = {"schema": "gnc_areas"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(SpeciesSiteModel.id_species_site, ondelete="CASCADE"),
        nullable=False,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
    )


@serializable
class SpeciesStageModel(db.Model):
    """Table des stades possibles pour une espèce"""

    __tablename__ = "t_species_stages"
    __table_args__ = {"schema": "gnc_areas"}
    id_species_stage = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.String(250))
    icon = db.Column(db.String(250))
    active = db.Column(db.Boolean(), default=True)
    cd_nom = db.Column(db.Integer, nullable=False)
    order = db.Column(db.Integer)
    start_month = db.Column(db.Integer)
    start_day = db.Column(db.Integer)
    end_month = db.Column(db.Integer)
    end_day = db.Column(db.Integer)


@serializable
class StagesStepModel(db.Model):
    """Table des étapes d'observations possibles pour chaque stade"""

    __tablename__ = "t_stages_steps"
    __table_args__ = {"schema": "gnc_areas"}
    id_stages_step = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.String(250))
    tooltip = db.Column(db.String(350))
    id_species_stage = db.Column(
        db.Integer,
        db.ForeignKey(SpeciesStageModel.id_species_stage, ondelete="CASCADE"),
    )
    species_stage = relationship("SpeciesStageModel")
    order = db.Column(db.Integer)


class MediaOnStagesStepsModel(TimestampMixinModel, db.Model):
    """Table de correspondance des médias avec les étapes de chaque stade"""

    __tablename__ = "cor_stages_steps_media"
    __table_args__ = {"schema": "gnc_areas"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(StagesStepModel.id_stages_step, ondelete="CASCADE"),
        nullable=False,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
    )
    media = relationship("MediaModel")


@serializable
class SpeciesSiteObservationModel(
    ObserverMixinModel, TimestampMixinModel, db.Model
):
    """Table des observations"""

    __tablename__ = "t_species_site_observations"
    __table_args__ = {"schema": "gnc_areas"}
    id_species_site_observation = db.Column(
        db.Integer, primary_key=True, unique=True
    )
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    state = db.Column(db.String(150))
    date = db.Column(db.Date, nullable=False)
    json_data = db.Column(JSONB, nullable=True)
    id_species_site = db.Column(
        db.Integer,
        db.ForeignKey(SpeciesSiteModel.id_species_site, ondelete="CASCADE"),
    )
    species_site = relationship("SpeciesSiteModel")
    id_stages_step = db.Column(
        db.Integer, db.ForeignKey(StagesStepModel.id_stages_step)
    )
    stages_step = relationship("StagesStepModel")


class MediaOnSpeciesSiteObservationModel(TimestampMixinModel, db.Model):
    """Table de correspondance des médias avec les observations sur sites d'espèces"""

    __tablename__ = "cor_species_site_observation_media"
    __table_args__ = {"schema": "gnc_areas"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(
            SpeciesSiteObservationModel.id_species_site_observation,
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
    )
