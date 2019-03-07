"""
    Give a unique entry point for gunicorn
"""

from gncitizen.utils.env import load_config
from server import get_app

# get the app config file
config = load_config()

# give the app context from server.py in a app object
app = get_app(config)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
