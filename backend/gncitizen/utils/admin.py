from flask_admin.form.fields import JSONField
from flask_admin.contrib.geoa import ModelView
import json

def json_formatter(view, context, model, name):
    """Prettify JSON data in flask admin lists
    """
    value = getattr(model, name)
    json_value = json.dumps(value, ensure_ascii=False, indent=2)
    return Markup("<pre>{}</pre>".format(json_value))


class CustomJSONField(JSONField):
    """Prettify JSON fields in flask admin editor
    """
    def _value(self):
        if self.raw_data:
            return self.raw_data[0]
        elif self.data:
            return json.dumps(self.data, ensure_ascii=False, indent=2)
        else:
            return ''

class CustomTileView(ModelView):
    tile_layer_url = 'a.tile.openstreetmap.org/{z}/{x}/{y}.png'
    tile_layer_attribution = 'some string or html goes here'
