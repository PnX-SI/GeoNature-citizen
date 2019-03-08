import json
import requests

from gncitizen.utils.env import load_config

# disable loud logs from urllib3
import logging
logging.getLogger("urllib3").setLevel(logging.WARNING)


APP_CONF = load_config()
access_token = None
refresh_token = None
mainUrl = "http://localhost:5001/api/"
mimetype = 'application/json'
headers = {
    'Content-Type': mimetype,
    'Accept': mimetype
}
user = 'testuser'
pwd = 'testpwd'  # noqa: S105
name = 'tester'
surname = 'testersurname'
email = 'tester@test.com'
'''\
INSERT INTO
    gnc_core.t_users (
        id_user,
        name,
        surname,
        username,
        password,
        email,
        phone,
        organism,
        admin,
        timestamp_create
    ) VALUES (
        0,
        'tester',
        'testersurname',
        'testuser',
        '$pbkdf2-sha256$29000$BeAcw7hXqrXW2rvXuhdC6A$UMDBikxvbEXz8VhqAYQZDcS6BG6QUXbYi/EjCpvWVW0',
        'tester@test.com',
        NULL,
        NULL,
        NULL,
        NULL
    );
'''


def set_tokens(access, refresh):
    global access_token, refresh_token
    access_token = access
    refresh_token = refresh


def auth():
    myParams = {}
    myParams['username'] = user
    myParams['password'] = pwd
    myParams['name'] = name
    myParams['surname'] = surname
    myParams['email'] = email
    return json.dumps(myParams)


def postrequest(url, params=None):
    myUrl = mainUrl + url
    if access_token:
        headers.update({'Authorization': 'Bearer {}'.format(access_token)})
    response = requests.post(myUrl, headers=headers, data=params)
    return response


def getrequest(url):
    myUrl = mainUrl + url
    params = auth()
    response = requests.get(myUrl, headers=headers, data=params)
    return response
