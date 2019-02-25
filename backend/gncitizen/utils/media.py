#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import datetime
import os

from flask import current_app, request
from werkzeug import FileStorage

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


# def save_upload_file(
#     request_file,
#     prefix="none",
#     cdnom="0",
#     id_data_source=None,
#     matching_model=None,
# ):
#     """Save on server and db a single file from POST request"""
#     filename, id_media, id_match = None, None, None
#     try:
#         if "file" in request_file:
#             file = request.files["file"]
#             filename = file.filename
#             current_app.logger.debug(
#                 "{} is an allowed filename : {}".format(
#                     filename, allowed_file(filename)
#                 )
#             )
#             files = []
#             if allowed_file(filename):
#                 # save file
#                 current_app.logger.debug(
#                     'Preparing file "{}" saving'.format(filename)
#                 )
#                 ext = filename.rsplit(".", 1)[1].lower()
#                 timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
#                 filename = "obstax_{}_{}.{}".format(str(cdnom), timestamp, ext)
#                 current_app.logger.debug("new filename : {}".format(filename))
#                 file.save(os.path.join(str(MEDIA_DIR), filename))
#                 # Save media filename to Database
#                 try:
#                     newmedia = MediaModel(filename=filename)
#                     current_app.logger.debug("newmedia {}".format(newmedia))
#                     db.session.add(newmedia)
#                     db.session.commit()
#                     id_media = newmedia.id_media
#                     current_app.logger.debug(
#                         "id_media : ".format(str(id_media))
#                     )
#                     # return id_media
#                 except Exception as e:
#                     current_app.logger.debug("ERROR MEDIAMODEL: {}".format(e))
#                     raise GeonatureApiError(e)
#                 # Save id_media in matching table
#                 try:
#                     newmatch = matching_model(
#                         id_media=id_media, id_data_source=id_data_source
#                     )
#                     db.session.add(newmatch)
#                     db.session.commit()
#                     id_match = newmatch.id_match
#                     current_app.logger.debug("id_match {}".format(id_match))
#                 except Exception as e:
#                     current_app.logger.debug("ERROR MATCH MEDIA: {}".format(e))
#                     raise GeonatureApiError(e)

#                 # log
#                 current_app.logger.debug(
#                     "Fichier {} enregistré".format(filename)
#                 )

#     except Exception as e:
#         current_app.logger.debug("ERROR save_upload_file : {}".format(e))
#         raise GeonatureApiError(e)

#     files.append(filename)

#     return files


def save_upload_files(
    request_file,
    prefix="none",
    cdnom="0",
    id_data_source=None,
    matching_model=None,
):
    """Save on server and db a single file from POST request"""
    files = []
    try:
        i = 0
        for file in request_file.getlist("file"):
            if isinstance(file, FileStorage):
                i = i + 1
                filename = file.filename
                current_app.logger.debug(
                    "{} is an allowed filename : {}".format(
                        filename, allowed_file(filename)
                    )
                )

                if allowed_file(filename):
                    # save file
                    current_app.logger.debug(
                        'Preparing file "{}" saving'.format(filename)
                    )
                    ext = filename.rsplit(".", 1)[1].lower()
                    timestamp = datetime.datetime.now().strftime(
                        "%Y%m%d_%H%M%S"
                    )
                    filename = "{}_{}_{}_{}.{}".format(
                        prefix, str(cdnom), i, timestamp, ext
                    )
                    current_app.logger.debug(
                        "new filename : {}".format(filename)
                    )
                    file.save(os.path.join(str(MEDIA_DIR), filename))
                    # Save media filename to Database
                    try:
                        newmedia = MediaModel(filename=filename)
                        current_app.logger.debug("newmedia {}".format(newmedia))
                        db.session.add(newmedia)
                        db.session.commit()
                        id_media = newmedia.id_media
                        current_app.logger.debug(
                            "id_media : ".format(str(id_media))
                        )
                        # return id_media
                    except Exception as e:
                        current_app.logger.debug(
                            "ERROR MEDIAMODEL: {}".format(e)
                        )
                        raise GeonatureApiError(e)
                    # Save id_media in matching table
                    try:
                        newmatch = matching_model(
                            id_media=id_media, id_data_source=id_data_source
                        )
                        db.session.add(newmatch)
                        db.session.commit()
                        id_match = newmatch.id_match
                        current_app.logger.debug("id_match {}".format(id_match))
                    except Exception as e:
                        current_app.logger.debug(
                            "ERROR MATCH MEDIA: {}".format(e)
                        )
                        raise GeonatureApiError(e)

                    # log
                    current_app.logger.debug(
                        "Fichier {} enregistré".format(filename)
                    )
                    files.append(filename)

    except Exception as e:
        current_app.logger.debug("ERROR save_upload_file : {}".format(e))
        raise GeonatureApiError(e)

    return files
