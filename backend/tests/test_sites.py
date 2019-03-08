import json
import unittest

from tests.common import postrequest, getrequest


class SitesTestCase(unittest.TestCase):

    create_site_body = {
        'id_program': 2,
        'site_type': 'mare',
        'name': 'la mare au fond de mon jardin',
        'geometry': {
            'type': 'point',
            'coordinates': [5.644226074218751, 45.08709642547449],
        }
    }

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
        body = self.create_site_body.copy()

        # Should fail when no site_type provided
        del body['site_type']
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

    def test_create_visit(self):
        # First create a site to get a site_id
        response = postrequest("sites/", json.dumps(self.create_site_body))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        site_id = data['features'][0]['properties']['id_site']

        body = {
            'date': '2019-03-06',
            'data': {}
        }
        response = postrequest("sites/{}/visits".format(site_id), json.dumps(body))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(data)
        self.assertEqual(len(data['features']), 1)
        visit1 = data['features'][0]
        self.assertEqual(visit1['id_site'], site_id)

        # Create 2nd visit on same site
        response = postrequest("sites/{}/visits".format(site_id), json.dumps(body))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(data)
        self.assertEqual(len(data['features']), 1)
        visit2 = data['features'][0]
        self.assertEqual(visit2['id_site'], site_id)

        self.assertNotEqual(visit1['id_visit'], visit2['id_visit'])

        # Query site and check last_visit
        response = getrequest('sites/{}'.format(site_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(data)
        site = data['features'][0]['properties']
        self.assertEqual(site['last_visit']['id_visit'], visit2['id_visit'])


if __name__ == "__main__":
    unittest.main()
