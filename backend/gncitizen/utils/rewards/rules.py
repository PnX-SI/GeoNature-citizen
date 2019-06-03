import logging
from typing import Union, List
from .rule import Rule
from .models import (
    attendance_model,
    seniority_model,
    program_attendance_model,
    program_date_bounds_model,
    recognition_model,
)


# ATTENDANCE
def attendance_condition(context) -> bool:
    return "attendance" in context.keys()


def attendance_action(data) -> str:
    return [
        "Attendance.{}".format(category)
        for category, threshold in attendance_model.items()
        if data["attendance"] >= threshold
    ]


attendance_rule = Rule(attendance_condition, attendance_action)


# SENIORITY
def seniority_condition(context) -> bool:
    return "seniority" in context.keys()


def seniority_action(data) -> str:
    return [
        "Seniority.{}".format(category)
        for category, threshold in seniority_model.items()
        if data["seniority"] >= threshold
    ]


seniority_rule = Rule(seniority_condition, seniority_action)


# PROGRAM_ATTENDANCE
def program_attendance_condition(context) -> bool:
    # return (
    #     context.get('program_attendance')
    #     and len(context["program_attendance"]) >= 1
    #     if isinstance(context["program_attendance"], list)
    #     else True
    # )
    return "program_attendance" in context.keys()


def program_attendance_action(data) -> str:
    return [
        "Program_Attendance.{}.{}".format(i, category)
        for category, threshold in program_attendance_model.items()
        for i, program_attendance in enumerate(data["program_attendance"])
        if program_attendance >= threshold
    ]


program_attendance_rule = Rule(program_attendance_condition, program_attendance_action)


# PROGRAM_DATE_BOUNDS
def program_date_bounds_condition(context) -> bool:
    return "submission_date" in context.keys()


def program_date_bounds_action(data) -> str:
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


def recognition_condition(context) -> bool:
    return True  # && app.config["REWARDS"]["CONF"]["recognition"]


def recognition_action(data) -> Union[List[str], str]:
    r = []
    q = data["get_occ"]  # data["submitted_taxon"] ?
    logging.critical("counts: %s", q)
    for i, item in enumerate(recognition_model):
        for category, threshold in recognition_model[i]["attendance"].items():
            if q and q[i] >= threshold:
                r.append(
                    "{}.{}".format(recognition_model[i]["specialization"], category)
                )
    return r if len(r) > 0 else "Recognition.None"


recognition_rule = Rule(recognition_condition, recognition_action)
