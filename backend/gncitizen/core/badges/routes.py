from calendar import monthrange
from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.users.models import UserModel
from gncitizen.utils.taxonomy import get_specie_from_cd_nom
from sqlalchemy.sql.expression import func

badges_api = Blueprint("badges", __name__)


@badges_api.route("/rewards/<int:id>", methods=["GET"])
def get_rewards(id):
    total_obs = 0
    program_scores = []
    taxon_scores = []
    awarded_badges = []
    current_app.config.from_pyfile("../config/badges_config.py")
    rewards = current_app.config["REWARDS"]

    scores_query = (
        ObservationModel.query.filter(ObservationModel.id_role == id)
        .group_by(ObservationModel.id_program)
        .values(
            ObservationModel.id_program.label("id"),
            func.count(ObservationModel.id_program).label("nb_obs"),
        )
    )
    for item in scores_query:
        program_scores.append({"id_program": item.id, "nb_obs": item.nb_obs})
        total_obs = total_obs + item.nb_obs

    taxon_query = (
        ObservationModel.query.filter(ObservationModel.id_role == id)
        .group_by(ObservationModel.cd_nom)
        .values(
            ObservationModel.cd_nom,
            func.count(ObservationModel.cd_nom).label("nb_obs"),
        )
    )

    classes = {}
    families = {}
    for query in taxon_query:
        taxon = get_specie_from_cd_nom(cd_nom=query.cd_nom)
        class_ = taxon.get("classe", "")
        family = taxon.get("famille", "")
        if classes.get(class_) is not None:
            classes[class_] += query.nb_obs
        else:
            classes[class_] = query.nb_obs
        if families.get(family) is not None:
            families[family] += query.nb_obs
        else:
            families[family] = query.nb_obs

    for class_, total in classes.items():
        taxon_scores.append({"classe": class_, "nb_obs": total})
    for family, total in families.items():
        taxon_scores.append({"famille": family, "nb_obs": total})

    user = UserModel.query.filter(UserModel.id_user == id).one()
    result = user.as_secured_dict(True)
    user_date_create = result["timestamp_create"]
    user_date_create = datetime.strptime(user_date_create, "%Y-%m-%dT%H:%M:%S.%f")

    for reward in rewards:
        if reward["type"] == "all_attendance":
            id = 1
            for badge in reward["badges"]:
                if total_obs >= badge["min_obs"]:
                    badge["type"] = reward["type"]
                    badge["id"] = reward["type"] + "_" + str(id)
                    badge["reward_label"] = reward["reward_label"]
                    awarded_badges.append(badge)
                    id = id + 1

        if reward["type"] == "program_attendance":
            id = 1
            for program in program_scores:
                if program["id_program"] == reward["id_program"]:
                    for badge in reward["badges"]:
                        if program["nb_obs"] >= badge["min_obs"]:
                            badge["type"] = reward["type"]
                            badge["reward_label"] = reward["reward_label"]
                            badge["id_program"] = reward["id_program"]
                            badge["id"] = (
                                reward["type"]
                                + "_prog"
                                + str(reward["id_program"])
                                + "_"
                                + str(id)
                            )
                            awarded_badges.append(badge)
                            id = id + 1

        if reward["type"] == "seniority":
            for badge in reward["badges"]:
                id = 1
                if badge["min_date"].endswith("d"):
                    delta = (datetime.now() - user_date_create).days
                    if delta >= int(badge["min_date"][0:-1]):
                        badge["type"] = reward["type"]
                        badge["id"] = reward["type"] + "_" + str(id)
                        badge["reward_label"] = reward["reward_label"]
                        awarded_badges.append(badge)
                        id = id + 1
                if badge["min_date"].endswith("m"):
                    delta = monthdelta(user_date_create, datetime.now())
                    if delta >= int(badge["min_date"][0:-1]):
                        badge["type"] = reward["type"]
                        badge["id"] = reward["type"] + "_" + str(id)
                        badge["reward_label"] = reward["reward_label"]
                        awarded_badges.append(badge)
                        id = id + 1
                if badge["min_date"].endswith("y"):
                    delta = monthdelta(user_date_create, datetime.now()) / 12
                    if delta >= int(badge["min_date"][0:-1]):
                        badge["type"] = reward["type"]
                        badge["id"] = reward["type"] + "_" + str(id)
                        badge["reward_label"] = reward["reward_label"]
                        awarded_badges.append(badge)
                        id = id + 1

        if reward["type"] == "recognition":
            for taxon in taxon_scores:
                id = 1
                if "classe" in reward and "classe" in taxon:
                    if taxon["classe"] == reward["classe"]:
                        for badge in reward["badges"]:
                            if program["nb_obs"] >= badge["min_obs"]:
                                badge["type"] = reward["type"]
                                badge["id"] = reward["type"] + "_" + str(id)
                                badge["classe"] = reward["classe"]
                                badge["reward_label"] = reward["reward_label"]
                                awarded_badges.append(badge)
                                id = id + 1
                if "famille" in reward and "famille" in taxon:
                    if taxon["famille"] == reward["famille"]:
                        for badge in reward["badges"]:
                            if program["nb_obs"] >= badge["min_obs"]:
                                badge["type"] = reward["type"]
                                badge["id"] = reward["type"] + "_" + str(id)
                                badge["famille"] = reward["famille"]
                                badge["reward_label"] = reward["reward_label"]
                                awarded_badges.append(badge)
                                id = id + 1
    return jsonify(awarded_badges)


def monthdelta(d1, d2):
    delta = 0
    while True:
        mdays = monthrange(d1.year, d1.month)[1]
        d1 += timedelta(days=mdays)
        if d1 <= d2:
            delta += 1
        else:
            break
    return delta
