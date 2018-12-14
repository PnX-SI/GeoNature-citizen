import json
import unittest

import requests

from gncitizen.utils.env import load_config
from server import get_app

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


def auth():
    myParams = {}
    myParams['username'] = user
    myParams['password'] = pwd
    myParams['name'] = name
    myParams['surname'] = surname
    myParams['email'] = email
    return json.dumps(myParams)


def postrequest(url):
    myUrl = mainUrl + url
    params = auth()
    response = requests.post(myUrl, headers=headers, data=params)
    return response


def getrequest(url):
    myUrl = mainUrl + url
    params = auth()
    response = requests.get(myUrl, headers=headers, data=params)
    return response


class TestAuthFlaskApiUsingRequests(unittest.TestCase):

    def test_login(self):
        response = postrequest("login")
        self.assertEqual(response.status_code, 200)

    def test_logout(self):
        response = postrequest("logout")
        self.assertEqual(response.status_code, 200)


class SightsTestCase(unittest.TestCase):
    def setUp(self):
        """Define test variables and initialize app."""
        self.app = get_app(load_config())
        self.client = self.app.test_client
        self.sights_post_data = {
            'cd_nom': 3582,
            'obs_txt': 'Tada',
            'count': 1,
            'geometry': {"type": "Point", "coordinates": [5, 45]}
        }

    def login_user(self, username=user, password=pwd):
        return self.client().post(mainUrl + 'login', data=auth())

    def test_get_sights(self):
        response = requests.get(mainUrl + "sights")
        self.assertEqual(response.status_code, 200)

    def test_post_sight(self):
        response = requests.post(mainUrl + "sights")
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
