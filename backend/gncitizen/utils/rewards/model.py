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
