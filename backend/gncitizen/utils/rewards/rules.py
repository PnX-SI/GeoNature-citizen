from collections import OrderedDict

from rule import Rule
from model import (
    attendance_model,
    seniority_model,
    taxo_error_weight_conf,
    taxo_distance_model,
    program_attendance_model,
    program_date_bounds_model,
)


# ATTENDANCE
def attendance_condition(context):
    return "attendance" in context.keys()


ordered_attendance_model = OrderedDict(
    reversed(sorted(attendance_model.items(), key=lambda t: t[1]))
)


def attendance_action(data):
    for category, threshold in ordered_attendance_model.items():
        if data["attendance"] >= threshold:
            return category
    return None


attendance_rule = Rule(attendance_condition, attendance_action)


# SENIORITY
def seniority_condition(context):
    return "seniority" in context.keys()


ordered_seniority_model = OrderedDict(
    reversed(sorted(seniority_model.items(), key=lambda t: t[1]))
)


def seniority_action(data):
    for category, threshold in ordered_seniority_model.items():
        if data["seniority"] >= threshold:
            return category
    return "Seniority.None"


seniority_rule = Rule(seniority_condition, seniority_action)

# TAXON
taxo_error_weight = OrderedDict(
    reversed(sorted(taxo_error_weight_conf.items(), key=lambda t: t[1]))
)


def taxo_distance_error(ref, sub):
    if ref["id"] == sub["id"]:
        return 0
    counter = 1
    for k in taxo_error_weight.keys():
        if ref[k] == sub[k]:
            continue
        else:
            counter <<= 1
    return counter


def taxo_distance_condition(context):
    return (
        context["program_taxo_dist"]
        and context["reference_taxon"]
        and context["submitted_taxon"]
    )


ordered_taxo_distance_model = OrderedDict(
    reversed(sorted((taxo_distance_model).items(), key=lambda t: t[1]))
)


def taxo_distance_action(data):
    taxo_error = taxo_distance_error(data["reference_taxon"], data["submitted_taxon"])
    result = max(taxo_distance_model, key=lambda k: taxo_distance_model[k])
    for category, threshold in ordered_taxo_distance_model.items():
        if taxo_error <= threshold:
            result = category
    return result


program_taxo_distance_rule = Rule(taxo_distance_condition, taxo_distance_action)


# PROGRAM_ATTENDANCE
def program_attendance_condition(context):
    return "program_attendance" in context.keys()


ordered_program_attendance_model = OrderedDict(
    reversed(sorted(program_attendance_model.items(), key=lambda t: t[1]))
)


def program_attendance_action(data):
    for category, threshold in ordered_program_attendance_model.items():
        if data["program_attendance"] >= threshold:
            return category
    return "Program_Attendance.None"


program_attendance_rule = Rule(program_attendance_condition, program_attendance_action)


# PROGRAM_DATE_BOUNDS
def program_date_bounds_condition(context):
    return "submission_date" in context.keys()


def program_date_bounds_action(data):
    return (
        "Program_Date_Bounds.True"
        if (
            min(*program_date_bounds_model)
            <= data["submission_date"]
            <= max(*program_date_bounds_model)
        )
        else "Program_Date_Bounds.False"
    )


program_date_bounds_rule = Rule(
    program_date_bounds_condition, program_date_bounds_action
)
