from flask import Blueprint, jsonify

from gncitizen.utils.utilssqlalchemy import json_resp
from .models import CorNomListe
from .schemas import cor_nom_listes_schema

routes = Blueprint('taxonomy', __name__)


@routes.route('/taxonomy/lists/', methods=['GET'])
# @json_resp
def get_lists2():
    """Gestion des listes d'espèces
    GET
        ---
        definitions:
          bib_liste:
            type:json
          bib_nom:
            type: json
        responses:
          200:
            description: A list of all species lists
        """
    cnl = CorNomListe.query.all()
    dump = cor_nom_listes_schema.dump(cnl)
    return jsonify(dump, 200)
