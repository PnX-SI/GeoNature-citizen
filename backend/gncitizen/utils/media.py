#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import datetime
import os

from flask import current_app, request

from gncitizen.core.commons.models import MediaModel
from gncitizen.utils.env import MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from gncitizen.utils.env import ALLOWED_EXTENSIONS
from server import db


def allowed_file(filename):
    if (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    ):
        return True


def save_upload_file(
    request_file,
    prefix="none",
    cdnom="0",
    id_data_source=None,
    matching_model=None,
):
    """Save on server and db a single file from POST request"""
    print("test")
    filename, id_media, id_match = None, None, None
    if "file" in request_file:
        file = request.files["file"]
        current_app.logger.debug(file)
        current_app.logger.debug(
            "Allowed filename :", allowed_file(file.filename)
        )
        if allowed_file(file.filename):
            # save file
            current_app.logger.debug(
                "Préparation de l'enregistrement de ".format(filename)
            )
            ext = file.rsplit(".", 1).lower()
            current_app.logger.debug("File extension :".format(filename))
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = "obstax" + "_" + cdnom + "_" + timestamp + "." + ext
            file.save(os.path.join(str(MEDIA_DIR), filename))
            # Save media filename to Database
            try:
                newmedia = MediaModel(filename=filename)
                db.session.add(newmedia)
                db.session.commit()
                id_media = newmedia.id_media
                current_app.logger.debug("id_media : ", id_media)
                return id_media
            except Exception as e:
                current_app.logger.debug(e)
                raise GeonatureApiError(e)
            # Save id_media in matching table
            try:
                matchingids = {
                    "id_media": id_media,
                    "id_data_source": id_data_source,
                }
                newmatch = matching_model(matchingids)
                db.session.add(newmatch)
                db.session.commit()
                id_match = newmatch.id_match
                return id_match
            except Exception as e:
                current_app.logger.debug(e)
                raise GeonatureApiError(e)

            # log
            current_app.logger.debug("Fichier {} enregistré".format(filename))

    return filename, id_media, id_match


def save_upload_files():
    pass
