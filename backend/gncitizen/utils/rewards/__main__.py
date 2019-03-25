import datetime
import json

from classifier import Classifier
from rules import (
    attendance_rule,
    seniority_rule,
    program_taxo_distance_rule,
    program_attendance_rule,
    program_date_bounds_rule,
)


# RULESET
default_ruleset = {
    attendance_rule,
    seniority_rule,
    # FIXME: mission_success
    program_taxo_distance_rule,
    program_attendance_rule,
    program_date_bounds_rule,
}

# ############################## TESTING #####################################
if __name__ == "__main__":
    # PROPERTIES
    base_props = {
        "attendance": 1000,
        "seniority": (
            datetime.datetime.today() - datetime.timedelta(weeks=27)
        ).timestamp(),
        "mission_success": False,  # avg program_attendance ?
    }

    program_props = {
        "program_attendance": 3,
        "program_taxo_dist": 1,
        "submission_date": (
            datetime.datetime.now() - datetime.timedelta(days=3)
        ).timestamp(),
        "reference_taxon": {
            "Kingdom": "Animalia",
            "Phylum": "Chordata",
            "Class": "Aves",
            "Order": "Passeriformes",
            "Family": "Muscicapidae",
            "Genus": "Phoenicurus",
            "Species": "Phoenicurus phoenicurus",
            "sci_name": "Phoenicurus phoenicurus (Linnaeus, 1758)",
            "id": 1235,
        },
        "submitted_taxon": {
            "Kingdom": "Animalia",
            "Phylum": "Chordata",
            "Class": "Aves",
            "Order": "Passeriformes",
            "Family": "Muscicapidae",
            "Genus": "Phoenicurus",
            "Species": "Heteroxenicus",
            "sci_name": "Heteroxenicus stellatus (Gould, 1868)",
            "id": 1243,
        },
        # "submitted_taxon": {
        #     "Kingdom": "Animalia",
        #     "Phylum": "Chordata",
        #     "Class": "Aves",
        #     "Order": "Apterygiformes",
        #     "Family": "Apterygidae",
        #     "Genus": "Apteryx",
        #     "Species": "Apteryx australis",
        #     "sci_name": "Apteryx australis (Shaw 1813)",
        #     "id": 1250,
        # },
    }

    reward = []
    merged = {**base_props, **program_props}
    reward = Classifier().tag(default_ruleset, merged)
    print("reward:", json.dumps(reward, indent=4))
