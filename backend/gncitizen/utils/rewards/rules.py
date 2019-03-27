from .rule import Rule
from .models import (
    attendance_model,
    seniority_model,
    taxo_error_binary_weights,
    taxo_distance_model,
    program_attendance_model,
    program_date_bounds_model
)


# ATTENDANCE
def attendance_condition(context):
    return "attendance" in context.keys()


def attendance_action(data):
    for category, threshold in attendance_model.items():
        if data["attendance"] >= threshold:
            return category
    return None


attendance_rule = Rule(attendance_condition, attendance_action)


# SENIORITY
def seniority_condition(context):
    return "seniority" in context.keys()


def seniority_action(data):
    for category, threshold in seniority_model.items():
        if data["seniority"] >= threshold:
            return category
    return "Seniority.None"


seniority_rule = Rule(seniority_condition, seniority_action)


# TAXON
def taxo_distance_error(ref, sub):
    if ref["id"] == sub["id"]:
        return 0
    counter = 1
    for k in taxo_error_binary_weights.keys():
        if ref[k] == sub[k]:
            continue
        else:
            counter <<= 1
    return counter


def taxo_distance_condition(context):
    return (
        context["reference_taxon"]
        and context["submitted_taxon"]
    )


def taxo_distance_action(data):
    taxo_error = taxo_distance_error(data["reference_taxon"], data["submitted_taxon"])
    for category, threshold in taxo_distance_model.items():
        if taxo_error >= threshold:
            return category
    return max(taxo_distance_model, key=lambda k: taxo_distance_model[k])


program_taxo_distance_rule = Rule(taxo_distance_condition, taxo_distance_action)


# PROGRAM_ATTENDANCE
def program_attendance_condition(context):
    return "program_attendance" in context.keys()


def program_attendance_action(data):
    for category, threshold in program_attendance_model.items():
        if data["program_attendance"] >= threshold:
            return category
    return "Program_Attendance.None"


program_attendance_rule = Rule(program_attendance_condition, program_attendance_action)


# PROGRAM_DATE_BOUNDS
def program_date_bounds_condition(context):
    return "submission_date" in context.keys()


def program_date_bounds_action(data):
    return (
        "Program_Date_Bounds.1"
        if (
            program_date_bounds_model["start"]
            <= data["submission_date"]
            <= program_date_bounds_model["end"]
        )
        else "Program_Date_Bounds.0"
    )


program_date_bounds_rule = Rule(
    program_date_bounds_condition, program_date_bounds_action
)
