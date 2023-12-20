"""
    Give a unique entry point for gunicorn
"""

from gncitizen import __version__
from gncitizen.utils.env import load_config
from server import get_app

# get the app config file
config = load_config()

# give the app context from server.py in a app object
app = get_app(config)
port = app.config["API_PORT"] if app.config.get("API_PORT", False) else 5002


def main():
    print(
        f"""
####################################################
STARTING GeoNature-Citizen version {__version__}
####################################################
    """
    )
    app.run(host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
