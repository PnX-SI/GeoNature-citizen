from flask import jsonify, request, Blueprint
from flask_jwt_extended import (create_access_token, create_refresh_token, get_raw_jwt, jwt_refresh_token_required, \
                                jwt_required, get_jwt_identity)

from server import db
from .models import UserModel, RevokedTokenModel
from .schemas import user_schema

auth_url = Blueprint('auth_url', __name__)


@auth_url.route('/registration', methods=['POST'])
def registration():
    """
    Enregistrement de l'utilisateur
    Utiliser le décorateur `@get_jwt_identity()`
    pour avoir l'identité de l'utilisateur courant. Exemple:

    ``` python
    @auth_url.route('/protected', methods=['GET'])
    @jwt_required
    def protected():
        # Access the identity of the current user with get_jwt_identity
        current_user = get_jwt_identity()
        return jsonify(current_suer=current_user), 200
    ```

    """
    json_data = request.get_json()
    if not json_data:
        return jsonify({'message': 'No input data provided'}), 400
    # Validate and deserialize input
    try:
        data, errors = user_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422
    name, surname, username, password, email = data['name'], data['surname'], data['username'], data['password'], data[
        'email']
    if UserModel.find_by_username(data['username']):
        return jsonify({'message': 'L\'utilisateur {} éxiste déjà'.format(username)}), 400
    new_user = UserModel(
        name=name,
        surname=surname,
        username=username,
        password=UserModel.generate_hash(password),
        email=email
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        access_token = create_access_token(identity=username)
        refresh_token = create_refresh_token(identity=username)
        data_json = {
            'message': 'Félicitations, l\'utilisateur <b>{}</b> a été créé'.format(username),
            'access_token': access_token,
            'refresh_token': refresh_token
        }
        return jsonify(data_json), 200
    except:
        return jsonify({'message': 'Quelque chose s\'est mal déroulé'}), 500


@auth_url.route('/login', methods=['POST'])
def login():
    """
    Connexion de l'utilisateur
    """
    json_data = request.get_json()
    if not json_data:
        return jsonify({'message': 'No input data provided'}), 400
    # Validate and deserialize input
    try:
        data, errors = user_schema.load(json_data)
        print('username', data['username'])
    except:
        return jsonify({'message': 'Problème utilisation params'}), 400

    username, password = data['username'], data['password']

    if not username:
        return jsonify({"msg": "Missing username parameter"}), 400
    if not password:
        return jsonify({"msg": "Missing password parameter"}), 400

    current_user = UserModel.find_by_username(data['username'])
    if not current_user:
        return jsonify({'message': 'User {} doesn\'t exist'.format(data['username'])}), 400
    if UserModel.verify_hash(password, current_user.password):
        access_token = create_access_token(identity=data['username'])
        refresh_token = create_refresh_token(identity=data['username'])
        return jsonify({
            'message': 'Logged in as {}'.format(current_user.username),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    else:
        return jsonify({'message': 'Wrong credentials'}), 401


@auth_url.route('/logout', methods=['POST'])
@jwt_refresh_token_required
def logout():
    """
    Déconnexion de l'utilisateur
    """
    jti = get_raw_jwt()['jti']
    try:
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.add()
        return {'message': 'Refresh token has been revoked'}
    except:
        return {'message': 'Something went wrong'}, 500


@auth_url.route('/token_refresh', methods=['POST'])
@jwt_refresh_token_required
def token_refresh():
    """
    Renouvellemnet de l'access_token de l'utilisateur
    """
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return {'access_token': access_token}


@auth_url.route('/allusers', methods=['GET'])
@jwt_required
def get_allusers():
    """
    Affichage de la liste des utilisateurs
    """
    return jsonify(UserModel.return_all()), 200


@auth_url.route('/allusers', methods=['DELETE'])
@jwt_required
def del_allusers():
    """
    Suppression de tous les utilisateurs
    """
    return jsonify(UserModel.delete_all()), 200


@auth_url.route('/logged_user', methods=['GET'])
@jwt_required
def logged_user():
    """
    Get main informations of current logged user
    :return:
    """
    current_user = get_jwt_identity()
    print(type(current_user))
    user = user_schema.dump(UserModel.query.filter_by(username=current_user).first())
    return jsonify(user=user), 200
