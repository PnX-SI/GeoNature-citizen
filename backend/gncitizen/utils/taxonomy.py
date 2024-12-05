#!/usr/bin/env python3

"""A module to manage taxonomy"""

from threading import Thread
import unicodedata
from typing import Dict, List, Optional, Union

import requests
from flask import current_app
from requests.adapters import HTTPAdapter, Retry

session = requests.Session()

retries = Retry(total=5, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])

session.mount("https://", HTTPAdapter(max_retries=retries))


logger = current_app.logger


TAXHUB_API = (
    current_app.config["API_TAXHUB"] + "/"
    if current_app.config["API_TAXHUB"][-1] != "/"
    else current_app.config["API_TAXHUB"]
)

if "TAXHUB_LISTS_EXCLUDE" in current_app.config:
    excluded_list_ids = set(current_app.config["TAXHUB_LISTS_EXCLUDE"])
else:
    excluded_list_ids = set()

logger.info(f"TAXHUB_EXCLUDED_LISTS {excluded_list_ids}")

Taxon = Dict[str, Union[str, Dict[str, str], List[Dict]]]

taxhub_full_lists = {}
taxonomy_lists = []


def taxhub_rest_get_taxon_list(taxhub_list_id: int, params_to_update: Dict = {}) -> Dict:
    url = f"{TAXHUB_API}taxref"
    params = {
        "id_liste": taxhub_list_id,
        # TODO: see if PR taxhub is accepted (https://github.com/PnX-SI/TaxHub/pull/583) . If not , this won't work
        "fields": "medias.types,attributs.bib_attribut",
        "existing": "true",
        "order": "asc",
        "orderby": "nom_complet",
        "limit": 1000,
    }
    if params_to_update:
        params.update(params_to_update)
    res = session.get(
        url,
        params=params,
        timeout=5,
    )
    res.raise_for_status()
    return res.json()


def taxhub_rest_get_all_lists() -> Optional[Dict]:
    url = f"{TAXHUB_API}biblistes"
    res = session.get(
        url,
        timeout=10000,  # TODO : suivant le nombre de taxons dans les listes cette requête peut êtr très longue (voir pour améliorer performance coté TaxHub avec notamment la définition dans le modèle BibListes : https://github.com/PnX-SI/TaxHub/blob/ea9434de5a1f227131e0e8640ad17f8a25e8a39d/apptax/taxonomie/models.py#L238 )
    )
    res.raise_for_status()
    if res.status_code == 200:
        try:
            taxa_lists = res.json()["data"]
            taxa_lists = [taxa for taxa in taxa_lists if not taxa["id_liste"] in excluded_list_ids]
            for taxa_list in taxa_lists:
                taxonomy_lists.append((taxa_list["id_liste"], taxa_list["nom_liste"]))
            print(f"taxonomy_lists {taxonomy_lists}")
        except Exception as e:
            logger.critical(str(e))
        return res.json().get("data", [])
    return None


#  TODO: check if useless and remove
# def taxhub_rest_get_taxon(taxhub_id: int) -> Taxon:
#     if not taxhub_id:
#         raise ValueError("Null value for taxhub taxon id")
#     url = f"{TAXHUB_API}taxref/{taxhub_id}"
#     for _ in range(5):
#         try:
#             res = session.get(url, timeout=5)
#             break
#         except requests.exceptions.ReadTimeout:
#             continue

#     res.raise_for_status()
#     data = res.json()
#     data.pop("listes", None)
#     data.pop("attributs", None)
#     if len(data["medias"]) > 0:
#         media_types = ("Photo_gncitizen", "Photo_principale", "Photo")
#         i = 0
#         while i < len(media_types):
#              # TODO: résoudre problème de récupérations de types de médias  (nom_type_media non accessible) ---> fonctionne avec branche de TH https://github.com/naturalsolutions/TaxHub/blob/fix/load_types_medias_from_taxref_route/apptax/taxonomie/routestaxref.py#L231
#             filtered_medias = [
#                 d for d in data["medias"] if d["types"]["nom_type_media"] == media_types[i]
#             ]
#             if len(filtered_medias) >= 1:
#                 break
#             i += 1
#         medias = filtered_medias[:1]
#         data["medias"] = medias

#     return data


def make_taxon_repository(taxhub_list_id: int) -> List[Taxon]:
    taxa = taxhub_rest_get_taxon_list(taxhub_list_id)
    if isinstance(taxa, dict) and "items" in taxa:
        reformatted_taxa = reformat_taxa(taxa)
    else:
        reformatted_taxa = []
    return reformatted_taxa


