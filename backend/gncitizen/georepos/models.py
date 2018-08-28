from geoalchemy2.types import Geometry

from server import db


class PortalAreaModel(db.Model):
    """Table des Zones naturelles"""
    __tablename__ = 'portalarea'
    __table_args__ = {'schema': 'geo_repos'}
    id = db.Column(db.Integer, primary_key=True, unique=True)
    name = db.Column(db.Integer)
    geom = db.Column(Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), unique=True)


class MunicipalityModel(db.Model):
    """Table des Communes"""
    __tablename__ = 'municipality'
    __table_args__ = {'schema': 'geo_repos'}
    id = db.Column(db.Integer, primary_key=True, unique=True)
    insee = db.Column(db.String(5), unique=True)
    nom = db.Column(db.Integer, unique=True)
    dept = db.Column(db.String(3))
    id_area = db.Column(db.Integer, db.ForeignKey('geo_repos.portalarea.id'))
    area = db.relationship(
        'PortalAreaModel',
        backref=db.backref('area', lazy='dynamic'))
    geom = db.Column(Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), unique=True)


class TypeNaturalAreaModel(db.Model):
    """Table des types de Zones naturelles"""
    __tablename__ = 'naturalarea_type'
    __table_args__ = {'schema': 'geo_repos'}
    id = db.Column(db.Integer, primary_key=True, unique=True)
    type1 = db.Column(db.String(100), nullable=False)
    type2 = db.Column(db.String(100), unique=True, nullable=False)


class NaturalAreaModel(db.Model):
    """Table des Zones naturelles"""
    __tablename__ = 'naturalarea'
    __table_args__ = {'schema': 'geo_repos'}
    id = db.Column(db.Integer, primary_key=True, unique=True)
    id_type = db.Column(db.Integer, db.ForeignKey('geo_repos.naturalarea_type.id'))
    type = db.relationship(
        'TypeNaturalAreaModel',
        backref=db.backref('type', lazy='dynamic'))
    geom = db.Column(Geometry(geometry_type='POLYGON', srid=4326, spatial_index=True), unique=True)


class AltitudeModel(db.Model):
    """MNT"""
    __tablename__ = 'altitude'
    __table_args__ = {'schema': 'geo_repos'}
    rid = db.Column(db.Integer, primary_key=True, unique=True)
    # raster = db.Column(Raster(), unique=True)
    filename = db.Column(db.Text)
