from flask import Flask
app = Flask(__name__)

@app.route("/")
def home():
    """
    Adresse d'accueuil
    """
    return "GeoNature-citizen Accueuil"
