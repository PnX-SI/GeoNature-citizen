#!/bin/bash
set -e

cd $(dirname $(dirname "${BASH_SOURCE[0]:-$0}"))

DIR=$(pwd)

# Vérification de la configuration et copie du settings.ini
. ./install/check_settings.sh

. config/settings.ini

#Installation de python / gunicorn / supervisor + dépendances
sudo apt update
sudo apt -y install gcc curl gunicorn python-setuptools lsb-release \
  apt-transport-https wget build-essential zlib1g-dev libncurses5-dev \
  libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl \
  libbz2-dev apache2 python-dev libpq-dev libgeos-dev supervisor unzip \
  virtualenv libcurl4-openssl-dev libssl-dev libglib2.0-0 libsm6 libxext6 \
  libxrender-dev postgresql postgis python3 python3-dev python3-venv python3-pip

sudo apt-get clean

# Create the database
. ./install/create_db.sh

# Add a new user in database
. ./install/create_db_user.sh

#Maj  de pip
pip3 install --upgrade pip

#Installation de nvm / npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ${DIR}/frontend
nvm install
echo $(npm -v)
cd ${DIR}

cd ${DIR}
. ./install/copy_config.sh
cd ${DIR}/frontend

#Install and build
NG_CLI_ANALYTICS=off # Désactive le prompt pour angular metrics
URL=$(echo $my_url | sed 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
echo "L'application sera disponible à l'url $my_url"

nvm use
npm install

echo "Build frontend"
npm run build:i18n-ssr
#  Installation de la conf
sudo cp ../install/supervisor/gncitizen_frontssr-service.conf /etc/supervisor/conf.d/
sudo sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/gncitizen_frontssr-service.conf
sudo sed -i "s%SYSUSER%$(whoami)%" /etc/supervisor/conf.d/gncitizen_frontssr-service.conf
sudo cp ../install/apache/gncitizen.conf /etc/apache2/sites-available/gncitizen.conf

cd ${DIR}
. ./install/generate_password.sh

sudo sed -i "s%APP_PATH%${DIR}%" /etc/apache2/sites-available/gncitizen.conf
sudo sed -i "s%mydomain.net%${URL}%" /etc/apache2/sites-available/gncitizen.conf
sudo sed -i "s%backoffice_username%${backoffice_username}%" /etc/apache2/sites-available/gncitizen.conf

# cd ..

# Création du venv
cd $DIR/backend
venv_path=$DIR/backend/${venv_dir:-".venv"}
if [ ! -f $venv_path/bin/activate ]; then
  python3 -m venv $venv_path
fi
source .venv/bin/activate
pip install -r requirements.txt

# init DB
# !!! TODO test init db
flask db upgrade

cd $DIR
# Copy main medias to media
mkdir -p $DIR/media
cp -r $DIR/frontend/src/assets/* $DIR/media

# Creation des repertoires de log
mkdir -p var/log

touch init_done

#Création de la conf supervisor
sudo cp install/supervisor/gncitizen_api-service.conf /etc/supervisor/conf.d/
sudo sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/gncitizen_api-service.conf
sudo sed -i "s%SYSUSER%$(whoami)%" /etc/supervisor/conf.d/gncitizen_api-service.conf

# Prise en compte de la nouvelle config Apache
sudo a2enmod proxy_http
sudo a2ensite gncitizen.conf
sudo apache2ctl restart

# Prise en compte de la nouvelle config Supervisor
sudo supervisorctl reread
sudo supervisorctl reload

# Installation de Taxhub si demandée
if $install_taxhub; then
  echo "Installing taxhub"
  . ./install/install_taxhub.sh
fi

echo "End of installation
You can now access to GeoNature-citizen at ${my_url}

Backoffice access informations are stored in ${DIR}/config/backoffice_access as follows:
"

cat ${DIR}/config/backoffice_access
