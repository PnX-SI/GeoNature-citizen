#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from server import db
from geoalchemy2 import Geometry


class SpecieModel(db.Model):
    """Table des Espèce"""
    __tablename__ = 'species'
    __table_args__ = {'schema': 'gn_citizen'}
    id_specie = db.Column(db.Integer, primary_key=True)
    cd_nom = db.Column(db.Integer)
    common_name = db.Column(db.String(150))
    sci_name = db.Column(db.String(150))


class SightModel(db.Model):
    """Table des observations"""
    __tablename__ = 'sights'
    __table_args__ = {'schema': 'gn_citizen'}
    id_sight = db.Column(db.Integer, primary_key=True)
    uuid_sinp = db.Column(db.String(200), nullable=False)
    cd_nom = db.Column(db.Integer, db.ForeignKey('species.cd_nom'))
    specie = db.relationship(
        'SpecieModel',
        backref=db.backref('specie', lazy='dynamic'),
    )
    date = db.Column(db.DATE, nullable=False)
    id_role = db.Column(db.Integer)
    obs_txt = db.Column(db.String(150))
    email = db.Column(db.String(150))
    phone = db.Column(db.String(150))
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    geom = db.Column(Geometry('POINT', 4326))
    posted_at = db.Column(db.DATETIME, nullable=False, default=datetime.utcnow)
