from gncitizen.utils.env import db
from geonature.utils.utilssqlalchemy import serializable


@serializable
class Modules(db.Model):
    """Table des modules de GeoNature-citizen"""
    __tablename__ = 'modules'
    __table_args__ = {'schema':'gncitizen'}
    id_app = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(50), nullable=False)
    desc = db.Column(db.String(200))
    picto = db.Column(db.String(250))