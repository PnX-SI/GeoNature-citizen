#!/bin/bash
set -e

cd $(dirname $(dirname "${BASH_SOURCE[0]:-$0}"))

DIR=$(pwd)

# Creation du repertoires de logs
mkdir -p var/log

. config/settings.ini
# Transpilation du frontend
# Source nvm.sh pour accéder à nvm
source ~/.nvm/nvm.sh
cd ${DIR}/frontend
nvm install
nvm use
npm install
echo "Build frontend ..."
npm run build:i18n-ssr

# Création du venv et mise a jour des requirements
echo "Upgrade backend ..."
cd $DIR/backend
venv_path=$DIR/backend/${venv_dir:-".venv"}
if [ ! -f $venv_path/bin/activate ]; then
  python3 -m virtualenv $venv_path
fi
source .venv/bin/activate
pip install -r requirements.txt


# Reload Supervisor pour l'api
echo "Reloading Api ..."
sudo supervisorctl restart gncitizen_api
sudo supervisorctl restart gncitizen_front