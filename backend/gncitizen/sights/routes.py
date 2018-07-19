from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (jwt_required)
import uuid

from server import db
from .models import SightModel, SpecieModel
from .schemas import specie_schema, sight_schema, species_schema, sights_schema

sights_url = Blueprint('sights_url', __name__)



@sights_url.route('/species/')
@jwt_required
def get_species():
    species = SpecieModel.query.all()
    # Serialize the queryset
    result = species_schema.dump(species)
    return jsonify({'species': result})



@sights_url.route('/species/<int:pk>')
@jwt_required
def get_specie(pk):
    try:
        specie = SpecieModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Specie could not be found.'}), 400
    specie_result = specie_schema.dump(specie)
    sights_result = sights_schema.dump(specie.sights.all())
    return jsonify({'specie': specie_result, 'quotes': sights_result})


@sights_url.route('/sights/', methods=['GET'])
@jwt_required
def get_sights():
    sights = SightModel.query.all()
    result = sights_schema.dump(sights)
    return jsonify({'sights': result})



@sights_url.route('/sights/<int:pk>')
@jwt_required
def get_sight(pk):
    try:
        sight = SightModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Sight could not be found.'}), 400
    result = sight_schema.dump(sight)
    return jsonify({'sight': result})


@sights_url.route('/sights/', methods=['POST'])
@jwt_required
def new_sight():
    json_data = request.get_json()
    print(json_data)
    if not json_data:
        return jsonify({'message': 'No input data provided'}), 400
    # Validate and deserialize input
    try:
        data, errors = sight_schema.load(json_data)
        print(data['specie']["cd_nom"])
    except ValidationError as err:
        return jsonify(err.messages), 422
    cd_nom, common_name, sci_name = data['specie']['cd_nom'], data['specie']['common_name'], data['specie']['sci_name']
    print('data / cd_nom:', cd_nom)
    print('data / common_name:', common_name)
    print('data / sci_name:', sci_name)
    specie = SpecieModel.query.filter_by(cd_nom=cd_nom).first()
    print('+++++++', (specie.cd_nom, specie.common_name))
    if specie is None:
        #     # Create a new author
        specie = SpecieModel(cd_nom=cd_nom, common_name=common_name, sci_name=sci_name)
        db.session.add(specie)
        db.session.commit()
    # Create new quote
    sight = SightModel(
        # date=data['dateobs'],
        cd_nom=cd_nom,
        count=data['count'],
        timestamp_create=datetime.utcnow(),
        uuid_sinp=uuid.uuid4(),
        date=datetime.utcnow()
    )
    db.session.add(sight)
    db.session.commit()
    result = sight_schema.dump(SightModel.query.get(sight.id))
    return jsonify({
        'message': 'Created new sight.',
        'sight': result,
    })
