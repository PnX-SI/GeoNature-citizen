from geoalchemy2.shape import from_shape
from shapely.geometry import asShape


def geom_from_geojson(data):
    try:
        geojson = asShape(data)
        geom = from_shape(geojson, srid=4326)
    except:
        raise ValidationError("Can't convert geojson geometry to wkb")
    return geom
