#!/usr/bin/python3
# -*- coding: utf-8 -*-

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import UUID

from gncitizen.core.commons.models import (
    ProgramsModel,
    TimestampMixinModel,
    MediaModel,
)
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.taxonomy.models import Taxref
from gncitizen.core.users.models import ObserverMixinModel
from gncitizen.utils.utilssqlalchemy import serializable, geoserializable
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
        db.Integer, db.ForeignKey(ProgramsModel.id_program), nullable=False
    )
    cd_nom = db.Column(db.Integer, db.ForeignKey(Taxref.cd_nom), nullable=False)
    specie = db.Column(db.String(200))
    date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    # FIXME: remove nullable prop from ObservationModel.municipality once debugged
    municipality = db.Column(db.Integer, db.ForeignKey(LAreas.id_area), nullable=True)
    id_media = db.Column(
        db.Integer, db.ForeignKey(MediaModel.id_media, ondelete="SET NULL")
    )
    geom = db.Column(Geometry("POINT", 4326))
