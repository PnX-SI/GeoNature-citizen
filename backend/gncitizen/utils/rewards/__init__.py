import datetime

# import json

from .classifier import Classifier
from .rules import (
    attendance_rule,
    seniority_rule,
    program_taxo_distance_rule,
    program_attendance_rule,
    program_date_bounds_rule,
)
from . import queries


default_ruleset = {
    attendance_rule,
    seniority_rule,
    program_taxo_distance_rule,
    program_attendance_rule,
    program_date_bounds_rule,
}

# PROPERTIES
base_props = {
    # "attendance": 1000,
    # "seniority": (datetime.datetime.today() - datetime.timedelta(weeks=27)).timestamp(),
    "mission_success": False  # avg program_attendance ?
}

program_props = {
    "program_attendance": 3,
    "submission_date": (
        datetime.datetime.now() - datetime.timedelta(days=3)
    ).timestamp(),
    "reference_taxon": {
        "regne": "Animalia",
        "phylum": "Chordata",
        "classe": "Aves",
        "ordre": "Passeriformes",
        "famille": "Muscicapidae",
        "sous_famille": "Phoenicurus",
        "tribu": "Phoenicurus phoenicurus",
        "sci_name": "Phoenicurus phoenicurus (Linnaeus, 1758)",
        "cd_nom": 1235,
    },
    "submitted_taxon": {
        "regne": "Animalia",
        "phylum": "Chordata",
        "classe": "Aves",
        "ordre": "Passeriformes",
        "famille": "Muscicapidae",
        "sous_famille": "Phoenicurus",
        "tribu": "Heteroxenicus",
        "sci_name": "Heteroxenicus stellatus (Gould, 1868)",
        "cd_nom": 3582,
    },
    # "submitted_taxon": {
    #     "regne": "Animalia",
    #     "phylum": "Chordata",
    #     "classe": "Aves",
    #     "ordre": "Apterygiformes",
    #     "famille": "Apterygidae",
    #     "sous_famille": "Apteryx",
    #     "tribu": "Apteryx australis",
    #     "sci_name": "Apteryx australis (Shaw 1813)",
    #     "cd_nom": 1250,
    # },
}

reward = []
results = queries.results
merged = {**base_props, **program_props, **results}
print("query result:", merged)
reward = Classifier().tag(default_ruleset, merged)
# print("reward:", json.dumps(reward, indent=4))
# print("query result:", json.dumps(results, indent=4))
