from server import db
from sqlalchemy import ForeignKey


class BibNoms(db.Model):
    __tablename__ = 'bib_noms'
    __table_args__ = {'schema': 'taxonomie'}
    id_nom = db.Column(db.Integer, primary_key=True)
    cd_nom = db.Column(
        db.Integer,
        ForeignKey("taxonomie.taxref.cd_nom"),
        nullable=True, unique=True
    )
    cd_ref = db.Column(db.Integer)
    nom_francais = db.Column(db.Unicode)
    comments = db.Column(db.Unicode)

    taxref = db.Column(Integer)
    attributs = db.Column(Integer)
    listes = db.Column(Integer)
    medias = db.Column(Integer)


class CorNomListe(db.Model):
    __tablename__ = 'cor_nom_liste'
    __table_args__ = {'schema': 'taxonomie'}
    id_liste = db.Column(
        db.Integer,
        ForeignKey("taxonomie.bib_listes.id_liste"),
        nullable=False,
        primary_key=True
    )
    id_nom = db.Column(
        db.Integer,
        ForeignKey("taxonomie.bib_noms.id_nom"),
        nullable=False,
        primary_key=True
    )
    bib_nom = db.relationship("BibNoms")
    bib_liste = db.relationship("BibListes")

    def __repr__(self):
        return '<CorNomListe %r>' % self.id_liste


class BibListes(db.Model)
    __tablename__ = 'bib_listes'
    __table_args__ = {'schema': 'taxonomie'}
    id_liste = db.Column(db.Integer, primary_key=True)
    nom_liste = db.Column(db.Unicode)
    desc_liste = db.Column(db.Text)
    picto = db.Column(db.Unicode)
    regne = db.Column(db.Unicode)
    group2_inpn = db.Column(db.Unicode)
    cnl = db.relationship("CorNomListe", lazy='select')

    def __repr__(self):
        return '<BibListes %r>' % self.nom_liste
