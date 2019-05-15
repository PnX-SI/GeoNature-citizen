from .rule import Rule
from .models import (
    attendance_model,
    seniority_model,
    program_attendance_model,
    program_date_bounds_model,
    recognition_model,
)


# ATTENDANCE
def attendance_condition(context):
    return "attendance" in context.keys()


def attendance_action(data):
    for category, threshold in attendance_model.items():
        if data["attendance"] >= threshold:
            return "Attendance.{}".format(category)
    return "Attendance.None"


attendance_rule = Rule(attendance_condition, attendance_action)


# SENIORITY
def seniority_condition(context):
    return "seniority" in context.keys()


def seniority_action(data):
    for category, threshold in seniority_model.items():
        if data["seniority"] >= threshold:
            return "Seniority.{}".format(category)
    return "Seniority.None"


seniority_rule = Rule(seniority_condition, seniority_action)


# PROGRAM_ATTENDANCE
def program_attendance_condition(context):
    return "program_attendance" in context.keys()


def program_attendance_action(data):
    for category, threshold in program_attendance_model.items():
        if data["program_attendance"] >= threshold:
            return "Program_Attendance.{}".format(category)
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


def recognition_condition(context):
    return context["submitted_taxon"]


def recognition_action(data):
    r = []
    for i, item in enumerate(recognition_model):
        for category, threshold in recognition_model[i]["attendance"].items():
            if data["recognition"][i] >= threshold:
                r.append(
                    "Recognized.{}.{}".format(
                        recognition_model[i]["specialization"], category
                    )
                )
    return r if len(r) > 0 else ["Recognition.None"]


recognition_rule = Rule(recognition_condition, recognition_action)
