import json
import unittest

from tests.common import postrequest, getrequest


CREATE_SITE_BODY = {
    'id_program': 2,
    'site_type': 'mare',
    'name': 'la mare au fond de mon jardin',
    'geometry': {
        'type': 'point',
        'coordinates': [5.644226074218751, 45.08709642547449],
    }
}


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
        body = CREATE_SITE_BODY.copy()

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

        # Test that site is now getting returned
        site_id = data['features'][0]['properties']['id_site']
        response = getrequest('sites/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        sites_ids = [f['properties']['id_site'] for f in data['features']]
        self.assertIn(site_id, sites_ids)


class VisitsTestCase(unittest.TestCase):
    create_visit_body = {
        'date': '2019-03-06',
        'data': {}
    }

    def setUp(self):
        # Create a site to get a site_id
        response = postrequest("sites/", json.dumps(CREATE_SITE_BODY))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.site_id = data['features'][0]['properties']['id_site']
        self.visit = self.create_visit()

    def create_visit(self):
        response = postrequest("sites/{}/visits".format(self.site_id),
                               json.dumps(self.create_visit_body))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['features']), 1)
        visit = data['features'][0]
        self.assertEqual(visit['id_site'], self.site_id)
        return visit

    def test_create_visit(self):
        # Create 2 visits on same site
        visit1 = self.create_visit()
        visit2 = self.create_visit()

        self.assertNotEqual(visit1['id_visit'], visit2['id_visit'])

        # Query site and check last_visit
        response = getrequest('sites/{}'.format(self.site_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        site = data['features'][0]['properties']
        self.assertEqual(site['last_visit']['id_visit'], visit2['id_visit'])

    def get_photos(self):
        resp = getrequest("sites/{}".format(self.site_id))
        return resp.json()['features'][0]['properties']['photos']

    def test_post_photo(self):
        # check that there is currently no photos on the visit
        photos = self.get_photos()
        self.assertEqual(len(photos), 0)

        # post a photo
        response = postrequest(
            "sites/{}/visits/{}/photos".format(self.site_id, self.visit['id_visit']),
            None,
            file="../frontend/src/assets/Azure-Commun-019.JPG")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertIn("mares_{}".format(self.site_id), data[0])

        # check that we now get the photo in the site object
        photos = self.get_photos()
        self.assertEqual(len(photos), 1)
        self.assertEqual("/media/{}".format(data[0]), photos[0]['url'])


if __name__ == "__main__":
    unittest.main()
