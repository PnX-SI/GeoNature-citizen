#!/bin/bash
cd $(dirname $(dirname "${BASH_SOURCE[0]:-$0}"))

DIR=$(pwd)

# Vérification de la configuration et copie du settings.ini
./install/check_settings.sh

. config/settings.ini

#Installation de python / gunicorn / supervisor + dépendances
sudo apt update && sudo apt -y install python2.7 git gcc curl gunicorn python-setuptools lsb-release apt-transport-https wget
sudo apt -y install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl libbz2-dev
sudo apt -y install apache2 python-dev libpq-dev libgeos-dev supervisor unzip virtualenv libcurl4-openssl-dev libssl-dev
sudo apt -y install build-essential libglib2.0-0 libsm6 libxext6 libxrender-dev

# RELEASE=$(cat /etc/os-release | grep VERSION_CODENAME |cut -d "=" -f2)
sudo apt install python3 python3-dev python3-pip -y

sudo apt-get clean

echo $(python3 --version)

sudo service supervisor start && sudo supervisorctl stop all
#Maj  de pip
pip3 install --upgrade pip

# NVM loading
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ${DIR}/frontend
nvm install
echo $(npm -v)
cd ${DIR}

#Installation de taxhub
#if [ ! -d /home/synthese ]; then
#adduser --gecos "" --home /home/citizen citizen
#sudo passwd -d citizen
#adduser citizen sudo
#adduser citizen root
#adduser synthese www-data
#fi

echo "export PATH=\$PATH:~/.local/bin" >>~/.bashrc
exec $SHELL

python3 -m pip install poetry --user

cd ${DIR}
./install/copy_config.sh
cd ${DIR}/frontend

#Install and build
NG_CLI_ANALYTICS=ci # Désactive le prompt pour angular metrics
URL=$(echo $my_url | sed 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/')
echo "L'application sera disponible à l'url $my_url"

nvm use
npm install

if [ $server_side = "true" ]; then
  echo "Build server side project"
  npm run build:i18n-ssr
  #  Installation de la conf
  sudo cp ../install/supervisor/gncitizen_frontssr-service.conf /etc/supervisor/conf.d/
  sudo sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/gncitizen_frontssr-service.conf
  sudo sed -i "s%SYSUSER%$(whoami)%" /etc/supervisor/conf.d/gncitizen_frontssr-service.conf
  sudo cp ../install/apache/gncitizen.conf /etc/apache2/sites-available/gncitizen.conf
  
  cd ${DIR}
  . /install/generate_password.sh

  sudo sed -i "s%APP_PATH%${DIR}%" /etc/apache2/sites-available/gncitizen.conf
  sudo sed -i "s%mydomain.net%${URL}%" /etc/apache2/sites-available/gncitizen.conf
  sudo sed -i "s%backoffice_username%${backoffice_username}%" /etc/apache2/sites-available/gncitizen.conf

else
  echo "Build initial du projet"
  npm run build
fi
# cd ..

# Création du venv
# venv_path=$DIR/backend/${venv_dir:-"venv"}
# if [ ! -f $venv_path/bin/activate ]; then
#   python3 -m virtualenv $venv_path
# fi
cd $DIR/backend
poetry install
cd $DIR

# Copy main medias to media
mkdir -p $DIR/media
# cp -r $DIR/frontend/src/assets/* $DIR/media

touch init_done

#Création de la conf supervisor
sudo cp install/supervisor/gncitizen_api-service.conf /etc/supervisor/conf.d/
sudo sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/gncitizen_api-service.conf
sudo sed -i "s%SYSUSER%$(whoami)%" /etc/supervisor/conf.d/gncitizen_api-service.conf

# Prise en compte de la nouvelle config Apache
sudo a2ensite gncitizen.conf
sudo apache2ctl restart

# Prise en compte de la nouvelle config Supervisor
sudo supervisorctl reread
sudo supervisorctl reload

# Installation de Taxhub si demandée
if $install_taxhub; then
  echo "Installing taxhub"
  ./install_taxhub.sh
fi

echo "End of installation
You can now access to GeoNature-citizen at ${my_url}

Backoffice access informations are stored in ${DIR}/config/backoffice_access as follows:
"

cat ${DIR}/config/backoffice_access
