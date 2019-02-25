from pathlib import Path

import toml
from gncitizen.utils.errors import GeoNatureError


def load_toml(toml_file):
    """
        Fonction qui charge un fichier toml
    """
    if Path(toml_file).is_file():
        toml_config = toml.load(str(toml_file))
        return toml_config
    else:
        raise GeoNatureError("Missing file {}".format(toml_file))
