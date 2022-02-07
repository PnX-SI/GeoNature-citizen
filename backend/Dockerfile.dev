FROM python:3.8.10

WORKDIR /app

RUN pip install --upgrade pip \
    && pip install poetry
    
CMD poetry install; poetry run python3 wsgi.py