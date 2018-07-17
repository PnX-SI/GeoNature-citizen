from server import app, db
from flask import jsonify, Blueprint

core_url = Blueprint('core',__name__)

@core_url.route('/')
def index():
     return jsonify({'message': 'Hello, World!'})
