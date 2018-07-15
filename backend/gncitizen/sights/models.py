#!/usr/bin/env python3

import logging as log

from sqlalchemy.ext.declarative import declarative_base

from server import db, ma

Base = declarative_base()


class SpeciesModel(db.Model):
    """
    Table de référence des espèces

    """
    __tablename__ = 'species'
    cd_ref = db.Column(db.Integer, primary_key=True)
    common_name = db.Column(db.String(250), unique=True, nullable=True)
    sci_name = db.Column(db.String(250), unique=True, nullable=False)
    sights = db.relationship('SightModel', backref='species', lazy=True)

    def save_to_db(self):
        db.session.add(self)
        log.info('add')
        db.session.commit()
        log.info('commit')

    @classmethod
    def find_by_cd_ref(cls, cd_ref):
        return cls.query.filter_by(cd_ref=cd_ref).first()

    @classmethod
    def return_all(cls):
        def to_json(x):
            return {
                'cd_ref': x.cd_ref,
                'common_name': x.common_name,
                'sci_name': x.sci_name
            }

        return {'species': list(map(lambda x: to_json(x), SpeciesModel.query.all()))}

    @classmethod
    def delete_all(cls):
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {'message': '{} row(s) deleted'.format(num_rows_deleted)}
        except:
            return {'message': 'Something went wrong'}


class SightModel(db.Model):
    """
        Table des observations
    """
    __tablename__ = 'sights'

    id = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(db.Integer, db.ForeignKey("species.cd_ref"), nullable=False)
    date = db.Column(db.Date)
    # time = db.Column(db.Time)
    count = db.Column(db.Integer, default=1)

    # timestamp_create = db.Column(db.DateTime, default=datetime.now())
    # observer_create = db.Column(db.ForeignKey, )

    def save_to_db(self):
        db.session.add(self)
        log.info('add')
        db.session.commit()
        log.info('commit')

    @classmethod
    def find_by_cd_ref(cls, cd_ref):
        return cls.query.filter_by(cd_ref=cd_ref).first()

    @classmethod
    def return_all(cls):
        def to_json(x):
            return {
                'cd_ref': x.cd_ref,
                'date': x.date,
                'time': x.time,
                'count': x.count
            }

        return {'sights': list(map(lambda x: to_json(x), SightModel.query.all()))}

    @classmethod
    def delete_all(cls):
        try:
            num_rows_deleted = db.session.query(cls).delete()
            db.session.commit()
            return {'message': '{} row(s) deleted'.format(num_rows_deleted)}
        except:
            return {'message': 'Something went wrong'}


class SpeciesSchema(ma.ModelSchema):
    class Meta:
        model = SpeciesModel

    def format_name(self, species):
        return '<b>{}</b> (<i>{})</i>)'.format(species.common_name, species.sci_name)


class SightsSchema(ma.ModelSchema):
    class Meta:
        model = SightModel
