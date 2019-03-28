import datetime
from sqlalchemy import func

from server import db
from gncitizen.core.commons.models import MediaModel, ProgramsModel
from gncitizen.observations.models import ObservationModel, ObservationMediaModel
from gncitizen.taxonomy.models import BibNoms, BibListes, CorNomListe, TMedias, Taxref
from gncitizen.user.models import (
    UserModel,
    GroupsModel,
    UserGroupsModel,
    ObserverMixinModel,
)

# id_role = UserModel.id_user
role_id = 5
program_id = 3

# Platform Attendance:
# Count observations the current user submitted platform wise
# ObservationModel.id_role
attendance_data = db.session.query(func.count(ObservationModel.id_role)).filter_by(
    ObservationModel.id_role == role_id
)

platform_attendance = attendance_data.all()
# Program Attendance
# Count observations the current user submitted Program wise
# ObservationModel.id_role, ObservationModel.id_program == program_id
program_attendance = attendance_data.filter_by(
    ObservationModel.id_program == program_id
).all()

# Seniority:
# UserModel.timestamp_create
seniority_data = (
    db.session.query(UserModel.timestamp_create)
    .filter_by(UserModel.id_user == role_id)
    .first()
)


# Taxon Distance
reference_taxa_data = (
    db.session.query(BibNoms, Taxref)
    .distinct(BibNoms.cd_ref)
    .join(CorNomListe, CorNomListe.id_nom == BibNoms.id_nom)
    .join(Taxref, Taxref.cd_ref == BibNoms.cd_ref)
    .filter(CorNomListe.id_liste == id)
    .all()
)
reference_taxa_list = [
    {"nom": d[0].as_dict(), "taxref": d[1].as_dict()} for d in reference_taxa_data
]
# except Exception as e:
#     ...


result = {
    "seniority": datetime.datetime.fromtimestamp(seniority_data),
    "platform_attendance": platform_attendance,
    "program_attendance": program_attendance,
    "reference_taxa_list": reference_taxa_list,
    # Program date bounds
    # Mission Success
}
print(result)
