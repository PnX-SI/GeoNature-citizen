#!/usr/bin/python3
# -*- coding: utf-8 -*-

from enum import Enum
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import JSONB, UUID
from utils_flask_sqla_geo.serializers import geoserializable, serializable

from gncitizen.core.commons.models import (
    MediaModel,
    ProgramsModel,
    TimestampMixinModel,
)
from gncitizen.core.users.models import ObserverMixinModel, ValidatorMixinModel, UserModel
from server import db


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
    NOT_VALIDATED = "Non validé"
    INVALID = "Invalide"
    NON_VALIDATABLE = "Non validable"
    VALIDATED = "Validé"


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

    program_ref = db.relationship(
        "ProgramsModel", backref=db.backref("t_obstax", lazy="dynamic")
    )

    validation_status = db.Column(db.Enum(ValidationStatus), default=ValidationStatus.NOT_VALIDATED)
    id_validator = db.Column(
        db.Integer,
        db.ForeignKey(UserModel.id_user, ondelete="SET NULL"),
        nullable=True,
    )
    validator_ref = db.relationship(
        "UserModel",
        backref=db.backref("t_obstax", lazy="dynamic"),
        foreign_keys="ObservationModel.id_validator"
    )


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
