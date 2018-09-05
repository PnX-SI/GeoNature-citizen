import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (jwt_optional)
from geoalchemy2.shape import from_shape
from gncitizen.utils.utilsjwt import get_id_role_if_exists
from server import db
from shapely.geometry import Point

from .models import SightModel, SpecieModel
from .schemas import specie_schema, sight_schema, species_schema, sights_schema

sights_url = Blueprint('sights_url', __name__)


@sights_url.route('/species/')
@jwt_optional
def get_species():
    species = SpecieModel.query.all()
    # Serialize the queryset
    result = species_schema.dump(species)
    return jsonify({'species': result})


@sights_url.route('/species/<int:pk>')
@jwt_optional
def get_specie(pk):
    try:
        specie = SpecieModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Specie could not be found.'}), 400
    specie_result = specie_schema.dump(specie)
    sights_result = sights_schema.dump(specie.sights.all())
    return jsonify({'specie': specie_result, 'quotes': sights_result})


# @sights_url.route('/sights/', methods=['GET'])
# @jwt_optional
# def get_sights():
#     sights = SightModel.query.all()
#     result = sights_schema.dump(sights)
#     return jsonify({'sights': result})


@sights_url.route('/sights/<int:pk>')
# @jwt_required
def get_sight(pk):
    try:
        sight = SightModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Sight could not be found.'}), 400
    result = sight_schema.dump(sight)
    return jsonify({'sight': result})


@sights_url.route('/sights/', methods=['POST'])
@jwt_optional
def sights():
    """Gestion des observations
    If method is POST, add a sight to database else, return all sights
        ---
        parameters:
          - name: cd_nom
            in: path
            type: string
            required: true
            default: none
          - name : observer
            type : string
            default :  none
        definitions:
          cd_nom:
            type:int
          observer:
            type: string
          name:
            type: string
          geom:
            type: geometry
        responses:
          200:
            description: Adding a sight
        """
    # try:
    #     file = request.files['file']
    #     # if user does not select file, browser also
    #     # submit an empty part without filename
    #     if file.filename == '':
    #         flash('No selected file')
    #         return redirect(request.url)
    #     if file and allowed_file(file.filename):
    #         filename = secure_filename(file.filename)
    #         file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    #         return redirect(url_for('uploaded_file',
    #                                 filename=filename))
    if request.method == 'POST':
        json_data = request.get_json()
        medias = request.files
        print(json_data)
        if not json_data:
            return jsonify({'message': 'No input data provided'}), 400
        # Validate and deserialize input
        # info: manque la date
        try:
            data, errors = sight_schema.load(json_data)
            print(data['cd_nom'])
        except ValidationError as err:
            return jsonify(err.messages), 422
        try:
            cd_nom = data['cd_nom']
            try:
                geom = from_shape(Point(data['geom'][0]), srid=4326)
            except ValidationError as err:
                return jsonify(err.messages), 422
            if data['count']:
                count = data['count']
            else:
                count = 1
        except:
            return jsonify('Données incomplètes'), 422

        id_role = get_id_role_if_exists()
        if id_role is None:
            obs_txt = data['obs_txt']
        else:
            obs_txt = None

        # Create new sight
        sight = SightModel(
            # date=data['dateobs'],
            cd_nom=cd_nom,
            count=count,
            timestamp_create=datetime.utcnow(),
            uuid_sinp=uuid.uuid4(),
            date=datetime.utcnow(),
            id_role=id_role,
            obs_txt=obs_txt,
            geom=geom
        )
        db.session.add(sight)
        db.session.commit()
        result = sight_schema.dump(SightModel.query.get(sight.id_sight))
        return jsonify({
            'message': 'Created new sight.',
            'sight': result,
        })
    else:
        sights = SightModel.query.all()
        result = sights_schema.dump(sights)
        return jsonify({'sights': result})

@sights_url.route('/sights/', methods=['GET'])
@jwt_optional
def get_sights():
    """Gestion des observations
    If method is POST, add a sight to database else, return all sights
        ---
        definitions:
          id:
            type:int
          insee:
            type: string
          name:
            type: string
          geom:
            type: geometry
        responses:
          200:
            description: A list of all sights
        """

    sights = SightModel.query.all()
    result = sights_schema.dump(sights)
    return jsonify({'sights': result})
