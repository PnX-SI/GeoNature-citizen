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
from .queries import get_stats


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
    if not item or item.endswith(".None") or item.endswith(".0"):
        return

    domain, status = item.split(".", maxsplit=1)
    theme = current_app.config["REWARDS"].get(
        "DEFAULT_BADGESET", current_app.config["REWARDS"]["BADGESET"][0]
    )
    badge = None
    try:
        badge = {"img": theme[domain][status], "alt": item}
    except Exception as e:
        current_app.logger.info("theme[domain] = %s", theme[domain])
        current_app.logger.info("item = %s ", item)
        current_app.logger.error("exception caught: %s", str(e))

    return badge


def get_rewards():
    stats = get_stats()

    results = {
        "seniority": stats["seniority"].one().timestamp_create.timestamp(),
        "attendance": stats["attendance"].count(),
        "program_attendance": stats["program_attendance"].count(),
        # Program date bounds
        # Mission Success
        "get_occ": stats["get_occ"],
    }
    rewards = Classifier().tag(
        default_ruleset, {**base_props, **program_props, **results}
    )
    return [item for item in flatten(rewards)]


def get_badges():
    return [b for b in map(badge_image_mapper, get_rewards()) if b]
