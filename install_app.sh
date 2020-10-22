#!/bin/bash
DIR=$(pwd)

#création d'un fichier de configuration pour api/back
if [ ! -f config/settings.ini ]; then
  echo 'Fichier de configuration du projet non existant, copie du template...'
  cp config/settings.ini.template config/settings.ini
  echo "Fichier de config disponible : $DIR."
  echo "Merci de renseigner le fichier et de relancer la commande install_app.sh."
  exit
fi

. config/settings.ini

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
echo "Installation des dépendances nodes"
npm install
if [ $server_side = "true" ]; then
  echo "Build server side project"
  npm run build:i18n-ssr
#  Installation de la conf
  sudo -s cp ../geonature-service.conf /etc/supervisor/conf.d/
  sudo -s sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/geonature-service.conf
else
  echo "Build initial du projet"
  npm run build
fi
cd ..

# Création du venv
FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="venv"
venv_path=$FLASKDIR/$venv_dir
if [ ! -f $venv_path/bin/activate ]; then
  python3 -m virtualenv $venv_path
fi
source $venv_path/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
deactivate

#Création de la conf supervisor
sudo -s cp api_geonature-service.conf /etc/supervisor/conf.d/
sudo -s sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/api_geonature-service.conf
#
sudo -s supervisorctl reread
sudo -s supervisorctl reload
