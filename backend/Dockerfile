# STAGE BASE
FROM python:3.8.10 as python-base

ENV PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    # do not ask any interactive question
    POETRY_NO_INTERACTION=1 \
    \
    # paths
    # this is where our requirements + virtual environment will live
    PYSETUP_PATH="/opt/pysetup" \
    VENV_PATH="/opt/pysetup/.venv"

ENV PATH="$POETRY_PATH/bin:$VENV_PATH/bin:$PATH"

# STAGE POETRY
FROM python-base as poetry

WORKDIR $PYSETUP_PATH
RUN pip install --upgrade pip \
    && pip install poetry

COPY poetry.lock pyproject.toml ./
RUN poetry install

# STAGE RUNTIME
FROM python-base as runtime
WORKDIR /app

COPY --from=poetry $PYSETUP_PATH $PYSETUP_PATH
COPY . .

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5002", "--timeout=30", "--reload", "wsgi:app"]
