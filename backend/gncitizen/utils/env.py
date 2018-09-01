import os
import sys

from pathlib import Path
from collections import ChainMap, namedtuple
from gncitizen.utils.utilstoml import load_toml

from flask_sqlalchemy import SQLAlchemy

ROOT_DIR = Path(__file__).absolute().parent.parent.parent.parent
BACKEND_DIR = ROOT_DIR / 'backend'
DEFAULT_VIRTUALENV_DIR = BACKEND_DIR / "venv"
with open(str((ROOT_DIR / 'VERSION'))) as v:
    GEONATURE_VERSION = v.read()
DEFAULT_CONFIG_FILE = ROOT_DIR / 'config/default_config.toml'

def get_config_file_path(config_file=None):
    """ Return the config file path by checking several sources

        1 - Parameter passed
        2 - GEONATURE_CONFIG_FILE env var
        3 - Default config file value
    """
    config_file = config_file or os.environ.get('GEONATCITIZEN_CONFIG_FILE')
    return Path(config_file or DEFAULT_CONFIG_FILE)


def load_config(config_file=None):
    """ Load the geonature-citizen configuration from a given file """
    config_gnc = load_toml(get_config_file_path())
    return config_gnc

SQLALCHEMY_DATABASE_URI = load_config()['SQLALCHEMY_DATABASE_URI']

print(SQLALCHEMY_DATABASE_URI)