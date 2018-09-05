import json
import unittest

import requests

mainUrl = "http://127.0.0.1:5000/"
# head = {'Authorization': 'token {}'.format(myToken)}
headers = {"content-type": "application/json"}
user = 'testuser'
pwd = 'testpwd'
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


class TestFlaskApiUsingRequests(unittest.TestCase):

    def test_get_sights(self):
        response = requests.get(mainUrl + "gnc_sights")
        self.assertEqual(response.status_code, 200)

    def test_post_sight(self):
        response = requests.post(mainUrl + "gnc_sights")
        self.assertEqual(response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
