# import requests
from flask import Blueprint, current_app, json

# from gncitizen.utils.env import taxhub_lists_url
from gncitizen.utils.env import db
from gncitizen.utils.sqlalchemy import json_resp

# if not current_app.config["API_TAXHUB"] == "bla":
if not current_app.config["API_TAXHUB"]:
    from gncitizen.core.taxonomy.models import (
        BibNoms,
        BibListes,
        CorNomListe,
        TMedias,
        Taxref,
    )
else:
    import requests
    from requests.exceptions import ConnectionError


routes = Blueprint("taxonomy", __name__)


@routes.route("/taxonomy/lists", methods=["GET"])
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


@routes.route("/taxonomy/lists/<int:id>/species", methods=["GET"])
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
    # if current_app.config["API_TAXHUB"] == "bla":
    if current_app.config["API_TAXHUB"]:
        try:
            TAXHUB_API = current_app.config["API_TAXHUB"]
            TAXHUB_API += "/" if current_app.config["API_TAXHUB"][-1] != "/" else ""

            list_req = requests.get(
                "{}biblistes/taxons/{}?existing=true&order=asc&orderby=taxref.nom_complet".format(
                    TAXHUB_API, id
                )
            )

            taxon_list = json.loads(list_req.content).get("items")
            taxon_card_ids = [item["id_nom"] for item in taxon_list]
            current_app.logger.critical(taxon_card_ids)

            results = []
            for card_id in taxon_card_ids:
                _req = requests.get("{}bibnoms/{}".format(TAXHUB_API, card_id))
                _res = json.loads(_req.content)

                data = dict()
                data["nom"] = {
                    k: _res[k]
                    for k in _res
                    if k in {"id_nom", "cd_nom", "cd_ref", "nom_francais"}
                }
                # get_medias -> filter(is_public==true)
                data["medias"] = [
                    media
                    for media in _res["medias"]
                    if media and media["is_public"] and media["url"]
                ]
                data["taxref"] = _res["taxref"]
                results.append(data)

        except (Exception, ConnectionError) as e:
            current_app.logger.warning(str(e))
            return {"message": str(e)}, 400

        else:
            current_app.logger.info("%s", results)
            return [d for d in results]

    else:
        try:
            data = (
                db.session.query(BibNoms, Taxref, TMedias)
                .distinct(BibNoms.cd_ref)
                .join(CorNomListe, CorNomListe.id_nom == BibNoms.id_nom)
                .join(Taxref, Taxref.cd_ref == BibNoms.cd_ref)
                .outerjoin(TMedias, TMedias.cd_ref == BibNoms.cd_ref)
                .filter(CorNomListe.id_liste == id)
                .all()
            )
            # current_app.logger.debug(
            #     [{'nom': d[0], 'taxref': d[1]} for d in data])
            return [
                {
                    "nom": d[0].as_dict(),
                    "taxref": d[1].as_dict(),
                    "medias": d[2].as_dict() if d[2] else None,
                }
                for d in data
            ]
        except Exception as e:
            return {"message": str(e)}, 400


# @routes.route('/taxonomy/lists/full', methods=['GET'])
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


# @routes.route('/taxonomy/lists/<int:id>/species', methods=['GET'])
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


@routes.route("/taxonomy/taxon/<int:cd_nom>", methods=["GET"])
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
