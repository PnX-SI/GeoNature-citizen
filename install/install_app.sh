#!/bin/bash
cd $(dirname $(dirname "${BASH_SOURCE[0]:-$0}"))

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

#Installation de python / gunicorn / supervisor + dépendances
sudo apt update && sudo apt -y install python2.7 git gcc curl gunicorn python-setuptools lsb-release apt-transport-https wget
sudo apt -y install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl libbz2-dev
sudo apt -y install apache2 python-dev libpq-dev libgeos-dev supervisor unzip virtualenv libcurl4-openssl-dev libssl-dev
sudo apt -y install apt-get install build-essential libglib2.0-0 libsm6 libxext6 libxrender-dev

RELEASE=$(cat /etc/os-release | grep VERSION_CODENAME |cut -d "=" -f2)
sudo apt install python3 python3-dev python3-pip -y

sudo apt-get clean

echo `python3 --version`

sudo service supervisor start && sudo supervisorctl stop all
#Maj  de pip
pip3 install --upgrade pip

#Installation de nvm / npm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
#cp -r ${HOME}/.nvm /home/synthese/.nvm
#chown -R synthese:synthese /home/synthese/.nvm

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
cd $HOME
python3 -m pip install virtualenv==20.0.1 --user

sudo a2enmod rewrite proxy proxy_http
sudo apache2ctl restart
sudo apt-get install postgresql postgresql-client postgresql postgresql-postgis -y

sudo adduser postgres sudo
sudo service postgresql start
sudo -n -u postgres psql -c "CREATE ROLE $user_pg WITH PASSWORD '$user_pg_pass';"
sudo -n -u postgres psql -c "ALTER ROLE $user_pg WITH LOGIN;"
sudo -n -u postgres createdb -O $user_pg $pg_dbname -T template0 -E UTF-8

cd $HOME
if [ ! -d $HOME/taxhub ] && [ $install_taxhub ]; then
  wget https://github.com/PnX-SI/TaxHub/archive/$taxhub_version.zip
  unzip $taxhub_version.zip
  mv TaxHub-$taxhub_version/ taxhub/
  rm $taxhub_version
fi
cd $HOME/taxhub

if [ ! -f settings.ini ]; then
  cp settings.ini.sample settings.ini
fi

sed -i "s,db_host=.*$,db_host=$pg_host,g" settings.ini
sed -i "s,db_name=.*$,db_name=$pg_dbname,g" settings.ini
sed -i "s,user_pg=.*$,user_pg=$user_pg,g" settings.ini
sed -i "s,user_pg_pass=.*$,user_pg_pass=$user_pg_pass,g" settings.ini
sed -i "s,db_port=.*$,db_port=$pg_port,g" settings.ini
sed -i "s,usershub_release=.*$,usershub_release=2.1.3,g" settings.ini

sudo printf "
<Location /taxhub> \n
  ProxyPass  http://127.0.0.1:5000/ retry=0 \n
  ProxyPassReverse  http://127.0.0.1:5000/ \n
</Location> \n
\n
Alias '/static' 'HOME_PATH/taxhub/static' \n
<Directory 'HOME_PATH/taxhub/static'> \n
  AllowOverride None \n
  Order allow,deny \n
  Allow from all \n
</Directory> \n
" | sed "s,HOME_PATH,$HOME,g" | sudo tee /etc/apache2/sites-available/taxhub.conf

sudo printf '
RewriteEngine  on \n
RewriteRule    "taxhub$"  "taxhub/"  [R] \n
' | sudo tee /etc/apache2/sites-available/000-default.conf

sudo a2ensite taxhub.conf
sudo apache2ctl restart

cd $HOME/taxhub
mkdir -p var/log
mkdir -p $DIR/var/log
touch $DIR/var/log/api_geonature-errors.log
mkdir -p /tmp/taxhub/
mkdir -p /tmp/usershub/
sudo chown -R $(whoami) $HOME/taxhub
sudo chown -R $(whoami) /tmp/taxhub
sudo chown -R $(whoami) /tmp/usershub
#sed -i "s,nano.*$,#,g" install_db.sh
#sed -i "s,PnEcrins,PnX-SI,g" install_db.sh
./install_db.sh
./install_app.sh

cd $DIR
. config/settings.ini
sudo -u postgres psql $pg_dbname -c 'create extension postgis;'

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
  sudo sed -i "s%APP_PATH%${DIR}%" /etc/apache2/sites-available/gncitizen.conf
  sudo sed -i "s%mydomain.net%${URL}%" /etc/apache2/sites-available/gncitizen.conf
  
  # sudo a2ensite gncitizen.conf
else
  echo "Build initial du projet"
  npm run build
fi
cd ..

# Création du venv
venv_path=$DIR/backend/${venv_dir:-"venv"}
if [ ! -f $venv_path/bin/activate ]; then
  python3 -m virtualenv $venv_path
fi
source $venv_path/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
deactivate

touch init_done

#Création de la conf supervisor
sudo cp install/supervisor/gncitizen_api-service.conf /etc/supervisor/conf.d/
sudo sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/gncitizen_api-service.conf
sudo sed -i "s%SYSUSER%$(whoami)%" /etc/supervisor/conf.d/gncitizen_api-service.conf

# cp  config/apache/gncitizen_api.conf  /etc/apache2/sites-available/gncitizen_api.conf 
# cat config/apache/gncitizen_api.conf | sed "s,HOME_PATH,$HOME,g" | sudo tee /etc/apache2/sites-available/gncitizen_api.conf
sudo a2ensite gncitizen.conf
sudo apache2ctl restart
#
sudo supervisorctl reread
sudo supervisorctl reload

echo "install municipalities"
./data/ref_geo.sh

echo "End"
