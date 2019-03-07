from datetime import date
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

@unittest.skip
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

@unittest.skip
class ObservationsTestCase(unittest.TestCase):
    def setUp(self):
        """Define test variables and initialize app."""
        self.app = get_app(load_config())
        self.client = self.app.test_client
        self.observations_post_data = {
            'cd_nom': 3582,
            'obs_txt': 'Tada',
            'count': 1,
            'geometry': {"type": "Point", "coordinates": [5, 45]}
        }

    # def login_user(self, data):
    #     return self.client().post(mainUrl + 'login', data=data)

    def test_get_observations(self):
        response = getrequest("observations")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['type'], "FeatureCollection")
        self.assertIsInstance(data['features'], list)

    # def test_post_observation(self):
    #     response = self.client().post(
    #         mainUrl + 'observations', data=self.observations_post_data)
    #     data = response.json()
    #     print(data)
    #     self.assertEqual(response.status_code, 200)


class SitesTestCase(unittest.TestCase):

    def test_get_sites(self):
        resp = getrequest("sites")
        data = resp.json()
        self.assertEqual(data['type'], "FeatureCollection")

    def test_site_types(self):
        response = getrequest('sites/types')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['count'], 1)
        self.assertTrue('mare' in data['site_types'])

    def test_create_site(self):
        body = {
            'id_program': 2,
            'name': 'la mare au fond de mon jardin',
            'geometry': {
                'type': 'point',
                'coordinates': [5.644226074218751, 45.08709642547449],
            }
        }
        # Should fail when no site_type provided
        response = postrequest("sites/", json.dumps(body))
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('not-null constraint', data['error_message'])

        # Should fail with incorrect site_type
        body['site_type'] = 'wrong'
        response = postrequest("sites/", json.dumps(body))
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('invalid input value for enum sitetype', data['error_message'])

        # Success for mare
        body['site_type'] = 'mare'
        response = postrequest("sites/", json.dumps(body))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(data)

        # Test that site is now getting returned
        site_id = data['features'][0]['properties']['id_site']
        response = getrequest('sites/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        sites_ids = [f['properties']['id_site'] for f in data['features']]
        self.assertIn(site_id, sites_ids)


if __name__ == "__main__":
    unittest.main()
