import logging
from gncitizen.core.observations.models import (
    # ObservationMediaModel,
    ObservationModel,
)
from gncitizen.core.users.models import (
    # ObserverMixinModel,
    # UserGroupsModel,
    # GroupsModel,
    UserModel,
)
from gncitizen.core.taxonomy.models import (
    # BibNoms,
    # BibListes,
    # CorNomListe,
    # TMedias,
    Taxref,
)
from .models import recognition_model

from gncitizen.core.commons.models import (
    #     MediaModel,
    ProgramsModel,
)

logger = logging.getLogger()

# TEST DATA
# id_role = UserModel.id_user
role_id = 7
program_id = 1
taxo_list_id = 55

# Platform Attendance:
# Count observations the current user submitted platform wise
attendance_data = ObservationModel.query.filter(ObservationModel.id_role == role_id)

# platform_attendance = attendance_data.count()

# Program Attendance
# Count observations the current user submitted Program wise
# logging.warning(attendance_data.count().group_by(ObservationModel.id_program).all())
# from sqlalchemy import func

# logging.warning(
#     ObservationModel.query.with_entities(
#         ObservationModel.id_program,
#         # func.count(ObservationModel.id_program)
#     )
#     .group_by(ObservationModel.id_observation, ObservationModel.id_program)
#     .order_by(ObservationModel.id_program)
#     .all()
# )
# programs = ProgramsModel.query.distinct(ProgramsModel.id_program)
program_attendance = [
    attendance_data.filter(ObservationModel.id_program == program.id_program)
    for program in ProgramsModel.query.distinct(ProgramsModel.id_program).all()
]
logging.warning("program_attendance: %s", program_attendance)

# Seniority:
seniority_data = UserModel.query.filter(UserModel.id_user == role_id)


# RECOGNITION
def filter_class_or_order(model, query):
    # print("filter_class_or_order: {}".format(model))
    criterion = "classe" if "class" in model else "ordre"
    return query.filter(
        getattr(Taxref, criterion)
        == model["class" if "class" in model else "order"].capitalize()
    )


def get_occ():
    # base_query = ObservationModel.query.join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    base_query = attendance_data.join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    # .filter(
    #     ObservationModel.id_role == role_id,
    #     ObservationModel.id_program == program_id
    # )
    filtered = [
        filter_class_or_order(item, base_query).count() for item in recognition_model
    ]

    debug_struct = {}
    for i, f in zip(recognition_model, filtered):
        debug_struct.update({"item": i["specialization"], "count": f})
        logging.critical("item: %s", debug_struct)

    return filtered


def get_stats():
    return {
        "seniority": seniority_data,
        "attendance": attendance_data,
        "program_attendance": program_attendance,
        # Program date bounds
        # Mission Success
        "get_occ": get_occ,
    }
