from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str()
    password = fields.Str()
    email = fields.Str()
    admin = fields.Bool()


class RevokedTokenSchema(Schema):
    id = fields.Int(dump_only=True)
    jti = fields.Str()


user_schema = UserSchema()
users_schema = UserSchema(many=True, only=('id', 'username', 'email'))
revoked_token_schema = RevokedTokenSchema()
revoked_tokens_schema = RevokedTokenSchema(many=True)
