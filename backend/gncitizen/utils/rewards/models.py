import datetime
import re
from collections import OrderedDict

from flask import current_app


conf = current_app.config["REWARDS"]["CONF"]


def human_date_delta(s: str) -> float:
    if s in set(["", None]):
        return (datetime.datetime.now()).timestamp()
    dt = None
    weeks_in_months = 4.345
    months_in_year = 52.143
    hours = r"hours?|heures?"
    days = r"days?|jours?"
    weeks = r"weeks?|semaines?"
    months = r"months?|mois"
    years = r"years?|ans?"
    rgx = r"".join(
        [r"(\d+)", r"(", r"|".join([hours, days, weeks, months, years]), r")"]
    )
    matched = re.match(rgx, str(s))
    matches = matched.groups() if matched else None
    if matches and len(matches) == 2:
        if re.match(hours, matches[1]):
            dt = datetime.timedelta(hours=float(matches[0]))
        if re.match(days, matches[1]):
            dt = datetime.timedelta(days=float(matches[0]))
        if re.match(weeks, matches[1]):
            dt = datetime.timedelta(weeks=float(matches[0]))
        if re.match(months, matches[1]):
            dt = datetime.timedelta(weeks=float(matches[0]) * weeks_in_months)
        if re.match(years, matches[1]):
            dt = datetime.timedelta(
                weeks=float(matches[0]) * weeks_in_months * months_in_year
            )
    else:
        try:
            _d = datetime.datetime(*map(int, re.findall(r"\d+", str(s))))
            # _d = _d.replace(tzinfo=datetime.timezone.utc)
            dt = datetime.datetime.now() - _d
        except Exception as e:
            current_app.logger.error(str(s), e)
            return None
    return (datetime.datetime.now() - dt).timestamp()


attendance_model = OrderedDict(
    reversed(sorted(conf["attendance"].items(), key=lambda t: t[1]))
)

seniority_model = OrderedDict(
    reversed(
        sorted(
            [(k, human_date_delta(v)) for k, v in conf["seniority"].items()],
            key=lambda t: t[1],
        )
    )
)

taxo_error_binary_weights = OrderedDict(
    reversed(sorted(conf["taxo_error_binary_weights"].items(), key=lambda t: t[1]))
)


taxo_distance_model = OrderedDict(
    reversed(sorted(conf["taxo_distance"].items(), key=lambda t: t[1]))
)

program_attendance_model = OrderedDict(
    reversed(sorted(conf["program_attendance"].items(), key=lambda t: t[1]))
)

program_date_bounds_model = {
    "start": human_date_delta(conf["program_date_bounds"]["start"]),
    "end": human_date_delta(conf["program_date_bounds"]["end"]),
}
