from flask import Flask, request, Blueprint, Response, jsonify, current_app
from gncitizen.utils.sqlalchemy import json_resp
from gncitizen.core.observations.models import ObservationModel
from gncitizen.core.commons.models import ProgramsModel
from gncitizen.core.users.models import UserModel
from gncitizen.core.taxonomy.models import Taxref
from sqlalchemy.sql.expression import func
from datetime import date, datetime, timedelta
from calendar import monthrange
from server import db

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
    taxon_classe_query = (
        db.session.query(
            Taxref.classe.label("classe"), func.count(Taxref.famille).label("nb_obs")
        )
        .join(ObservationModel, Taxref.cd_nom == ObservationModel.cd_nom)
        .filter(ObservationModel.id_role == id)
        .group_by(Taxref.classe)
    )
    for item in taxon_classe_query:
        taxon_scores.append({"classe": item.classe, "nb_obs": item.nb_obs})

    taxon_famille_query = (
        db.session.query(
            Taxref.famille.label("famille"), func.count(Taxref.famille).label("nb_obs")
        )
        .join(ObservationModel, Taxref.cd_nom == ObservationModel.cd_nom)
        .filter(ObservationModel.id_role == id)
        .group_by(Taxref.famille)
    )

    for item in taxon_famille_query:
        taxon_scores.append({"famille": item.famille, "nb_obs": item.nb_obs})

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


@badges_api.route("/stats", methods=["GET"])
@json_resp
def get_stat():
    try:
        stats = {}
        stats["nb_obs"] = ObservationModel.query.count()
        stats["nb_user"] = UserModel.query.count()
        stats["nb_program"] = ProgramsModel.query.filter(
            ProgramsModel.is_active == True
        ).count()
        stats["nb_espece"] = ObservationModel.query.distinct(
            ObservationModel.cd_nom
        ).count()
        return (stats, 200)
    except Exception as e:
        current_app.logger.critical("[get_observations] Error: %s", str(e))
        return {"message": str(e)}, 400
