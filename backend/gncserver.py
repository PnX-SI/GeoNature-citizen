import datetime
from datetime import datetime

from flask import Flask, jsonify, request
# from flask.ext.sqlalchemy import SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields, ValidationError
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///apptest.db'
db = SQLAlchemy(app)


##### MODELS #####

class SpecieModel(db.Model):
    __tablename__ = 'species'
    id = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(db.Integer)
    common_name = db.Column(db.String(150))
    sci_name = db.Column(db.String(150))


class SightModel(db.Model):
    __tablename__ = 'sights'
    id = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(db.Integer, db.ForeignKey('species.cd_ref'))
    specie = db.relationship(
        'SpecieModel',
        backref=db.backref('specie', lazy='dynamic'),
    )
    # dateobs = db.Column(db.DATETIME, nullable=False)
    count = db.Column(db.Integer)
    posted_at = db.Column(db.DATETIME, nullable=False, default=datetime.utcnow)


##### SCHEMAS #####

class SpecieSchema(Schema):
    id = fields.Int(dump_only=True)
    cd_ref = fields.Int()
    common_name = fields.Str()
    sci_name = fields.Str()

    def format_name(self, specie):
        return '{}, (<i>{}</i>)'.format(specie.common_name, specie.sci_name)


# Custom validator
def must_not_be_blank(data):
    if not data:
        raise ValidationError('Data not provided.')


class SightSchema(Schema):
    id = fields.Int(dump_only=True)
    specie = fields.Nested(SpecieSchema, validate=[must_not_be_blank])
    # dateobs = fields.DateTime(required=True, validate=[must_not_be_blank])
    count = fields.Integer(required=False)
    posted_at = fields.DateTime(dump_only=True)


specie_schema = SpecieSchema()
species_schema = SpecieSchema(many=True)
sight_schema = SightSchema()
sights_schema = SightSchema(many=True, only=('id', 'count', 'specie'))


##### API #####

@app.route('/species/')
def get_species():
    species = SpecieModel.query.all()
    # Serialize the queryset
    result = species_schema.dump(species)
    return jsonify({'species': result})


@app.route('/species/<int:pk>')
def get_specie(pk):
    try:
        specie = SpecieModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Specie could not be found.'}), 400
    specie_result = specie_schema.dump(specie)
    sights_result = sights_schema.dump(specie.sights.all())
    return jsonify({'specie': specie_result, 'quotes': sights_result})


@app.route('/sights/', methods=['GET'])
def get_sights():
    sights = SightModel.query.all()
    result = sights_schema.dump(sights)
    return jsonify({'sights': result})


@app.route('/sights/<int:pk>')
def get_sight(pk):
    try:
        sight = SightModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Sight could not be found.'}), 400
    result = sight_schema.dump(sight)
    return jsonify({'sight': result})


@app.route('/sights/', methods=['POST'])
def new_sight():
    json_data = request.get_json()
    print(json_data)
    if not json_data:
        return jsonify({'message': 'No input data provided'}), 400
    # Validate and deserialize input
    try:
        data, errors = sight_schema.load(json_data)
        print(data['specie']["cd_ref"])
    except ValidationError as err:
        return jsonify(err.messages), 422
    cd_ref, common_name, sci_name = data['specie']['cd_ref'], data['specie']['common_name'], data['specie']['sci_name']
    print('data / cd_ref:', cd_ref)
    print('data / common_name:', common_name)
    print('data / sci_name:', sci_name)
    # print('data / date:', data['dateobs'])
    specie = SpecieModel.query.filter_by(cd_ref=cd_ref, common_name=common_name).first()
    if specie is None:
        #     # Create a new author
        specie = SpecieModel(cd_ref=cd_ref, common_name=common_name)
        db.session.add(specie)
    # Create new quote
    sight = SightModel(
        # date=data['dateobs'],
        cd_ref=data['specie']['cd_ref'],
        count=data['count'],
        posted_at=datetime.datetime.utcnow(),
    )
    db.session.add(sight)
    db.session.commit()
    result = sight_schema.dump(SightModel.query.get(sight.id))
    return jsonify({
        'message': 'Created new sight.',
        'sight': result,
    })


if __name__ == '__main__':
    db.create_all()
    app.run(debug=True, port=5001)
