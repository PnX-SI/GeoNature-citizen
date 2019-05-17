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

# from gncitizen.core.commons.models import (
#     MediaModel,
#     ProgramsModel
# )

logger = logging.getLogger()
# id_role = UserModel.id_user
role_id = 4
program_id = 1
taxo_list_id = 55

# Platform Attendance:
# Count observations the current user submitted platform wise
attendance_data = ObservationModel.query.filter(ObservationModel.id_role == role_id)

platform_attendance = attendance_data.count()

# Program Attendance
# Count observations the current user submitted Program wise
program_attendance = attendance_data.filter(
    ObservationModel.id_program == program_id
).count()

# Seniority:
seniority_data = (
    UserModel.query.filter(UserModel.id_user == role_id)
    .one()
    .timestamp_create.timestamp()
)


# RECOGNITION
def filter_class_or_order(model, query):
    print("filter_class_or_order: {}".format(model))
    criterion = "classe" if "class" in model else "ordre"
    return query.filter(
        getattr(Taxref, criterion)
        == model["class" if "class" in model else "order"].capitalize()
    ).count()


def get_occ_count(taxon):
    # base_query = ObservationModel.query.join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    base_query = attendance_data.join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    # .filter(
    #     ObservationModel.id_role == role_id,
    #     ObservationModel.id_program == program_id
    # )
    return [filter_class_or_order(item, base_query) for item in recognition_model]


results = {
    "seniority": seniority_data,
    "attendance": platform_attendance,
    "program_attendance": program_attendance,
    # Program date bounds
    # Mission Success
    # "recognition": recognition,
    "get_occ_count": get_occ_count,
}
