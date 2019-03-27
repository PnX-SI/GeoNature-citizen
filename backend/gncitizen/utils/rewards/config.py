from io import StringIO
import json


# QUESTION: what is mission_success ?
# (constraint on the number of) obs submitted within program date bounds ?
# QUESTION: program_taxo_distance: mono specie..class program only, right ?

conf = json.load(StringIO("""
{
    "attendance": {
        "Attendance.Au": 5000,
        "Attendance.Ar": 1000,
        "Attendance.CuSn": 100
    },
    "seniority": {
        "Seniority.oeuf": "7days",
        "Seniority.chenille": "6months",
        "Seniority.papillon": "1an"
    },
    "taxo_error_weight": {
        "Kingdom": 64,
        "Phylum": 32,
        "Class": 16,
        "Order": 8,
        "Family": 4,
        "Genus": 2,
        "Species": 1
    },
    "taxo_distance": {
        "Observateur.None": 4,
        "Observateur.Amateur": 2,
        "Observateur.Chevronné": 1,
        "Observateur.SuperFort": 0
    },
    "program_attendance": {
        "Program_Attendance.Au": 7,
        "Program_Attendance.Ar": 5,
        "Program_Attendance.CuSn": 3
    },
    "program_date_bounds": {
        "start": "2019-03-20",
        "end": ""
    }
}
"""))

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
