#!/usr/bin/python3
# -*- coding: utf-8 -*-

from enum import Enum

from flask import current_app
from geoalchemy2 import Geometry
from gncitizen.core.commons.models import MediaModel, ProgramsModel, TimestampMixinModel
from gncitizen.core.users.models import ObserverMixinModel, UserModel, ValidatorMixinModel
from server import db
from sqlalchemy.dialects.postgresql import JSONB, UUID
from utils_flask_sqla_geo.generic import get_geojson_feature
from utils_flask_sqla_geo.serializers import geoserializable, serializable

from ...utils.taxonomy import taxhub_full_lists

"""Used attributes in observation features"""

OBS_KEYS = (
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

TAXREF_KEYS = ["nom_vern", "cd_nom", "cd_ref", "lb_nom"]
MEDIA_KEYS = ["id_media", "nom_type_media"]

if current_app.config.get("VERIFY_OBSERVATIONS_ENABLED", False):
    OBS_KEYS = OBS_KEYS + ("validation_status",)


class AdminFormEnum(Enum):
    @classmethod
    def choices(cls):
        return [(choice, choice.value) for choice in cls]

    @classmethod
    def coerce(cls, item):
        return cls(item) if not isinstance(item, cls) else item

    def __str__(self):
        return str(self.value)


class ValidationStatus(AdminFormEnum):
    NOT_VALIDATED: str = "Non validé"
    INVALID: str = "Invalide"
    NON_VALIDATABLE: str = "Non validable"
    VALIDATED: str = "Validé"


INVALIDATION_STATUSES = [
    {
        "value": "",
        "text": "---",
        "link": "NOT_VALIDATED",
        "mail": "",
        "twice": "",
    },
    {
        "value": "unverifiable",
        "text": "L'identification est difficile, besoin d'un autre avis",
        "link": "INVALID",
        "mail": "L'identification de l'espèce que vous avez observée est difficile d'après cette ou ces photos, nous continuons nos recherches...",
        "twice": "Désolé, l'identification de l'individu que vous avez observée est trop difficile. Pouvez-vous essayer de le photographier, à nouveau, lui et/ou ses congénères ?",
    },
    {
        "value": "off-topic",
        "text": "L'espèce observée n'est pas dans la liste des espèces de l'enquête",
        "link": "NON_VALIDATABLE",
        "mail": "L'espèce que vous avez observée n'est pas dans la liste des espèces de l'enquête.",
        "twice": "",
    },
    {
        "value": "multiple",
        "text": "Les photos correspondent à des espèces différentes, l'observateur doit créer une nouvelle observation",
        "link": "NON_VALIDATABLE",
        "mail": "Les photos que vous nous avez envoyées correspondent à des espèces différentes. Pourriez-vous les poster séparément ?",
        "twice": "",
    },
]


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
        index=True,
    )
    cd_nom = db.Column(db.Integer, nullable=False)
    # String(1000) taken from taxonomie.bib_noms:
    name = db.Column(db.String(1000), nullable=False)
    date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer)
    comment = db.Column(db.String(300))
    municipality = db.Column(db.String(100), nullable=True)
    geom = db.Column(
        Geometry(
            geometry_type="POINT",
            srid=4326,
            spatial_index=True,
        )
    )
    json_data = db.Column(JSONB, nullable=True)
    validation_status = db.Column(
        db.Enum(ValidationStatus), default=ValidationStatus.NOT_VALIDATED
    )
    id_validator = db.Column(
        db.Integer,
        db.ForeignKey(UserModel.id_user, ondelete="SET NULL"),
        nullable=True,
    )

    program_ref = db.relationship("ProgramsModel", backref="t_obstax", lazy="joined")
    medias = db.relationship("ObservationMediaModel", backref="t_obstax", lazy="joined")
    observer = db.relationship(
        "UserModel",
        backref="observer_obs",
        lazy="joined",
        foreign_keys="ObservationModel.id_role",
    )
    validator_ref = db.relationship(
        "UserModel",
        backref=db.backref("validator_obs", lazy="dynamic"),
        foreign_keys="ObservationModel.id_validator",
    )

    # def taxref(self):
    #     """Taxref taxon info"""
    #     taxon_repository = taxhub_full_lists[self.program_ref.taxonomy_list]
    #     taxref = next(
    #         taxon for taxon in taxon_repository if taxon and taxon["cd_nom"] == self.cd_nom
    #     )
    #     return taxref

    def get_feature(self):
        """get obs data as geojson feature"""

        result_dict = self.as_dict(True)
        result_dict["observer"] = self.observer.as_simple_dict() if self.observer else None
        result_dict["validator"] = (
            self.validator_ref.as_simple_dict() if self.validator_ref else None
        )

        result_dict["validation"] = str(self.validation_status)

        # Populate "geometry"
        feature = get_geojson_feature(self.geom)

        # Populate "properties"
        for k in result_dict:
            if k in OBS_KEYS:
                feature["properties"][k] = (
                    result_dict[k].name if isinstance(result_dict[k], Enum) else result_dict[k]
                )
        feature["properties"]["photos"] = [
            {
                "url": f"/media/{p.media.filename}",
                "date": result_dict["date"],
                "author": self.obs_txt,
            }
            for p in self.medias
        ]

        taxon_repository = taxhub_full_lists[self.program_ref.taxonomy_list]
        try:
            taxon = next(
                taxon
                for taxon in taxon_repository
                if taxon and taxon["cd_nom"] == feature["properties"]["cd_nom"]
            )
            feature["properties"]["taxref"] = {key: taxon["taxref"][key] for key in TAXREF_KEYS}
            feature["properties"]["medias"] = [
                {key: media[key] for key in MEDIA_KEYS} for media in taxon["medias"]
            ]
        except StopIteration:
            pass

        return feature


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
        index=True,
    )
    id_media = db.Column(
        db.Integer,
        db.ForeignKey(MediaModel.id_media, ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    media = db.relationship("MediaModel", backref="obs_media_match", lazy="joined")
