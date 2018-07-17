#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from server import db


class SpecieModel(db.Model):
    """Table des Espèce"""
    __tablename__ = 'species'
    id = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(db.Integer)
    common_name = db.Column(db.String(150))
    sci_name = db.Column(db.String(150))


class SightModel(db.Model):
    """Table des observations"""
    __tablename__ = 'sights'
    id = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(db.Integer, db.ForeignKey('species.cd_ref'))
    specie = db.relationship(
        'SpecieModel',
        backref=db.backref('specie', lazy='dynamic'),
    )
    # dateobs = db.Column(db.DATETIME, nullable=False)
    count = db.Column(db.Integer)
    posted_at = db.Column(db.DATETIME, nullable=False, default=datetime.utcnow)
