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

    domain, *rest, status = item.split(".")
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
        raise

    return badge


def get_rewards(id):
    stats = get_stats(id)
    attendance = stats["attendance"](id)
    results = {
        "seniority": stats["seniority"](id).one().timestamp_create.timestamp(),
        "attendance": attendance.count(),
        "program_attendance": [
            item.count() for item in stats["program_attendance"](attendance)
        ],
        # Program date bounds
        # Mission Success
        "get_occ": stats["get_occ"](attendance),
    }
    rewards = Classifier().tag(
        default_ruleset, {**base_props, **program_props, **results}
    )
    return [item for item in flatten(rewards)]


def get_badges(id):
    rewards = get_rewards(id)
    return [b for b in map(badge_image_mapper, rewards) if b]
