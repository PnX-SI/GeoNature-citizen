#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey

from gncitizen.core.commons.models import ModulesModel
from gncitizen.core.taxonomy.models import BibListes
from gncitizen.utils.env import db
from gncitizen.utils.utilssqlalchemy import serializable, geoserializable


@serializable
@geoserializable
class ProgramsModel(db.Model):
    """Table des Programmes de GeoNature-citizen"""
    __tablename__ = 't_programs'
    __table_args__ = {'schema': 'gnc_core'}
    id_program = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50), nullable=False)
    short_desc = db.Column(db.String(200), nullable=False)
    long_desc = db.Column(db.Text(), nullable=False)
    image = db.Column(db.String(250))
    logo = db.Column(db.String(250))
    module = db.Column(
        db.Integer,
        ForeignKey(ModulesModel.id_module), nullable=False, default=1
    )
    taxonomy_list = db.Column(
        db.Integer,
        ForeignKey(BibListes.id_liste), nullable=True
    )
    geom = db.Column(Geometry('GEOMETRY', 4326))
    timestamp_create = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def get_geofeature(self, recursif=True, columns=None):
        return self.as_geofeature('geom', 'id_program', recursif, columns=columns)
