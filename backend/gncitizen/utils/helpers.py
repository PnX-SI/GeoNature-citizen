"""Some useful helpers"""
from flask import url_for
from sqlalchemy.engine.row import Row


def set_media_links(item: Row) -> dict:
    """Set media urls on API

    Args:
        item (Row): media query item

    Returns:
        dict: media item as dict with urls
    """
    m = item._asdict()
    m["media_url"] = url_for("commons.get_media", filename=item.filename)
    data_url = None
    id_data_source = item.id_data_source if item.type_program == "observations" else item.id_site
    if item.type_program:
        data_url = f"/programs/{item.id_program}/{item.type_program}/{id_data_source}"

    m["data_url"] = data_url
    return m
