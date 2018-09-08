from .models import CorNomListe, BibNoms, BibListes

from flask import Blueprint, request, jsonify
from gncitizen.utils.utilssqlalchemy import json_resp
from gncitizen.utils.env import db
routes=Blueprint('taxonomy',  __name__)

@routes.route('/taxonomy/lists/', methods=['GET'])
@json_resp
def get_lists():
    taxlist = CorNomListe.query.all()
    taxhub_lists = []
    for list in taxlist:
        taxhub_lists.append(list.as_dict(True))
        # taxhub_lists.append(list.as_dict(True))
    return taxhub_lists


@routes.route('/taxonomy/lists2/', methods=['GET'])
@json_resp
def get_lists2():
    taxlist = BibListes.query.all()
    taxlists = []
    for l in taxlist:
        taxlists.append(l.as_dict(True))
        cnls=CorNomListe.query.filter_by(id_liste=l.id_liste).all()
        species=[]
        for cnl in cnls:
            list_sp=cnl.as_dict(True)['bib_nom']
            species.append(list_sp)

        print(species)
        dict_taxlists = dict(taxlists)
        # taxlists['species'] = dict_taxlists
        # taxlists.append(list.as_dict(True))
    return dict_taxlists