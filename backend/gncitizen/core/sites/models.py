#!/usr/bin/python3
# -*- coding: utf-8 -*-
# import enum

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from utils_flask_sqla_geo.serializers import geoserializable, serializable

from gncitizen.core.commons.models import (
    CustomFormModel,
    MediaModel,
    ProgramsModel,
    TimestampMixinModel,
)
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.users.models import ObserverMixinModel
from server import db


def create_schema(db):
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_sites")
    db.session.commit()


@serializable
class SiteTypeModel(TimestampMixinModel, db.Model):
    """Table des types de sites
    Formulaire généré par la lib https://github.com/hamzahamidi/ajsf
    json de création de formulaire enregistré dans custom_form.json_schema"""

    __tablename__ = "t_typesite"
    __table_args__ = {"schema": "gnc_sites"}
    id_typesite = db.Column(db.Integer, primary_key=True, unique=True)
    category = db.Column(db.String(200))
    type = db.Column(db.String(200))
    id_form = db.Column(db.Integer, db.ForeignKey(CustomFormModel.id_form), nullable=True)
    custom_form = relationship("CustomFormModel")
    pictogram = db.Column(db.Text)

    def __repr__(self):
        return "<TypeSite {0} : {1}>".format(self.id_typesite, self.type)


@serializable
@geoserializable
class SiteModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sites"""

    __tablename__ = "t_sites"
    __table_args__ = {"schema": "gnc_sites"}
    id_site = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    id_program = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program), nullable=False, index=True
    )
    program = relationship("ProgramsModel")
    name = db.Column(db.String(250))
    id_type = db.Column(
        db.Integer, db.ForeignKey(SiteTypeModel.id_typesite), nullable=False, index=True
    )
    site_type = relationship("SiteTypeModel")
    geom = db.Column(
        Geometry(
            geometry_type="POINT",
            srid=4326,
            spatial_index=True,
        )
    )

    def __repr__(self):
        return f"Site #{self.id_site} - {self.name}"


@serializable
class CorProgramSiteTypeModel(TimestampMixinModel, db.Model):
    __tablename__ = "cor_program_typesites"
    __table_args__ = {"schema": "gnc_sites"}
    id_cor_program_typesite = db.Column(db.Integer, primary_key=True, unique=True)
    id_program = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program, ondelete="CASCADE"), index=True
    )
    program = relationship("ProgramsModel", backref="site_types")
    id_typesite = db.Column(
        db.Integer, db.ForeignKey(SiteTypeModel.id_typesite, ondelete="CASCADE"), index=True
    )
    site_type = relationship("SiteTypeModel")


@serializable
class VisitModel(TimestampMixinModel, ObserverMixinModel, db.Model):
    """Table des sessions de suivis des sites"""

    __tablename__ = "t_visit"
    __table_args__ = {"schema": "gnc_sites"}
    id_visit = db.Column(db.Integer, primary_key=True, unique=True)
    id_site = db.Column(
        db.Integer, db.ForeignKey(SiteModel.id_site, ondelete="CASCADE"), index=True
    )
    site = db.relationship("SiteModel", backref=db.backref("visits"))
    date = db.Column(db.Date)
    json_data = db.Column(JSONB, nullable=True)

    def __repr__(self):
        return f"Visit #{self.id_visit}"


class MediaOnVisitModel(TimestampMixinModel, db.Model):
    """Table de correspondance des médias avec les visites de sites"""

    __tablename__ = "cor_visites_media"
    __table_args__ = {"schema": "gnc_sites"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(VisitModel.id_visit, ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
        index=True,
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
        index=True,
    )
    id_obstax = db.Column(
        db.Integer,
        db.ForeignKey(ObservationModel.id_observation, ondelete="SET NULL"),
        nullable=False,
        index=True,
    )
