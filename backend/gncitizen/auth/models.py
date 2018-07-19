#!/usr/bin/env python3

from passlib.hash import pbkdf2_sha256 as sha256

from server import db


class RevokedTokenModel(db.Model):
    __tablename__ = 'revoked_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120))

    def add(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def is_jti_blacklisted(cls, jti):
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)


class UserModel(db.Model):
    """
        Table des utilisateurs
    """
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    surname = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(15))
    organism = db.Column(db.String(100))
    admin = db.Column(db.Boolean, default=False)

    def save_to_db(self):
        db.session.add(self)
        db.session.commit()

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
                'username': x.username,
                'password': x.password,
                'email': x.email,
                'phone': x.phone,
                'admin': x.admin
            }

            return {'users': list(map(lambda x: to_json(x), UserModel.query.all()))}

        @classmethod
        def delete_all(cls):
            try:
                num_rows_deleted = db.session.query(cls).delete()
                db.session.commit()
                return {'message': '{} row(s) deleted'.format(num_rows_deleted)}
            except:
                return {'message': 'Something went wrong'}
