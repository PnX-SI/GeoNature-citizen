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


def attendance_data(role_id):
    """Platform Attendance: count observations the current user submitted platform wise."""
    return ObservationModel.query.filter(ObservationModel.id_role == role_id)


# Program Attendance
# Count observations the current user submitted program wise
def program_attendance(attendance_data):
    return [
        attendance_data.filter(ObservationModel.id_program == program.id_program)
        for program in ProgramsModel.query.distinct(ProgramsModel.id_program).all()
    ]


# Seniority:
def seniority_data(id):
    return UserModel.query.filter(UserModel.id_user == id)


# Specialism Recognition
def filter_class_or_order(model, query):
    criterion = "classe" if "class" in model else "ordre"
    return query.filter(
        getattr(Taxref, criterion)
        == model["class" if "class" in model else "order"].capitalize()
    )


def get_occ(attendance_data):
    base_query = attendance_data.join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    # .filter(
    #     ObservationModel.id_role == role_id,
    #     ObservationModel.id_program == program_id
    # )
    return [
        filter_class_or_order(item, base_query).count() for item in recognition_model
    ]


def get_stats(id):
    return {
        "seniority": seniority_data,
        "attendance": attendance_data,
        "program_attendance": program_attendance,
        # Program date bounds
        # Mission Success
        "get_occ": get_occ,
    }
