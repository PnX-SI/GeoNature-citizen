# import requests
from flask import Blueprint, current_app

# from gncitizen.utils.env import taxhub_lists_url
from gncitizen.utils.env import db
from gncitizen.utils.sqlalchemy import json_resp

if current_app.config.get("API_TAXHUB") is None:
    from gncitizen.core.taxonomy.models import (
        BibNoms,
        BibListes,
        CorNomListe,
        TMedias,
        Taxref,
    )
else:
    from gncitizen.utils.taxonomy import mkTaxonRepository


taxo_api = Blueprint("taxonomy", __name__)


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
    # r = requests.get(taxhub_lists_url)
    # if r.status_code == 200:
    #     result = r.json()
    #     return result
    # else:
    #     return jsonify('Erreur de chargement de l \'API', r.status_code)
    try:
        data = BibListes.query.all()
        # current_app.logger.debug([l.as_dict() for l in data])
        return [l.as_dict() for l in data]
    except Exception as e:
        return {"message": str(e)}, 400


@taxo_api.route("/taxonomy/lists/<int:id>/species", methods=["GET"])
@json_resp
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
      r = mkTaxonRepository(id)
      return r
    except Exception as e:
      return {"message": str(e)}, 400


# @taxo_api.route('/taxonomy/lists/full', methods=['GET'])
# @json_resp
# def get_fulllists():
#     """Gestion des listes d'espèces
#     GET
#         ---
#         tags:
#           - TaxHub api
#         definitions:
#           id_liste:
#             type: integer
#           nb_taxons:
#             type: integer
#           desc_liste:
#             type: string
#           picto:
#             type: string
#           group2inpn:
#             type: string
#           nom_liste:
#             type: string
#           regne:
#             type: string
#         responses:
#           200:
#             description: A list of all species lists
#         """
#     # taxhub_url = load_config()['TAXHUB_API_URL']
#     rlists = requests.get(taxhub_lists_url)
#     if rlists.status_code == 200:
#         lists = rlists.json()
#         fulllist = {}
#         fulllist['data'] = []
#         for l in lists['data']:
#             id_liste = l['id_liste']
#             taxhub_lists_taxa_url = taxhub_lists_url + 'taxons/' + str(id_liste)
#             rtaxa = requests.get(taxhub_lists_taxa_url)
#             l['species'] = rtaxa.json()['items']
#             fulllist['data'].append(l)
#         fulllist['count'] = int(len(fulllist['data']))
#         return fulllist
#     else:
#         return jsonify('Erreur de chargement de l \'API', rlists.status_code)


# @taxo_api.route('/taxonomy/lists/<int:id>/species', methods=['GET'])
# @json_resp
# def get_list_species(id):
#     """Gestion des listes d'espèces
#     GET
#         ---
#         tags:
#           - TaxHub api
#         definitions:
#           bib_liste:
#             type: json
#           bib_nom:
#             type: json
#         responses:
#           200:
#             description: A list of all species lists
#         """
#     # taxhub_url = load_config()['TAXHUB_API_URL']
#     taxhub_lists_taxa_url = taxhub_lists_url + 'taxons/' + str(id)
#     rtaxa = requests.get(taxhub_lists_taxa_url)
#     try:
#         taxa = rtaxa.json()['items']
#         return taxa
#     except:
#         return jsonify('Erreur de chargement de l \'API', rtaxa.status_code)


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
    taxon = Taxref.query.filter_by(cd_nom=cd_nom).first()
    return taxon.as_dict(True)
