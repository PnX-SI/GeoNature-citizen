#!/bin/bash
cd $(dirname $(dirname "${BASH_SOURCE[0]:-$0}"))

DIR=$(pwd)

#création d'un fichier de configuration pour api/back
if [ ! -f config/settings.ini ]; then
  echo 'Fichier de configuration du projet non existant, copie du template...'
  cp config/settings.ini.template config/settings.ini
  echo "Fichier de config disponible : $DIR/config/settings.ini."
  echo "Merci de renseigner le fichier et de relancer la commande install_app.sh."
  exit
fi

. config/settings.ini

#Installation de python / gunicorn / supervisor + dépendances
sudo apt update && sudo apt -y install python2.7 git gcc curl gunicorn python-setuptools lsb-release apt-transport-https wget
sudo apt -y install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl libbz2-dev
sudo apt -y install apache2 python-dev libpq-dev libgeos-dev supervisor unzip virtualenv libcurl4-openssl-dev libssl-dev
sudo apt -y install build-essential libglib2.0-0 libsm6 libxext6 libxrender-dev

# RELEASE=$(cat /etc/os-release | grep VERSION_CODENAME |cut -d "=" -f2)
sudo apt install python3 python3-dev python3-pip -y

sudo apt-get clean

echo `python3 --version`

sudo service supervisor start && sudo supervisorctl stop all
#Maj  de pip
pip3 install --upgrade pip

# NVM loading
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd ${DIR}/frontend
nvm install
echo `npm -v`
cd ${DIR}

#Installation de taxhub
#if [ ! -d /home/synthese ]; then
#adduser --gecos "" --home /home/citizen citizen
#sudo passwd -d citizen
#adduser citizen sudo
#adduser citizen root
#adduser synthese www-data
#fi
python3 -m pip install poetry --user


if [ ! -f config/default_config.toml ]; then
  echo 'Fichier de configuration API non existant, copie du template...'
  cp config/default_config.toml.template config/default_config.toml
  sed -i "s/SQLALCHEMY_DATABASE_URI = .*$/SQLALCHEMY_DATABASE_URI = \"postgresql:\/\/$user_pg:$user_pg_pass@$pg_host:$pg_port\/$pg_dbname\"/" config/default_config.toml
  sed -i "s,URL_APPLICATION = .*$,URL_APPLICATION = \"$url_application\",g" config/default_config.toml
  sed -i "s,API_ENDPOINT = .*$,API_ENDPOINT = \"$api_endpoint\",g" config/default_config.toml
  sed -i "s,API_PORT = .*$,API_PORT = \"$api_port\",g" config/default_config.toml
  sed -i "s,API_TAXHUB = .*$,API_TAXHUB = \"$api_taxhub\",g" config/default_config.toml
fi

#Création d'un fichier de configuration pour le front
cd frontend
if [ ! -f src/conf/app.config.ts ]; then
  echo 'Fichier de configuration frontend non existant, copie du template...'
  cp src/conf/app.config.ts.template src/conf/app.config.ts
  sed -i "s|API_ENDPOINT:.*$|API_ENDPOINT:\"$api_endpoint\",|g" src/conf/app.config.ts
  sed -i "s|API_TAXHUB:.*$|API_TAXHUB:\"$api_taxhub\",|g" src/conf/app.config.ts
  sed -i "s|URL_APPLICATION:.*$|URL_APPLICATION:\"$url_application\",|g" src/conf/app.config.ts

fi
if [ ! -f src/conf/map.config.ts ]; then
  echo 'Fichier map non existant, copie du template...'
  cp src/conf/map.config.ts.template src/conf/map.config.ts
fi

#Copie des fichiers custom
if [ ! -f src/custom/custom.css ]; then
  echo 'Fichier custom.css non existant, copie du template...'
  cp src/custom/custom.css.template src/custom/custom.css
fi
if [ ! -f src/custom/about/about.css ]; then
  echo 'Fichiers about non existant, copie du template...'
  cp src/custom/about/about.css.template src/custom/about/about.css
  cp src/custom/about/about.html.template src/custom/about/about.html
fi
if [ ! -f src/custom/footer/footer.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp src/custom/footer/footer.css.template src/custom/footer/footer.css
  cp src/custom/footer/footer.html.template src/custom/footer/footer.html
fi
if [ ! -f src/custom/home/home.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp src/custom/home/home.css.template src/custom/home/home.css
  cp src/custom/home/home.html.template src/custom/home/home.html
fi

#Install and build
NG_CLI_ANALYTICS=ci # Désactive le prompt pour angular metrics
URL=`echo $my_url |sed 's/[^/]*\/\/\([^@]*@\)\?\([^:/]*\).*/\2/'`
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
  if [ ${backoffice_password:=MotDePasseAChanger} = MotDePasseAChanger ]; then
    backoffice_password=$(date +%s | sha256sum | base64 | head -c 30 ; echo)
  fi
  echo "Backoffice password
===================
url: (${URL}/api/admin)
username: ${backoffice_username:=citizen}
password: ${backoffice_password}" > ${DIR}/config/backoffice_access
  htpasswd -b -c ${DIR}/config/backoffice_htpasswd ${backoffice_username} ${backoffice_password}
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
cp -r $DIR/frontend/src/assets/* $DIR/media

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
if [ $install_taxhub -ne 0 ]; then
  echo "Installing taxhub"
  ./install_taxhub.sh
fi

echo "End of installation
You can now access to GeoNature-citizen at ${my_url}

Backoffice access informations are stored in ${DIR}/config/backoffice_access as follows:
"

cat ${DIR}/config/backoffice_access
