from server import app
from gncitizen.utils.env import load_config

port = load_config()['API_PORT']

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5101)