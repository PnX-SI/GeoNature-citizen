from sqlalchemy import ForeignKey

from gncitizen.utils.sqlalchemy import serializable
from server import db


@serializable
class BibNoms(db.Model):
    __tablename__ = 'bib_noms'
    __table_args__ = {'schema': 'taxonomie', 'extend_existing': True}
    id_nom = db.Column(db.Integer, primary_key=True)
    cd_nom = db.Column(
        db.Integer,
        nullable=True, unique=True
    )
    cd_ref = db.Column(db.Integer)
    nom_francais = db.Column(db.Unicode)
    comments = db.Column(db.Unicode)


@serializable
class BibListes(db.Model):
    __tablename__ = 'bib_listes'
    __table_args__ = {'schema': 'taxonomie', 'extend_existing': True}
    id_liste = db.Column(db.Integer, primary_key=True)
    nom_liste = db.Column(db.Unicode)
    desc_liste = db.Column(db.Text)
    picto = db.Column(db.Unicode)
    regne = db.Column(db.Unicode)
    group2_inpn = db.Column(db.Unicode)

    # cnl = db.relationship("CorNomListe", lazy='select')

    def __repr__(self):
        return '<BibListes %r>' % self.nom_liste


@serializable
class CorNomListe(db.Model):
    __tablename__ = 'cor_nom_liste'
    __table_args__ = {'schema': 'taxonomie', 'extend_existing': True}
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
    bib_nom = db.relationship('BibNoms')
    bib_liste = db.relationship('BibListes')

    def __repr__(self):
        return '<CorNomListe %r>' % self.id_liste

    # listes = db.relationship("CorNomListe", lazy='select')
    # medias = db.relationship("TMedias", lazy='select')
    #


@serializable
class TMedias(db.Model):
    __tablename__ = 't_medias'
    __table_args__ = {'schema': 'taxonomie', 'extend_existing': True}
    id_media = db.Column(db.Integer, primary_key=True)
    cd_ref = db.Column(
        db.Integer,
        ForeignKey("taxonomie.bib_noms.cd_ref"),
        nullable=False,
        primary_key=False
    )
    titre = db.Column(db.Unicode)
    url = db.Column(db.Unicode)
    chemin = db.Column(db.Unicode)
    auteur = db.Column(db.Unicode)
    desc_media = db.Column(db.Text)
    is_public = db.Column(db.BOOLEAN)
    supprime = db.Column(db.BOOLEAN)
    id_type = db.Column(db.Integer)
    source = db.Column(db.Text)
    licence = db.Column(db.Text)

    def __repr__(self):
        return '<TMedias %r>' % self.titre


@serializable
class Taxref(db.Model):
    __tablename__ = 'taxref'
    __table_args__ = {'schema': 'taxonomie'}
    cd_nom = db.Column(db.Integer, primary_key=True)
    id_statut = db.Column(db.Unicode)
    id_habitat = db.Column(db.Integer)
    id_rang = db.Column(db.Unicode)
    regne = db.Column(db.Unicode)
    phylum = db.Column(db.Unicode)
    classe = db.Column(db.Unicode)
    ordre = db.Column(db.Unicode)
    famille = db.Column(db.Unicode)
    sous_famille = db.Column(db.Unicode)
    tribu = db.Column(db.Unicode)
    cd_taxsup = db.Column(db.Integer)
    cd_sup = db.Column(db.Integer)
    cd_ref = db.Column(db.Integer)
    lb_nom = db.Column(db.Unicode)
    lb_auteur = db.Column(db.Unicode)
    nom_complet = db.Column(db.Unicode)
    nom_complet_html = db.Column(db.Unicode)
    nom_vern = db.Column(db.Unicode)
    nom_valide = db.Column(db.Unicode)
    nom_vern_eng = db.Column(db.Unicode)
    group1_inpn = db.Column(db.Unicode)
    group2_inpn = db.Column(db.Unicode)
    url = db.Column(db.Unicode)

    def __repr__(self):
        return '<Taxref %r>' % self.nom_complet
