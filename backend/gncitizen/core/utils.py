from flask_jwt_extended import get_jwt_identity

from gncitizen.auth.models import UserModel


def get_id_role_if_exists():
    if get_jwt_identity() is not None:
        current_user = get_jwt_identity()
        id_role = UserModel.query.filter_by(username=current_user).first().id_user
    else:
        id_role = None
    return id_role


def must_not_be_blank(data):
    if not data:
        raise ValidationError('Data not provided.')
