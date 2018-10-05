from flask import Blueprint
from geoalchemy2 import func
from geoalchemy2.shape import to_shape
from geojson import FeatureCollection, Feature

from gncitizen.utils.env import db
from gncitizen.utils.env import load_config
from gncitizen.utils.utilssqlalchemy import get_geojson_feature, json_resp
from .models import LAreas

routes = Blueprint('georepos', __name__)


@routes.route('/municipality/', methods=['GET'])
@json_resp
def get_municipalities():
    """List all enabled municipalities
        ---
        tags:
          - Reférentiel géo
        definitions:
          area_name:
            type: string
            description: Municipality name
          area_code:
            type: string
            description: Municipality insee code
          geometry:
            type: geometry
        responses:
          200:
            description: A list of municipalities
        """
    try:
        q = db.session.query(
            LAreas.area_name,
            LAreas.area_code,
            func.ST_Transform(LAreas.geom, 4326).label('geom')
        ).filter(LAreas.enable, LAreas.id_type == 101)
        datas = q.all()
        features = []
        for data in datas:
            feature = get_geojson_feature(data.geom)
            feature['properties']['area_name'] = data.area_name
            feature['properties']['area_code'] = data.area_code
            features.append(feature)
        return FeatureCollection(features)
    except Exception as e:
        return {'error_message':str(e)}, 400


@routes.route('/municipality/<insee>', methods=['GET'])
@json_resp
def get_municipality(insee):
    """Get one enabled municipality by insee code
        ---
        tags:
          - Reférentiel géo
        parameters:
          - name: insee
            in: path
            type: string
            required: true
            default: none
        definitions:
          area_name:
            type: string
            description: Municipality name
          area_code:
            type: string
            description: Municipality insee code
          geometry:
            type: geometry
        responses:
          200:
            description: A municipality
        """
    print('INSEE: ', insee)
    try:
        q = db.session.query(
            LAreas.area_name,
            LAreas.area_code,
            func.ST_Transform(LAreas.geom, 4326).label('geom')
        ).filter(
            LAreas.enable,
            LAreas.area_code == str(insee),
            LAreas.id_type == 101
        ).limit(1)
        datas = q.all()
        print(datas[0])
        data = datas[0]
        print(to_shape(data.geom))
        feature = Feature(geometry=to_shape(data.geom))
        feature['properties']['area_name'] = data.area_name
        feature['properties']['area_code'] = data.area_code
        return feature
    except Exception as e:
        return {'error_message':str(e)}, 400


@routes.route('/portalarea/', methods=['GET'])
@json_resp
def get_portalarea():
    """Generate a unique area from all enable municipalities to represent portal area
        ---
        tags:
          - Reférentiel géo
        definitions:
          name:
            type: string
            description: Nom du zonage (configured in app config file as PORTAL_AREA_NAME)
          geometry:
            type: geometry
        responses:
          200:
            description: A municipality

    """
    try:
        q = db.session.query(func.ST_Transform(func.ST_Union(
            LAreas.geom), 4326).label('geom')
                             ).filter(LAreas.enable).subquery()
        data = db.engine.execute(q)
        print(type(data))
        for d in data:
            print(to_shape(d.geom))
            feature = Feature(geometry=to_shape(d.geom))
            if load_config()['PORTAL_AREA_NAME']:
                feature['properties']['nom'] = load_config()['PORTAL_AREA_NAME']
            else:
                feature['properties']['name'] = 'Portal area'
        return feature
    except Exception as e:
        return {'error_message':str(e)}, 400