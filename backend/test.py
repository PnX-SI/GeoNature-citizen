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


class TestAuthFlaskApiUsingRequests(unittest.TestCase):

    def test_login(self):
        global access_token
        global refresh_token
        response = postrequest("login", auth())
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Logged in as testuser')
        self.assertIsNotNone(data.get('access_token', None))
        access_token = data['access_token']
        self.assertIsNotNone(data.get('refresh_token', None))
        refresh_token = data['refresh_token']

    def test_logout(self):
        response = postrequest("logout", auth())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"msg": "Successfully logged out"})


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
        # user_data = {
        #     'username': username,
        #     'password': password
        # }
        return self.client().post(mainUrl + 'login', data=auth())

    def test_get_sights(self):
        response = getrequest("sights")
        # result = self.login_user()
        # print('login resp:', result.data.decode())
        # access_token = json.loads(result.data.decode())['access_token']
        # response = self.client().post(
        #     '/api/sights/',
        #     headers=dict(Authorization="Bearer " + access_token),
        #     data=self.sights_post_data)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['type'], "FeatureCollection")
        self.assertIsInstance(data['features'], list)

    # def test_post_sight(self):
    #     response = postrequest("sights", TEST_POST_SIGHTS)
    #     self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