def get_specie_from_cd_nom(cd_nom) -> Dict:
    """get specie datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int

    :return: french and scientific official name (from ``cd_ref`` = ``cd_nom``) as dict
    :rtype: dict
    """
    # url = f"{TAXHUB_API}/taxref?is_ref=true&cd_nom={cd_nom}"
    url = f"{TAXHUB_API}taxref/{cd_nom}"
    params = {
        "is_ref": True,
        # "cd_nom": cd_nom,
    }
    res = session.get(url, params=params)
    official_taxa = res.json().get("items", [{}])[0]

    common_names = official_taxa.get("nom_vern", "")
    common_name = common_names.split(",")[0]
    common_name_eng = official_taxa.get("nom_vern_eng", "")
    sci_name = official_taxa.get("lb_nom", "")

    taxref = {
        "common_name": common_name,
        "common_name_eng": common_name_eng,
        "sci_name": sci_name,
    }

    for k in official_taxa:
        taxref[k] = official_taxa.get(k, "")
    return taxref


def refresh_taxonlist() -> Dict:
    """refresh taxon list"""
    logger.info("Pre loading taxhub data (taxa lists and medias)")
    taxhub_lists = taxhub_rest_get_all_lists()
    if taxhub_lists:
        count = 0
        for taxhub_list in taxhub_lists:
            count += 1
            logger.info(f"loading list {count}/{len(taxhub_lists)}")
            r = make_taxon_repository(taxhub_list["id_liste"])
            taxhub_full_lists[taxhub_list["id_liste"]] = r
    else:
        logger.warning("ERROR: No taxhub lists available")
    return taxhub_full_lists


daemon = Thread(target=refresh_taxonlist, daemon=True, name="Monitor")
daemon.start()


def reformat_taxa(taxa):
    result = []

    items = taxa.get("items", [taxa])
    # On parcours chaque item de taxa et on peut ici choisir de garder ou non certains champs pertinent pour citizen
    # NOTES: pour éviter de tout charger peut être alléger l'objet taxref si pas utilisé ?
    for item in items:
        taxon = {
            "medias": [],
            "cd_nom": item.get("cd_nom"),
            "nom_francais": None,
            "taxref": {
                "cd_nom": item.get("cd_nom"),
                "cd_ref": item.get("cd_ref"),
                "cd_sup": item.get("cd_sup"),
                "cd_taxsup": item.get("cd_taxsup"),
                "classe": item.get("classe"),
                "famille": item.get("famille"),
                "group1_inpn": item.get("group1_inpn"),
                "group2_inpn": item.get("group2_inpn"),
                "id_habitat": item.get("id_habitat"),
                "id_rang": item.get("id_rang"),
                "id_statut": item.get("id_statut"),
                "lb_auteur": item.get("lb_auteur"),
                "lb_nom": item.get("lb_nom"),
                "nom_complet": item.get("nom_complet"),
                "nom_complet_html": item.get("nom_complet_html"),
                "nom_valide": item.get("nom_valide"),
                "nom_vern": item.get("nom_vern"),
                "nom_vern_eng": item.get("nom_vern_eng"),
                "ordre": item.get("ordre"),
                "phylum": item.get("phylum"),
                "regne": item.get("regne"),
                "sous_famille": item.get("sous_famille"),
                "tribu": item.get("tribu"),
                "url": item.get("url"),
            },
        }
        for media in item.get("medias", []):
            types = media.get("types", {})
            nom_type_media = types.get("nom_type_media")
            if nom_type_media in ["Photo_gncitizen", "Photo_principale", "Photo"]:
                media_reformat = {**media, "nom_type_media": nom_type_media}
                taxon["medias"].append(media_reformat)
        # Parcourir les attributs et chercher 'nom_francais' dans bib_attribut
        for attribut in item.get("attributs", []):
            bib_attribut = attribut.get("bib_attribut", {})
            if remove_accents(
                bib_attribut.get("nom_attribut", "").lower()
            ) == "nom_francais":
                taxon["nom_francais"] = attribut.get("valeur_attribut")

        result.append(taxon)
    return result


def get_taxa_by_cd_nom(cd_nom,  params_to_update: Dict = {}) -> Dict:
    """get taxa datas from taxref id (cd_nom)

    :param cd_nom: taxref unique id (cd_nom)
    :type cd_nom: int
    :rtype: dict
    """
    # url = f"{TAXHUB_API}/taxref?is_ref=true&cd_nom={cd_nom}"
    url = f"{TAXHUB_API}taxref/{cd_nom}"
    params = {
        "is_ref": True,
        # "cd_nom": cd_nom,
    }
    if params_to_update:
        params.update(params_to_update)
    res = session.get(url, params=params)
    taxon_info = res.json()
    return reformat_taxa(taxon_info)

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize("NFKD", input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])
