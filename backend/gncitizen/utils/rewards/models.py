import datetime
import re
from collections import OrderedDict
from typing import Optional

try:
    from flask import current_app

    conf = current_app.config["REWARDS"]["CONF"]
    logger = current_app.logger
except ImportError:
    # standalone __main__ / dev mode
    import logging

    logger = logging.getLogger()
    _dev_conf = {
        "attendance": {
            "Attendance.Au": 5000,
            "Attendance.Ar": 1000,
            "Attendance.CuSn": 100,
        },
        "seniority": {
            "Seniority.oeuf": "7days",
            "Seniority.chenille": "6months",
            "Seniority.papillon": "1an",
        },
        "program_attendance": {
            "Program_Attendance.Au": 7,
            "Program_Attendance.Ar": 5,
            "Program_Attendance.CuSn": 3,
        },
        "program_date_bounds": {"start": "2019-03-20", "end": ""},
        "recognition": [
            {
                "class": "Aves",
                "specialization": "Ornitologue",
                "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
            },
            {
                "class": "Mammalia",
                "specialization": "Mammalogiste",
                "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
            },
            {
                "class": "Reptilia",
                "specialization": "Herpétologue",
                "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
            },
            {
                "order": "Odonata",
                "specialization": "Odonatologue",
                "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
            },
            {
                "order": "Lepidptera",
                "specialization": "Lépidoptériste",
                "attendance": {"Au": 500, "Ar": 100, "CuSn": 10},
            },
        ],
    }
    conf = _dev_conf


Timestamp = float


def config_duration2timestamp(s: Optional[str]) -> Optional[Timestamp]:
    if s is None or s == "":
        return (datetime.datetime.now()).timestamp()

    # int hours -> years
    dt = None
    weeks_in_month = 4.345
    weeks_in_year = 52.143
    units = [
        ("HOURS", r"hours?|heures?"),
        ("DAYS", r"days?|jours?"),
        ("WEEKS", r"weeks?|semaines?"),
        ("MONTHS", r"months?|mois"),
        ("YEARS", r"years?|ans?"),
    ]
    tok_regex = "".join(
        [
            r"(?P<QUANTITY>\d+)\s*(",
            "|".join("(?P<%s>%s)" % pair for pair in units),
            r")",
        ]
    )
    for mo in re.finditer(tok_regex, s):
        value = mo.group("QUANTITY")
        if mo.group("HOURS"):
            dt = datetime.timedelta(hours=float(value))
        if mo.group("DAYS"):
            dt = datetime.timedelta(days=float(value))
        if mo.group("WEEKS"):
            dt = datetime.timedelta(weeks=float(value))
        if mo.group("MONTHS"):
            dt = datetime.timedelta(weeks=float(value) * weeks_in_month)
        if mo.group("YEARS"):
            dt = datetime.timedelta(weeks=float(value) * weeks_in_year)

    if dt:
        return (datetime.datetime.now() - dt).timestamp()
    else:
        try:
            # parse Y M D
            dt = datetime.datetime(*map(int, re.findall(r"\d+", str(s))))
            return dt.timestamp()
        except Exception as e:
            logger.critical(e)
            return None


attendance_model = OrderedDict(
    reversed(sorted(conf["attendance"].items(), key=lambda t: t[1]))
)

seniority_model = OrderedDict(
    reversed(
        sorted(
            [(k, config_duration2timestamp(v)) for k, v in conf["seniority"].items()],
            key=lambda t: t[1],
        )
    )
)

program_attendance_model = OrderedDict(
    reversed(sorted(conf["program_attendance"].items(), key=lambda t: t[1]))
)

program_date_bounds_model = {
    "start": config_duration2timestamp(conf["program_date_bounds"]["start"]),
    "end": config_duration2timestamp(conf["program_date_bounds"]["end"]),
}

recognition_model = [
    {
        "class"
        if "class" in conf["recognition"][i]
        else "order": conf["recognition"][i]["class"]
        if "class" in conf["recognition"][i]
        else conf["recognition"][i]["order"],
        "specialization": conf["recognition"][i]["specialization"],
        "attendance": OrderedDict(
            reversed(
                sorted(conf["recognition"][i]["attendance"].items(), key=lambda t: t[1])
            )
        ),
    }
    for i in range(len(conf["recognition"]))
]

test_config_duration2timestamp = """
>>> datetime.date.fromtimestamp(config_duration2timestamp("3 months")) == (datetime.datetime.now() - datetime.timedelta(weeks=3 * 4.345)).date()
True
>>> datetime.date.fromtimestamp(config_duration2timestamp("28days")) == (datetime.datetime.now() - datetime.timedelta(days=28)).date()
True
>>> datetime.date.fromtimestamp(config_duration2timestamp("1year")) == (datetime.datetime.now() - datetime.timedelta(weeks=52.143)).date()
True
>>> config_duration2timestamp("52elephants") is None
True
>>> config_duration2timestamp("1969-08-18") == datetime.datetime.strptime("1969-08-18", "%Y-%m-%d").timestamp()
True
"""  # noqa: E501

__test__ = {"test_config_duration2timestamp": test_config_duration2timestamp}


def test():
    import doctest

    doctest.testmod(verbose=1)


if __name__ == "__main__":
    test()
