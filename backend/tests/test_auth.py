import unittest

from tests.common import auth, postrequest, set_tokens


class TestAuthFlaskApiUsingRequests(unittest.TestCase):

    def test_login(self):
        response = postrequest("login", auth())
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Logged in as testuser')
        self.assertIsNotNone(data.get('access_token', None))
        access_token = data['access_token']
        self.assertIsNotNone(data.get('refresh_token', None))
        refresh_token = data['refresh_token']
        set_tokens(access_token, refresh_token)

    def test_logout(self):
        response = postrequest("logout", auth())
        self.assertEqual(response.status_code, 200)
        set_tokens(None, None)
