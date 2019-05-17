import datetime
from flask import current_app
from .classifier import Classifier
from .rules import (
    attendance_rule,
    seniority_rule,
    program_attendance_rule,
    program_date_bounds_rule,
    recognition_rule,
)
from . import queries


default_ruleset = {
    attendance_rule,
    seniority_rule,
    program_attendance_rule,
    program_date_bounds_rule,
    recognition_rule,
}

# PROPERTIES
base_props = {
    # "attendance": 1000,
    # "seniority": (datetime.datetime.today() - datetime.timedelta(weeks=27)).timestamp(),
    "mission_success": False  # avg program_attendance ?
}

program_props = {
    # "program_attendance": 3,
    "submission_date": (
        datetime.datetime.now() - datetime.timedelta(days=3)
    ).timestamp(),
    # "reference_taxon": {
    #     "regne": "Animalia",
    #     "phylum": "Chordata",
    #     "classe": "Aves",
    #     "ordre": "Passeriformes",
    #     "famille": "Muscicapidae",
    #     "sous_famille": "Phoenicurus",
    #     "tribu": "Phoenicurus phoenicurus",
    #     "sci_name": "Phoenicurus phoenicurus (Linnaeus, 1758)",
    #     "cd_nom": 1235,
    # },
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


def flatten(arr):
    for i in arr:
        if isinstance(i, list):
            yield from flatten(i)
        else:
            yield i


def badge_image_mapper(item):
    if not item or item.endswith(".None"):
        return

    domain, status = item.split(".")
    current_app.logger.critical("%s %s", domain, status)
    theme = current_app.config["REWARDS"].get(
        "DEFAULT_BADGESET", current_app.config["REWARDS"]["BADGESET"][0]
    )
    img = theme[domain][status]

    current_app.logger.critical("badge: %s", img)
    return img


badge_theme = current_app.config["REWARDS"]["BADGESET"][0]


results = queries.results
rewards = Classifier().tag(default_ruleset, {**base_props, **program_props, **results})
rewards = [item for item in flatten(rewards)]
badges = [b for b in map(badge_image_mapper, rewards) if b]
current_app.logger.critical("badges imgs: %s", [b for b in badges])
