#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import current_app
from geoalchemy2 import Geometry
from gncitizen.core.commons.models import MediaModel, ProgramsModel, TimestampMixinModel
from gncitizen.core.users.models import ObserverMixinModel
from server import db
from sqlalchemy.dialects.postgresql import JSONB, UUID
from utils_flask_sqla_geo.generic import get_geojson_feature
from utils_flask_sqla_geo.serializers import geoserializable, serializable

from ...utils.taxonomy import taxhub_full_lists

"""Used attributes in observation features"""
obs_keys = (
    "cd_nom",
    "id_observation",
    "observer",
    "id_program",
    "municipality",
    "obs_txt",
    "count",
    "date",
    "comment",
    "timestamp_create",
    "json_data",
)


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
    # String(1000) taken from taxonomie.bib_noms:
    name = db.Column(db.String(1000), nullable=False)
    date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    # FIXME: remove nullable prop from ObservationModel.municipality once debugged
    municipality = db.Column(db.String(100), nullable=True)
    geom = db.Column(Geometry("POINT", 4326))
    json_data = db.Column(JSONB, nullable=True)

    program_ref = db.relationship("ProgramsModel", backref=db.backref("t_obstax", lazy="dynamic"))
    medias = db.relationship("ObservationMediaModel", backref="t_obstax")

    # def get_feature(self):
    #     feature = get_geojson_feature(self.geom)
    #     name = self.municipality
    #     feature["properties"]["municipality"] = {"name": name}
    #     # Observer
    #     feature["properties"]["observer"] = {"username": self.obs_txt}
    #     # Observer submitted media
    #     feature["properties"]["image"] = [
    #         "/".join(
    #             [
    #                 "/api",
    #                 current_app.config["MEDIA_FOLDER"],
    #                 m.media.filename,
    #             ]
    #         )
    #         for m in self.medias
    #     ]

    #     for k, v in self.as_dict(True).items():
    #         if k in obs_keys and k != "municipality":
    #             feature["properties"][k] = v
    #     taxref = self.taxref()
    #     feature["properties"]["taxref"] = taxref
    #     feature["properties"]["medias"] = taxref["medias"]
    #     return feature

    # def taxref(self):
    #     """Taxref taxon info"""
    #     taxon_repository = taxhub_full_lists[self.program_ref.taxonomy_list]
    #     taxref = next(
    #         taxon for taxon in taxon_repository if taxon and taxon["cd_nom"] == self.cd_nom
    #     )
    #     return taxref


@serializable
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
    media = db.relationship("MediaModel", backref="obs_media_match")
