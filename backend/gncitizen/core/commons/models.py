#!/usr/bin/python3
# -*- coding: UTF-8 -*-

from gncitizen.utils.env import db
from gncitizen.utils.utilssqlalchemy import serializable


@serializable
class ModulesModel(db.Model):
    """Table des modules de GeoNature-citizen"""
    __tablename__ = 't_modules'
    __table_args__ = {'schema': 'gnc_core'}
    id_module = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(50), nullable=False)
    desc = db.Column(db.String(200))
    icon = db.Column(db.String(250))
