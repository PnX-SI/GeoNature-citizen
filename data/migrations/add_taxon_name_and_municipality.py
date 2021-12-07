from urllib.parse import urljoin
import requests
import json

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
INPN_URL = "https://taxref.mnhn.fr/api/taxa/"
GNC_API = "http://localhost:8888/api/"
GNC_ALL_OBS = GNC_API + '/programs/all/observations'
GNC_OBS = GNC_API + '/observations'
GNC_LOGIN = GNC_API + '/login'


def get_municipality_name(x: int, y: int):
  municipality = get_municipality_from_lat_long(lat=y, 
                                                lon=x)
  # Chaining if conditions since the nominatim API does not return
  # the same attributes depending on the "city"
  available_city_keys = ['village',
                          'town',
                          'municipality',
                          'city']
  municipality_id = None
  i = 0
  while municipality_id is None and i < len(available_city_keys) - 1:
      municipality_id = municipality.get(available_city_keys[i], None)
      i += 1

  return municipality_id


def get_municipality_from_lat_long(lat: int, lon: int) -> dict:
    municipality = {}
    resp = requests.get(f'{NOMINATIM_URL}?lat={lat}&lon={lon}&format=json',timeout=10)
    if resp.ok:
        municipality = resp.json().get('address', {})
    return municipality


def get_taxa_name(taxa_id: int) -> dict:
  url = urljoin(INPN_URL, f'{taxa_id}')
  resp = requests.get(url)
  if resp.status_code == 200:
    return resp.json().get('frenchVernacularName')
  else:
    raise RuntimeError('Cannot get infos from inpn')


def get_observations():
  resp = requests.get(GNC_ALL_OBS)
  if resp.status_code == 200:
    return resp.json().get('features', {})
  else:
    raise RuntimeError('Cannot get infos from citizen')


def render_observations(observations: list):
  changed_obs = []
  for obs in observations:
    coords = obs.get('geometry', {}).get('coordinates', [])
    coords_dict = {'x': coords[0], 
                   'y': coords[1]}
    props = obs.get('properties')
    dic = {
      "geometry": json.dumps(coords_dict),
      "cd_nom": props['cd_nom'],
      "name": get_taxa_name(taxa_id=props['cd_nom']),
      "date": props['date'],
      "municipality": get_municipality_name(x=coords[0], y=coords[1]),
      "count": props['count'],
      "comment": props['comment'],
      "id_observation": props["id_observation"],
      "delete_media": json.dumps([])
    }
    changed_obs.append(dic)
  
  return changed_obs


def login(email:str, passwd: str):
  # Post Method is invoked if data != None
  resp = requests.post(GNC_LOGIN, json={'email': email,
                                        'password': passwd})
  # Response
  if resp.status_code == 200:
    return resp.json().get('access_token')


def set_observations(observations, token):
  for obs in observations:
    obs_id = obs.get('id_observation', 0)
    headers = {'Authorization': 'Bearer ' + token}
    resp =  requests.patch(GNC_OBS, data=obs, headers=headers)
    if not resp.ok:
      print(obs)
      raise RuntimeError(f'Cannot update this observation: n°{obs_id}')
    else:
      print(f'Done for obs n°{obs_id}')


if __name__ == '__main__':
  generate_all = False
  if generate_all:
    obs = get_observations()
    obs = render_observations(obs)
    with open('./obs_save.json', 'w') as f:
      json.dump(obs, f)
  else:
    with open('./obs_save.json', 'r') as f:
      obs = json.load(f)
  token = login('myadminuser', 'myadminpwd')
  print(set_observations(obs, token=token))
