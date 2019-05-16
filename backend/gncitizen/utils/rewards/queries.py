from sqlalchemy import func, or_

from server import db
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
    BibNoms,
    # BibListes,
    CorNomListe,
    # TMedias,
    Taxref,
)
from .models import recognition_model

# from gncitizen.core.commons.models import (
#     MediaModel,
#     ProgramsModel
# )

# id_role = UserModel.id_user
role_id = 5
program_id = 2
taxo_list_id = 55

# Platform Attendance:
# Count observations the current user submitted platform wise
attendance_data = db.session.query(func.count(ObservationModel.id_role)).filter(
    ObservationModel.id_role == role_id
)

platform_attendance = attendance_data.all()[0][0]

# Program Attendance
# Count observations the current user submitted Program wise
program_attendance = attendance_data.filter(
    ObservationModel.id_program == program_id
).all()[0][0]

# Seniority:
seniority_data = (
    db.session.query(UserModel.timestamp_create)
    .filter(UserModel.id_user == role_id)
    .first()[0]
).timestamp()

# RECOGNITION
my_count = (
    db.session.query(ObservationModel)
    .join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
    .filter(ObservationModel.id_role == role_id)
    .count()
)
# ObservationModel.id_program == program_id,
# or_(
#     taxon["classe"].lower() == recognition_model[i]["class"],
#     taxon["ordre"].lower() == recognition_model[i]["order"],
# ),
# .values(func.count(ObservationModel.id_role), Taxref.classe, Taxref.ordre)


def counts(taxon):
    # return [
    # attendance_data.filter(
    r1 = (
        db.session.query(ObservationModel)
        .join(Taxref, Taxref.cd_nom == ObservationModel.cd_nom)
        .filter(
            ObservationModel.id_role == role_id,
            # ObservationModel.id_program == program_id,
        )
    )

    def r2(model):
        print(model)
        return r1.filter(
            Taxref.classe == model["class"].capitalize(),
            # or_(
            #     str(Taxref.classe).lower() == recognition_model[i]["class"],
            #     str(Taxref.ordre).lower() == recognition_model[i]["order"],
            # )
        ).count()

    # for i, item in enumerate(recognition_model)
    print("recognition:", r2)
    return [r2(item) for item in recognition_model]


results = {
    "seniority": seniority_data,
    "attendance": platform_attendance,
    "program_attendance": program_attendance,
    # Program date bounds
    # Mission Success
    # "recognition": my_count,
    "recognition": counts({"classe": "Aves", "ordre": "Passeriformes"}),
}
