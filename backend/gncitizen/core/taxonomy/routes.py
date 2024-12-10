from flask import Blueprint,  request
from typing import List, Dict, Any, Union
from utils_flask_sqla.response import json_resp

from gncitizen.utils.taxonomy import (
    taxhub_rest_get_all_lists,
    taxhub_rest_get_taxon_list,
    reformat_taxa,
    get_taxa_by_cd_nom,
    get_all_medias_types,
    get_all_attributes
)

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
    try:
        return taxhub_rest_get_all_lists()
    except Exception as e:
        return {"message": str(e)}, 400


@taxo_api.route("/taxonomy/lists/<int:id>/species", methods=["GET"])
@json_resp
# @lru_cache()
def get_list(id)-> Union[List[Dict[str, Any]], Dict[str, str]]:
    """Renvoie l'ensemble des espèces de la liste demandée.

    GET /taxonomy/lists/<id>/species
    ---
    tags:
      - taxon
    summary: Récupère les espèces associées à une liste spécifique.
    parameters:
      - name: id
        in: path
        required: true
        description: L'identifiant de la liste pour laquelle les espèces doivent être récupérées.
        schema:
          type: integer
    responses:
      200:
        description: Une liste des espèces associées à la liste demandée.
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  cd_nom:
                    type: integer
                    description: Identifiant unique de l'espèce.
                  cd_ref:
                    type: integer
                    description: Référence principale de l'espèce.
                  cd_sup:
                    type: integer
                    nullable: true
                    description: Identifiant de l'espèce supérieure, si applicable.
                  cd_taxsup:
                    type: integer
                    nullable: true
                    description: Identifiant taxonomique de l'espèce supérieure.
                  famille:
                    type: string
                    description: Famille taxonomique de l'espèce.
                  group1_inpn:
                    type: string
                    description: Premier niveau de regroupement INPN.
                  group2_inpn:
                    type: string
                    description: Second niveau de regroupement INPN.
                  id_habitat:
                    type: integer
                    description: Identifiant de l'habitat associé.
                  id_rang:
                    type: string
                    description: Rang taxonomique (par exemple, "ES" pour espèce).
                  id_statut:
                    type: string
                    description: Statut légal ou de conservation de l'espèce.
                  lb_auteur:
                    type: string
                    description: Auteur de la nomenclature scientifique.
                  lb_nom:
                    type: string
                    description: Nom scientifique valide.
                  nom_complet:
                    type: string
                    description: Nom complet de l'espèce (incluant auteur et année).
                  nom_complet_html:
                    type: string
                    description: Nom complet formaté pour HTML.
                  nom_valide:
                    type: string
                    description: Nom actuellement valide de l'espèce.
                  nom_vern:
                    type: string
                    nullable: true
                    description: Nom vernaculaire français.
                  nom_vern_eng:
                    type: string
                    nullable: true
                    description: Nom vernaculaire anglais.
                  ordre:
                    type: string
                    description: Ordre taxonomique.
                  phylum:
                    type: string
                    description: Phylum biologique.
                  regne:
                    type: string
                    description: Règne biologique.
                  sous_famille:
                    type: string
                    nullable: true
                    description: Sous-famille taxonomique.
                  tribu:
                    type: string
                    nullable: true
                    description: Tribu taxonomique.
                  url:
                    type: string
                    description: URL pointant vers la fiche détaillée sur l'INPN.
                  attributs:
                    type: array
                    description: Liste des attributs associés à l'espèce (peut être vide).
                    items:
                      type: object
                      properties:
                        id_attribut:
                          type: integer
                          description: Identifiant de l'attribut.
                        cd_ref:
                          type: integer
                          description: Référence principale de l'espèce associée à cet attribut.
                        valeur_attribut:
                          type: string
                          description: Valeur de l'attribut.
                  medias:
                    type: array
                    description: Liste des médias associés à l'espèce (peut être vide).
                    items:
                      type: object
                      properties:
                        id_media:
                          type: integer
                          description: Identifiant du média.
                        media_url:
                          type: string
                          description: URL du média.
                        titre:
                          type: string
                          description: Titre du média.
                        auteur:
                          type: string
                          nullable: true
                          description: Auteur du média, peut être `null`.
                        cd_ref:
                          type: integer
                          description: Référence principale associée au média.
                        chemin:
                          type: string
                          description: Chemin du fichier du média sur le serveur.
                        desc_media:
                          type: string
                          description: Description du média.
                        id_type:
                          type: integer
                          description: Identifiant du type du média.
                        is_public:
                          type: boolean
                          description: Indicateur de visibilité publique du média.
                        licence:
                          type: string
                          nullable: true
                          description: Licence associée au média.
                        source:
                          type: string
                          nullable: true
                          description: Source du média.
                        url:
                          type: string
                          nullable: true
                          description: URL associée au média.
      400:
        description: Requête invalide.
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  description: Description de l'erreur.
    examples:
      200:
        summary: Exemple de réponse avec une liste d'espèces.
        value:
          - cd_nom: 79274
            famille: "Lacertidae"
            group1_inpn: "Chordés"
            group2_inpn: "Reptiles"
            ...
            attributs:
              - id_attribut: 105
                cd_ref: 79274
                valeur_attribut: "Mon Lézard"
            medias:
              - id_media: 1
                media_url: "http://example.com/media1.jpg"
                titre: "média taxhub"
                ...
      400:
        summary: Exemple d'erreur.
        value:
          message: "Invalid list ID"
    raises:
      Exception: En cas d'erreur inattendue pendant le traitement.
  """

    try:
        params = request.args.to_dict()
        res = taxhub_rest_get_taxon_list(id, params)
        if isinstance(res, dict) and "items" in res:
          reformatted_taxa = reformat_taxa(res)
        else:
            reformatted_taxa = []
        print(reformatted_taxa)
        return reformatted_taxa
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
        return get_taxa_by_cd_nom(cd_nom=cd_nom)
    except Exception as e:
        return {"message": str(e)}, 400
    

