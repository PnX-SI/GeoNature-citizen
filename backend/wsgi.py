"""
    Give a unique entry point for gunicorn
"""

from gncitizen.utils.env import load_config
from server import get_app

# get the app config file
config = load_config()

# give the app context from server.py in a app object
app = get_app(config)
port = app.config["API_PORT"] if app.config.get("API_PORT", False) else 5002

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port)
