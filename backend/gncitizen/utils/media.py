#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""A module to manage medias"""

import datetime
import os
import base64

from flask import current_app
from werkzeug.datastructures import FileStorage

from gncitizen.core.commons.models import MediaModel
from gncitizen.utils.env import ALLOWED_EXTENSIONS, MEDIA_DIR
from gncitizen.utils.errors import GeonatureApiError
from server import db


def allowed_file(filename):
    """Check if uploaded file type is allowed

    :param filename: file name
    :type filename: str

    :return: boolean value, true if filename is allowed else false

    :rtype: bool
    """
    if (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    ):
        return True


def save_upload_files(
    request_file,
    prefix="none",
    cdnom="0",
    id_data_source=None,
    matching_model=None,
):
    """Save files on server and filenames in db from POST request

    for each files in flask request.files, this function does:

        * verify if file type is in allowed medias
        * generate a filename from ``prefix``, ``cdnom``, ``index``, ``timestamp``
        * save file in ``./media`` dir
        * save filename in MediaModel and then in a matching media model


    :param request_file: request files from post request.
    :type request_file: function
    :param prefix: filename prefix
    :type prefix: str
    :param cdnom: species id from taxref cdnom
    :type cdnom: int
    :param id_data_source: source id in matching model
    :type id_data_source: int
    :param matching_model: matching model of observation (eg: ``ObservationMediaModel`` or ``SiteMediaModel``)
    :type matching_model: class

    :returns: a filename list
    :rtype: list

    """
    files = []
    try:
        i = 0
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        if not isinstance(request_file, list):
            request_file = request_file.getlist("file")

        for file in request_file:
            new_filename = None

            if isinstance(file, FileStorage):
                i = i + 1
                filename = file.filename
                current_app.logger.debug(
                    "[save_upload_files] {} is an allowed filename : {}".format(
                        filename, allowed_file(filename)
                    )
                )

                if allowed_file(filename):
                    # save file
                    current_app.logger.debug(
                        '[save_upload_files] Preparing file "{}" saving'.format(
                            filename
                        )
                    )
                    ext = filename.rsplit(".", 1)[1].lower()

                    new_filename = "{}_{}_{}_{}.{}".format(
                        prefix, str(cdnom), i, timestamp, ext
                    )

                    current_app.logger.debug(
                        "[save_upload_files] new filename : {}".format(
                            new_filename)
                    )
                    file.save(os.path.join(str(MEDIA_DIR), new_filename))

            if isinstance(file, str) and file.startswith("data:image/"):
                i = i + 1

                if file.startswith("data:image/png;base64,"):
                    extension = "png"
                if file.startswith("data:image/jpeg;base64,"):
                    extension = "jpeg"

                new_filename = "{}_{}_{}_{}.{}".format(
                    prefix, str(cdnom), i, timestamp, extension
                )

                current_app.logger.debug(
                    "[save_upload_files] newfilename : {}".format(new_filename)
                )

                img_data = base64.b64decode(
                    file.replace(
                        "data:image/" + extension + ";base64,", ""
                    )
                )
                try:
                    handler = open(os.path.join(str(MEDIA_DIR), str(new_filename)), "wb+")
                    handler.write(img_data)
                    handler.close()
                except Exception as e:
                    current_app.logger.debug(
                        "[save_upload_files] ERROR DATA64 UPLOAD: {}".format(e)
                    )
                    return (
                        {"message": e},
                        500,
                    )

            if new_filename is not None:
                # Save media filename to Database
                try:
                    newmedia = MediaModel(filename=new_filename)
                    current_app.logger.debug(
                        "[save_upload_files] newmedia {}".format(newmedia)
                    )
                    db.session.add(newmedia)
                    db.session.commit()
                    id_media = newmedia.id_media
                    current_app.logger.debug(
                        "[save_upload_files] id_media : ".format(
                            str(id_media)
                        )
                    )
                    # return id_media
                except Exception as e:
                    current_app.logger.debug(
                        "[save_upload_files] ERROR MEDIAMODEL: {}".format(
                            e
                        )
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
                    current_app.logger.debug(
                        "[save_upload_files] id_match {}".format(id_match)
                    )
                except Exception as e:
                    current_app.logger.debug(
                        "[save_upload_files] ERROR MATCH MEDIA: {}".format(
                            e
                        )
                    )
                    raise GeonatureApiError(e)

                # log
                current_app.logger.debug(
                    "[save_upload_files] Fichier {} enregistré".format(
                        new_filename
                    )
                )
                files.append(new_filename)

    except Exception as e:
        current_app.logger.debug(
            "[save_upload_files] ERROR save_upload_file : {}".format(e)
        )
        raise GeonatureApiError(e)

    return files