@taxo_api.route("/taxonomy/tmedias/types", methods=["GET"])
@json_resp
def get_media_types()-> List[Dict[str, Union[int, str]]]:
  """Get all media types.
    ---
    tags:
     - Taxon
    responses:
      200:
        description: A list of all media types.
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  id_type:
                    type: integer
                    description: Unique identifier for the media type.
                  nom_type_media:
                    type: string
                    description: Name of the media type.
                  desc_type_media:
                    type: string
                    description: Description of the media type.
      400:
        description: Bad request.
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  description: Error message.
  """
  try:
      return get_all_medias_types()
  except Exception as e:
      return {"message": str(e)}, 400 

@taxo_api.route("/taxonomy/bibattributs", methods=["GET"])
@json_resp
def get_attributes()-> List[Dict[str, Union[int, str]]]:
    """
    Get all attributes.
    ---
    tags:
     - Taxon
    responses:
      200:
        description: A list of all attributes.
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  id_attribut:
                    type: integer
                    description: Unique identifier for the attribute.
                  nom_attribut:
                    type: string
                    description: Name of the attribute.
                  label_attribut:
                    type: string
                    description: Label for the attribute.
                  desc_attribut:
                    type: string
                    description: Description of the attribute.
                  type_attribut:
                    type: string
                    description: Type of the attribute (e.g., "text").
                  type_widget:
                    type: string
                    description: Widget type associated with the attribute (e.g., "textarea", "select").
                  liste_valeur_attribut:
                    type: string
                    description: List of possible values for the attribute (in JSON format).
                  regne:
                    type: string
                    description: Biological kingdom associated with the attribute (if applicable).
                  group2_inpn:
                    type: string
                    description: Second-level INPN grouping (if applicable).
                  obligatoire:
                    type: boolean
                    description: Indicates whether the attribute is mandatory.
                  ordre:
                    type: integer
                    description: Display order of the attribute (if defined).
                  id_theme:
                    type: integer
                    description: Identifier for the theme to which the attribute belongs.
      400:
        description: Bad request.
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  description: Error message.
    """
    try:
        return get_all_attributes()
    except Exception as e:
        return {"message": str(e)}, 400 