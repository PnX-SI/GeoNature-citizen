#!/usr/bin/env python3

from passlib.hash import pbkdf2_sha256 as sha256

from gncitizen.core.commons.models import (
    ModulesModel,
    ProgramsModel,
    TimestampMixinModel,
)
from gncitizen.utils.sqlalchemy import serializable
from server import db
from sqlalchemy.ext.declarative import declared_attr


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
    admin = db.Column(db.Boolean, default=False)

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
            "full_name": name + " " + surname,
            "admin": self.admin,
            "timestamp_create": self.timestamp_create.isoformat(),
            "timestamp_update": self.timestamp_update.isoformat()
            if self.timestamp_update
            else None,
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

    # @classmethod
    # def delete_all(cls):
    #     try:
    #         num_rows_deleted = db.session.query(cls).delete()
    #         db.session.commit()
    #         return {'message': '{} row(s) deleted'.format(num_rows_deleted)}
    #     except:
    #         return {'message': 'Something went wrong'}


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
    id_module = db.Column(
        db.Integer, db.ForeignKey(ModulesModel.id_module), nullable=True
    )
    id_module = db.Column(
        db.Integer, db.ForeignKey(ProgramsModel.id_program), nullable=True
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
        db.Integer, db.ForeignKey(GroupsModel.id_group), nullable=False
    )


class ObserverMixinModel(object):
    @declared_attr
    def id_role(cls):
        return db.Column(
            db.Integer,
            db.ForeignKey(UserModel.id_user, ondelete="SET NULL"),
            nullable=True,
        )

    @declared_attr
    def obs_txt(cls):
        return db.Column(db.String(150))

    @declared_attr
    def email(cls):
        return db.Column(db.String(150))
