from pathlib import Path

ROOT_DIR = Path(__file__).absolute().parent.parent.parent

with open(str((ROOT_DIR / "VERSION"))) as v:
    __version__ = v.read()
