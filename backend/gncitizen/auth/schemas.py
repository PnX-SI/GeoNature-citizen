from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    surname = fields.Str()
    username = fields.Str()
    password = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    organism = fields.Str()
    admin = fields.Bool()
    creation_date = fields.DateTime(dump_only=True)


class RevokedTokenSchema(Schema):
    id = fields.Int(dump_only=True)
    jti = fields.Str()


user_schema = UserSchema()
users_schema = UserSchema(many=True, only=('id', 'name','surname','username', 'email', 'phone', 'organism'))
revoked_token_schema = RevokedTokenSchema()
revoked_tokens_schema = RevokedTokenSchema(many=True)
