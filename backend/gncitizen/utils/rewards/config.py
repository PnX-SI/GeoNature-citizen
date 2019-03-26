# models
import datetime


# ATTENDANCE
attendance_model = {
    "Attendance.Au": 5000,
    "Attendance.Ar": 1000,
    "Attendance.CuSn": 100,
}

# SENIORITY
seniority_model = {
    "Seniority.œuf": (datetime.datetime.now() - datetime.timedelta(days=7)).timestamp(),
    "Seniority.chenille": (
        datetime.datetime.now() - datetime.timedelta(weeks=26)
    ).timestamp(),
    "Seniority.papillon": (
        datetime.datetime.now() - datetime.timedelta(weeks=52)
    ).timestamp(),
}

# TAXON
taxo_error_weight_conf = {
    "Kingdom": 64,
    "Phylum": 32,
    "Class": 16,
    "Order": 8,
    "Family": 4,
    "Genus": 2,
    "Species": 1,
}

taxo_distance_model = {
    "Observateur.None": 4,
    "Observateur.Amateur": 2,
    "Observateur.Chevronné": 1,
    "Observateur.SuperFort": 0,
}

# PROGRAM_ATTENDANCE
program_attendance_model = {
    "Program_Attendance.Au": 7,
    "Program_Attendance.Ar": 5,
    "Program_Attendance.CuSn": 3,
}

# PROGRAM_DATE_BOUNDS
program_date_bounds_model = (
    (datetime.datetime.now() - datetime.timedelta(days=7)).timestamp(),
    (datetime.datetime.now()).timestamp(),
)


# MODEL QUERIES
#   UserModel {
#       id_role,
#       timestamp_create -> seniority
# }
#   ObserverMixinModel {
#       id_role
# }
#   ObservationModel {
#       id_role,
#       id_program
# }
#   ProgramsModel {
#       id_program,
#       is_active,
#       # program date bounds ?
# }
import datetime
import json
from gncitizen.utils.sqlalchemy import json_resp

from .classifier import Classifier
from .rules import (
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
    # QUESTION: what is mission_success ? (constraint on the number of) obs submitted within program date bounds ?
    # QUESTION: program_taxo_distance: mono specie/genus/family/... program only, isn't it ?
    program_taxo_distance_rule,
    program_attendance_rule,
    program_date_bounds_rule,
}

# PROPERTIES
base_props = {
    "attendance": 1000,
    "seniority": (datetime.datetime.today() - datetime.timedelta(weeks=27)).timestamp(),
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
# print("reward:", json.dumps(reward, indent=4))
