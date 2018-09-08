from marshmallow import Schema, fields


class BibNomsSchema(Schema):
    cd_nom = fields.Integer()
    cd_ref = fields.Integer()
    nom_francais = fields.String()
    comments = fields.String()


class BibListesSchema(Schema):
    id_liste = fields.Integer()
    nom_liste = fields.String()
    desc_liste = fields.String()
    picto = fields.String()
    regne = fields.String()
    group2_inpn = fields.String()


bib_nom_schema = BibNomsSchema()
bib_noms_schema = BibNomsSchema(many=True)
bib_liste_schema = BibListesSchema()
bib_listes_schema = BibListesSchema(many=True)


class CorNomListeSchema(Schema):
    bib_liste = fields.Nested(BibListesSchema)
    bib_nom = fields.Nested(BibNomsSchema)


cor_nom_liste_schema = CorNomListeSchema()
cor_nom_listes_schema = CorNomListeSchema(many=True)
