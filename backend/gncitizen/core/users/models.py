#!/usr/bin/env python3

from flask import current_app
from gncitizen.core.commons.models import ProgramsModel, TimestampMixinModel, TModules
from passlib.hash import pbkdf2_sha256 as sha256
from server import db
from sqlalchemy import event
from sqlalchemy.ext.declarative import declared_attr
from utils_flask_sqla_geo.serializers import serializable

logger = current_app.logger


class RevokedTokenModel(db.Model):
    __tablename__ = "t_revoked_tokens"
    __table_args__ = {"schema": "gnc_core"}

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def add(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti):
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)


@serializable
class UserModel(TimestampMixinModel, db.Model):
    """
    Table des utilisateurs
    Note: Le mot de passe est haché à chaque mise à jour de la valeur par l'évènement hash_user_password déclaré ci-après
    """

    __tablename__ = "t_users"
    __table_args__ = {"schema": "gnc_core"}

    id_user = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    organism = db.Column(db.String(100))
    avatar = db.Column(db.String())
    active = db.Column(db.Boolean, default=False)
    admin = db.Column(db.Boolean, default=False)
    validator = db.Column(db.Boolean, default=False)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

    def update(self):
        db.session.commit()

    def as_secured_dict(self, recursif=False, columns=()):
        surname = self.username or ""
        name = self.name or ""
        return {
            "id_role": self.id_user,
            "name": self.name,
            "surname": self.surname,
            "username": self.username,
            "email": self.email,
            "phone": self.phone,
            "organism": self.organism,
            "avatar": self.avatar,
            "full_name": name + " " + surname,
            "admin": self.admin,
            "active": self.active,
            "validator": self.validator,
            "timestamp_create": self.timestamp_create.isoformat(),
            "timestamp_update": (
                self.timestamp_update.isoformat() if self.timestamp_update else None
            ),
        }

    def as_simple_dict(self):
        return {
            "id_role": self.id_user,
            "username": self.username,
            "avatar": self.avatar,
        }

    @staticmethod
    def generate_hash(password):
        return sha256.hash(password)

    @staticmethod
    def verify_hash(password, hash):
        return sha256.verify(password, hash)

    @classmethod
    def find_by_username(cls, username):
        return cls.query.filter_by(username=username).first()

    @classmethod
    def return_all(cls):
        def to_json(x):
            return {
                "username": x.username,
                "password": x.password,
                "email": x.email,
                "phone": x.phone,
                "admin": x.admin,
            }

        return {"users": list(map(lambda x: to_json(x), UserModel.query.all()))}

    def __repr__(self):
        return f"{self.username} <{self.id_user}>"


@event.listens_for(UserModel.password, "set", retval=True)
def hash_user_password(_target, value, oldvalue, _initiator):
    """Evenement qui hash le mot de passe systèmatiquement"""
    if value != "" and not sha256.identify(value):
        return UserModel.generate_hash(value)
    return oldvalue


class GroupsModel(db.Model):
    """Table des groupes d'utilisateurs"""

    __tablename__ = "bib_groups"
    __table_args__ = {"schema": "gnc_core"}

    id_group = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(150), nullable=True)
    group = db.Column(db.String(150), nullable=False)


@serializable
class UserRightsModel(TimestampMixinModel, db.Model):
    """Table de gestion des droits des utilisateurs de GeoNature-citizen"""

    __tablename__ = "t_users_rights"
    __table_args__ = {"schema": "gnc_core"}

    id_user_right = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey(UserModel.id_user), nullable=False)
    id_module = db.Column(db.Integer, db.ForeignKey(TModules.id_module), nullable=True)
    id_program = db.Column(
        db.Integer,
        db.ForeignKey(ProgramsModel.id_program, ondelete="CASCADE"),
        nullable=True,
    )
    right = db.Column(db.String(150), nullable=False)
    create = db.Column(db.Boolean(), default=False)
    read = db.Column(db.Boolean(), default=False)
    update = db.Column(db.Boolean(), default=False)
    delete = db.Column(db.Boolean(), default=False)


class UserGroupsModel(TimestampMixinModel, db.Model):
    """Table de classement des utilisateurs dans des groupes"""

    __tablename__ = "cor_users_groups"
    __table_args__ = {"schema": "gnc_core"}

    id_user_right = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey(UserModel.id_user), nullable=False)
    id_group = db.Column(
        db.Integer,
        db.ForeignKey(GroupsModel.id_group, ondelete="CASCADE"),
        nullable=False,
    )


class ObserverMixinModel(object):
    """Observer mixin model"""

    @declared_attr
    def id_role(self):
        """id observer fk"""
        return db.Column(
            db.Integer,
            db.ForeignKey(UserModel.id_user, ondelete="CASCADE"),
            nullable=True,
        )

    @declared_attr
    def obs_txt(self):
        """observer name"""
        return db.Column(db.String(150))

    @declared_attr
    def email(self):
        """observer email"""
        return db.Column(db.String(150))
