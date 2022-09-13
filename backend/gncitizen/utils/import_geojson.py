import geojson
import json
import uuid
from server import db

from gncitizen.core.sites.models import SiteModel

def convert_coordinates_to_geom(coordinates, geometry_type):
    """ Returns a string with a valid PostGIS command for creating a WGS84 geometry from an array of coordinates """
    if geometry_type == '__POINT__':
        res = f'ST_GeomFromText(\'POINT({coordinates[0]} {coordinates[1]})\', 4326),'
    if geometry_type == '__LINESTRING__': # TODO POLYGON
        s = ''
        for c in coordinates[0]:
            s += f'{c[0]} {c[1]},'
        res = f'ST_GeomFromText(\'LINESTRING({s[:-1]})\', 4326),'
    return res

def safe_json(string):
    """ Encodes a string a json and escape single quote for postgresql"""
    return json.dumps(string.replace("'", "''"))

def safe_text(string):
    return string.replace("'", "''")

def convert_feature_to_json(feature, program_name):
    """ Returns a string with a json of properties """

    res = f'"hauteur": {feature.properties["H"]},' if feature.properties["H"] else ''
    res += f'"etatsanitaire": {feature.properties["SANIT"]},' if feature.properties["SANIT"] else ''
    res += f'"remarques": {safe_json(feature.properties["COMMENTAIR"])},' if feature.properties["COMMENTAIR"] else ''

    if program_name == 'ARHEM_ARBRES':
        res += f'"circonference": {feature.properties["CIRC"]},' if feature.properties["CIRC"] else ''
        res += f'"espece": {safe_json(feature.properties["SPFR"])},' if feature.properties["SPFR"] else ''
    elif program_name == 'ARHEM_HAIES':
        res += f'"espece_1": {safe_json(feature.properties["SPFR"])},' if feature.properties["SPFR"] else ''

    return '\'{' + res[:-1] + '}\','

def import_geosjon_as_sql(filename, sql_filename, schema_name, table_name, column_list, values_list):
    """ Import a geojson """
    with open(filename) as f:
        g = geojson.load(f)

        #TODO: store in db

        # sql_f = open(sql_filename,'w')

        # for i,f in enumerate(g['features']):
        #     sql = f'INSERT INTO "{schema_name}"."{table_name}" ('

        #     col_name = ''
        #     col_value = ''
        #     for j,c in enumerate(column_list):

        #         if values_list[j] == '__ID1000000__':
        #             col_name += f'"{c}",'
        #             col_value += f'\'{1000000 + i}\','
        #         elif values_list[j] == '__ID2000000__':
        #             col_name += f'"{c}",'
        #             col_value += f'\'{2000000 + i}\','
        #         elif values_list[j] == '__UUID__':
        #             col_name += f'"{c}",'
        #             col_value += 'uuid_generate_v4(),'
        #         elif values_list[j] == '__NOW__':
        #             col_name += f'"{c}",'
        #             col_value += 'now()::timestamptz,'
        #         elif values_list[j] == '__POINT__' or values_list[j] == '__LINESTRING__' :
        #             col_name += f'"{c}",'
        #             col_value += convert_coordinates_to_geom(f.geometry.coordinates, values_list[j])
        #         elif values_list[j] == '__JSON_ARHEM_ARBRES__':
        #             col_name += f'"{c}",'
        #             col_value += convert_feature_to_json(f, 'ARHEM_ARBRES')
        #         elif values_list[j] == '__JSON_ARHEM_HAIES__':
        #             col_name += f'"{c}",'
        #             col_value += convert_feature_to_json(f, 'ARHEM_HAIES')
        #         elif values_list[j].startswith('properties.'):
        #             col_name += f'"{c}",'
        #             prop = values_list[j].split('.')[1]
        #             col_value += f'\'{safe_text(f.properties[prop])}\','
        #         else:
        #             col_name += f'"{c}",'
        #             col_value += f'\'{values_list[j]}\','

        #     sql += f'{col_name[:-1]}) VALUES ({col_value[:-1]});\n'

        #     sql_f.write(sql)

        # sql_f.close()

def test_store_in_db(name):

    newsite = SiteModel()
    newsite.name = name
    newsite.uuid_sinp = uuid.uuid4()
    newsite.obs_txt = 'test import'
    newsite.email = 'test import'
    newsite.id_program = 1
    newsite.id_type = 1

    db.session.add(newsite)
    db.session.commit()