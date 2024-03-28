"""gncitizen __init__ to retrieve VERSION"""

from pathlib import Path

ROOT_DIR = Path(__file__).absolute().parent.parent.parent

with open(str((ROOT_DIR / "VERSION")), encoding="utf-8") as v:
    __version__ = v.read()
