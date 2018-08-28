from flask import Blueprint, jsonify
from flask_jwt_extended import (jwt_optional)


from .models import MunicipalityModel, NaturalAreaModel, PortalAreaModel
from .schemas import municipalities_schema, municipality_schema, naturalarea_schema, naturalareas_schema, portalarea_schema, portalareas_schema


georepos_url = Blueprint('georepos_url', __name__)


@georepos_url.route('/municipality/', methods=['GET'])
@jwt_optional
def get_municipalities():
    """list all municipalities
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
            description: A list of municipalities
        """
    municipalities = MunicipalityModel.query.all()
    # Serialize the queryset
    result = municipalities_schema.dump(municipalities)
    return jsonify({'municipalities': result})


@georepos_url.route('/species/<insee>', methods=['GET'])
@jwt_optional
def get_municipality(insee):
    """list all municipalities
        ---
        parameters:
          - name: insee
            in: path
            type: string
            required: true
            default: none
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
            description: A municipality
        """
    try:
        municipality = MunicipalityModel.query.get(insee)
    except IntegrityError:
        return jsonify({'message': 'Municipality could not be found.'}), 400
    result = municipality_schema.dump(municipality)
    return jsonify({'municipality': result})


@georepos_url.route('/portalareal/', methods=['GET'])
@jwt_optional
def get_portalareas():
    portalareas = PortalAreaModel.query.all()
    # Serialize the queryset
    result = portalareas_schema.dump(portalareas)
    return jsonify({'portal_area': result})


@georepos_url.route('/portalareal/<int:pk>', methods=['GET'])
@jwt_optional
def get_portalarea(pk):
    try:
        portalarea = PortalAreaModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Area could not be found.'}), 400
    result = portalarea_schema.dump(portalarea)
    return jsonify({'portal_area': result})

@georepos_url.route('/naturalarea/', methods=['GET'])
@jwt_optional
def get_naturalareas():
    naturalareas = NaturalAreaModel.query.all()
    # Serialize the queryset
    result = naturalareas_schema.dump(naturalareas)
    return jsonify({'natural_areas': result})


@georepos_url.route('/naturalarea/<int:pk>', methods=['GET'])
@jwt_optional
def get_naturalarea(pk):
    try:
        naturalarea = NaturalAreaModel.query.get(pk)
    except IntegrityError:
        return jsonify({'message': 'Area could not be found.'}), 400
    result = naturalarea_schema.dump(naturalarea)
    return jsonify({'natural_area': result})
