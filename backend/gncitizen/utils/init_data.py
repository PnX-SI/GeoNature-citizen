#!/usr/bin/python
"""Init db datas"""

from flask import current_app

from gncitizen.core.commons.models import TModules


def create_schemas(db):
    """create db schemas at first launch

    :param db: db connection
    """
    current_app.logger.info("Create required schemas if not exists")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_core")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_obstax")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_sites")
    db.session.execute("CREATE SCHEMA IF NOT EXISTS gnc_areas")
    db.session.commit()


def populate_modules(db):
    if (
        db.session.query(TModules)
        .filter(TModules.label == "observations")
        .count()
        == 0
    ):
        current_app.logger.info('Insert "Observations" into modules table')
        data = {
            "id_module": 1,
            "name": "observations",
            "label": "observations",
            "desc": "Module d'observations taxonomiques",
        }
        m = TModules(**data)
        db.session.add(m)
        db.session.commit()
    if (
        db.session.query(TModules).filter(TModules.label == "sites").count()
        == 0
    ):
        current_app.logger.info('Insert "Sites" into modules table')
        data = {
            "id_module": 2,
            "name": "sites",
            "label": "sites",
            "desc": "Module d'inventaires et de suivis de sites",
        }
        m = TModules(**data)
        db.session.add(m)
        db.session.commit()
    if db.session.query(TModules).filter(TModules.name == "areas").count() == 0:
        current_app.logger.info('Insert "Areas" into modules table')
        data = {
            "id_module": 3,
            "name": "areas",
            "label": "Zones de sites liés à une espèce",
            "desc": "Module d'observations de stades sur des sites liés à une espèce dans une zone déterminée",
        }
        m = TModules(**data)
        db.session.add(m)
        db.session.commit()
