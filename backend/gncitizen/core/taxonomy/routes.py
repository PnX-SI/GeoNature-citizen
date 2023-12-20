from flask import Blueprint
from gncitizen.utils.taxonomy import (
    get_specie_from_cd_nom,
    refresh_taxonlist,
    taxhub_full_lists,
    taxhub_rest_get_all_lists,
)
from utils_flask_sqla.response import json_resp

taxo_api = Blueprint("taxonomy", __name__)


@taxo_api.route("/taxonomy/refresh", methods=["GET"])
@json_resp
def refresh():
    lists = refresh_taxonlist()
    return lists


@taxo_api.route("/taxonomy/lists", methods=["GET"])
@json_resp
def get_lists():
    """Renvoie toutes liste d'espèces
    GET
        ---
        tags:
          - TaxHub api
        definitions:
          id_liste:
            type: integer
          nb_taxons:
            type: integer
          desc_liste:
            type: string
          picto:
            type: string
          group2inpn:
            type: string
          nom_liste:
            type: string
          regne:
            type: string
        responses:
          200:
            description: A list of all species lists
    """
    try:
        return taxhub_rest_get_all_lists()
    except Exception as e:
        return {"message": str(e)}, 400


@taxo_api.route("/taxonomy/lists/<int:id>/species", methods=["GET"])
@json_resp
# @lru_cache()
def get_list(id):
    """Renvoie une liste d'espèces spécifiée par son id
    GET
        ---
        tags:
          - TaxHub api
        definitions:
          id_liste:
            type: integer
          nb_taxons:
            type: integer
          desc_liste:
            type: string
          picto:
            type: string
          group2inpn:
            type: string
          nom_liste:
            type: string
          regne:
            type: string
        responses:
          200:
            description: A list of all species lists
    """

    try:
        r = taxhub_full_lists[id]
        return r
    except Exception as e:
        return {"message": str(e)}, 400


@taxo_api.route("/taxonomy/taxon/<int:cd_nom>", methods=["GET"])
@json_resp
def get_taxon_from_cd_nom(cd_nom):
    """Get taxon TaxRef data from cd_nom
    ---
    tags:
     - taxon
    parameters:
     - name: cd_nom
       in: path
       type: integer
       required: true
       example: 1
    definitions:
      cd_nom:
        type: integer
        description: cd_nom from TaxRef
    responses:
      200:
        description: Taxon data from Taxref
    """
    """Renvoie la fiche TaxRef de l'espèce d'après le cd_nom"""
    try:
        return get_specie_from_cd_nom(cd_nom=cd_nom)
    except Exception as e:
        return {"message": str(e)}, 400
