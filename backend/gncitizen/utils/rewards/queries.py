# import datetime
from sqlalchemy import func

from server import db

# from gncitizen.core.commons.models import (
#     MediaModel,
#     ProgramsModel
# )
from gncitizen.core.observations.models import (
    # ObservationMediaModel,
    ObservationModel,
)
from gncitizen.core.taxonomy.models import (
    BibNoms,
    # BibListes,
    CorNomListe,
    # TMedias,
    Taxref,
)
from gncitizen.core.users.models import (
    # ObserverMixinModel,
    # UserGroupsModel,
    # GroupsModel,
    UserModel,
)

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


# Taxon Distance
reference_taxa_list = [
    {"nom": d[0].as_dict(), "taxref": d[1].as_dict()}
    for d in db.session.query(BibNoms, Taxref)
    .distinct(BibNoms.cd_ref)
    .join(CorNomListe, CorNomListe.id_nom == BibNoms.id_nom)
    .join(Taxref, Taxref.cd_ref == BibNoms.cd_ref)
    .filter(CorNomListe.id_liste == taxo_list_id)
    .all()
]
# except Exception as e:
#     ...


results = {
    "seniority": seniority_data,
    "attendance": platform_attendance,
    "program_attendance": program_attendance,
    "reference_taxa_list": reference_taxa_list
    # Program date bounds
    # Mission Success
}
