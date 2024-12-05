from flask import Blueprint
from utils_flask_sqla.response import json_resp

from gncitizen.utils.taxonomy import (
    get_specie_from_cd_nom,
    refresh_taxonlist,
    taxhub_full_lists,
    taxhub_rest_get_all_lists,
    taxhub_rest_get_taxon_list,
    reformat_taxa,
    get_taxa_by_cd_nom
)

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
  """Renvoie l'ensemble des espèces de la liste demandée.
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
            species:
              type: array
              items:
                type: object
                properties:
                  cd_nom:
                    type: integer
                  cd_ref:
                    type: integer
                  cd_sup:
                    type: integer
                  cd_taxsup:
                    type: integer
                  famille:
                    type: string
                  group1_inpn:
                    type: string
                  group2_inpn:
                    type: string
                  id_habitat:
                    type: integer
                  id_rang:
                    type: string
                  id_statut:
                    type: string
                  lb_auteur:
                    type: string
                  lb_nom:
                    type: string
                  nom_complet:
                    type: string
                  nom_complet_html:
                    type: string
                  nom_valide:
                    type: string
                  nom_vern:
                    type: string
                  nom_vern_eng:
                    type: string
                  ordre:
                    type: string
                  phylum:
                    type: string
                  regne:
                    type: string
                  sous_famille:
                    type: string
                  tribu:
                    type: string
                  url:
                    type: string
                  medias:
                    type: array
                    items:
                      type: object
                      properties:
                        id_media:
                          type: integer
                        url_media:
                          type: string
                        nom_type_media:
                          type: string
                  nom_francais:
                    type: string
          responses:
            200:
              description: A list of species in the requested list
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/definitions/species'
                  limit:
                    type: integer
                  page:
                    type: integer
                  total:
                    type: integer
                  total_filtered:
                    type: integer
          400:
              description: Bad request
              schema:
                type: object
                properties:
                  message:
                    type: string
      """

  try:
        res = taxhub_rest_get_taxon_list(id)
        if isinstance(res, dict) and "items" in res:
          reformatted_taxa = reformat_taxa(res)
        else:
            reformatted_taxa = []
        return reformatted_taxa
  except Exception as e:
        return {"message": str(e)}, 400


# @taxo_api.route("/taxonomy/taxon/<int:cd_nom>", methods=["GET"])
# @json_resp
# def get_taxon_from_cd_nom(cd_nom):
#     """Get taxon TaxRef data from cd_nom
#     ---
#     tags:
#      - taxon
#     parameters:
#      - name: cd_nom
#        in: path
#        type: integer
#        required: true
#        example: 1
#     definitions:
#       cd_nom:
#         type: integer
#         description: cd_nom from TaxRef
#     responses:
#       200:
#         description: Taxon data from Taxref
#     """
#     """Renvoie la fiche TaxRef de l'espèce d'après le cd_nom"""
#     try:
#         return get_specie_from_cd_nom(cd_nom=cd_nom)
#     except Exception as e:
#         return {"message": str(e)}, 400
    

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
        return get_taxa_by_cd_nom(cd_nom=cd_nom)
    except Exception as e:
        return {"message": str(e)}, 400
