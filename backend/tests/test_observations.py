import unittest

from gncitizen.utils.env import load_config
from server import get_app
from tests.common import getrequest


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

