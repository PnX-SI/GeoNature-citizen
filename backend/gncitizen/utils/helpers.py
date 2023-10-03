"""Some useful helpers"""
from typing import Optional

from flask import url_for
from sqlalchemy.engine.row import Row


def to_int(val: Optional[str]) -> Optional[int]:
    """Check and return int value from string

    Args:
        val (str | None): String value or None

    Returns:
        int|None: integer value or None
    """

    if val:
        try:
            int(val)
        except ValueError:
            return None
        return int(val)
    return None


def set_media_links(item: Row) -> dict:
    """Set media urls on API

    Args:
        item (Row): media query item

    Returns:
        dict: media item as dict with urls
    """
    print(f"TYPE ITEM {type(item)}")
    m = item._asdict()
    m["media_url"] = url_for("commons.get_media", id=item.id_media)
    source_url = None
    if item.type_program == "sites":
        source_url = url_for("sites.get_site", pk=item.id_site)
    elif item.type_program == "observations":
        source_url = url_for("obstax.get_observation", pk=item.id_data_source)
    m["source_url"] = source_url
    return m
