#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import UUID

from gncitizen.core.commons.models import ProgramsModel
from gncitizen.core.ref_geo.models import LAreas
from gncitizen.core.taxonomy.models import Taxref
from gncitizen.core.users.models import UserModel
from gncitizen.utils.utilssqlalchemy import serializable, geoserializable
from server import db


@serializable
@geoserializable
class ObservationModel(db.Model):
    """Table des observations"""
    __tablename__ = 't_obstax'
    __table_args__ = {'schema': 'gnc_obstax'}
    id_observation = db.Column(db.Integer, primary_key=True, unique=True)
    uuid_sinp = db.Column(UUID(as_uuid=True), nullable=False, unique=True)
    id_program = db.Column(db.Integer, db.ForeignKey(
        ProgramsModel.id_program), nullable=False)
    cd_nom = db.Column(db.Integer, db.ForeignKey(
        Taxref.cd_nom), nullable=False)
    specie = db.Column(db.String(200))
    date = db.Column(db.DATE, nullable=False)
    id_role = db.Column(db.Integer, db.ForeignKey(
        UserModel.id_user, ondelete='CASCADE'))
    role = db.relationship(UserModel, backref=db.backref(
        'gnc_obstax', cascade='all,delete'))
    obs_txt = db.Column(db.String(150))
    email = db.Column(db.String(150))
    phone = db.Column(db.String(150))
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    geom = db.Column(Geometry('POINT', 4326))
    municipality = db.Column(db.Integer, db.ForeignKey(LAreas.id_area))
    timestamp_create = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow)
    photo = db.Column(db.Text)
