#Mise à jour du git
git pull

. config/settings.ini
npm install
#Transpilation du frontend
cd frontend
npm install
if [ $server_side = "true" ]; then
  echo "Build server side project"
  npm run build:i18n-ssr
  echo "Reloading Front server ..."
  sudo -s supervisorctl reload geonature
else
  echo "Build du projet"
  npm run build
fi
cd ..

# Mise a jour des requirements
FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="venv"
venv_path=$FLASKDIR/backend/$venv_dir
source $venv_path/bin/activate
echo $(pwd)
pip install -r backend/requirements.txt

#Reload Supervisor pour l'api
echo "Reloading Api ..."
sudo -s supervisorctl reload api_geonature