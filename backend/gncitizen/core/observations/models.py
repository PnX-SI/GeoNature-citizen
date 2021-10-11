#!/usr/bin/python3
# -*- coding: utf-8 -*-

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import JSONB, UUID
from utils_flask_sqla_geo.serializers import geoserializable, serializable

from gncitizen.core.commons.models import (
    MediaModel,
    ProgramsModel,
    TimestampMixinModel,
)
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.users.models import ObserverMixinModel
from server import db


@serializable
@geoserializable
class ObservationModel(ObserverMixinModel, TimestampMixinModel, db.Model):
    """Table des observations"""

    __tablename__ = "t_obstax"
    __table_args__ = {"schema": "gnc_obstax"}
    id_observation = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    id_program = db.Column(
        db.Integer,
        db.ForeignKey(ProgramsModel.id_program, ondelete="SET NULL"),
        nullable=False,
    )
    cd_nom = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    # FIXME: remove nullable prop from ObservationModel.municipality once debugged
    municipality = db.Column(
        db.Integer, db.ForeignKey(LAreas.id_area), nullable=True
    )
    geom = db.Column(Geometry("POINT", 4326))
    json_data = db.Column(JSONB, nullable=True)

    program_ref = db.relationship(
        "ProgramsModel", backref=db.backref("t_obstax", lazy="dynamic")
    )
    municipality_ref = db.relationship(
        "LAreas", backref=db.backref("l_areas", lazy="dynamic")
    )


class ObservationMediaModel(TimestampMixinModel, db.Model):
    """Table de correspondances des médias (photos) avec les observations"""

    __tablename__ = "cor_obstax_media"
    __table_args__ = {"schema": "gnc_obstax"}
    id_match = db.Column(db.Integer, primary_key=True, unique=True)
    id_data_source = db.Column(
        db.Integer,
        db.ForeignKey(ObservationModel.id_observation, ondelete="CASCADE"),
        nullable=False,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
    )
