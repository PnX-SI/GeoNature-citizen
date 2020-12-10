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

#Installation de python / gunicorn / supervisor + dépendances
sudo apt update && sudo apt -y install python2.7 git gcc curl gunicorn python-setuptools sudo lsb-release apt-transport-https wget
sudo -s apt -y install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl libbz2-dev
sudo -s apt install apache2 python-dev libpq-dev libgeos-dev supervisor unzip virtualenv -y
sudo -s apt install apt-get install build-essential libglib2.0-0 libsm6 libxext6 libxrender-dev -y

RELEASE=$(cat /etc/os-release | grep VERSION_CODENAME |cut -d "=" -f2)
echo $RELEASE
if [ $RELEASE = "stretch" ]; then
  wget https://people.debian.org/~paravoid/python-all/unofficial-python-all.asc
  sudo -s mv unofficial-python-all.asc /etc/apt/trusted.gpg.d/
  echo "deb http://people.debian.org/~paravoid/python-all $RELEASE main" | sudo tee /etc/apt/sources.list.d/python-all.list
  sudo -s apt update && sudo -s apt install -y python3.7
  update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.7 50
else
  sudo -s apt install python3 python3-dev python3-pip -y
fi

sudo -s apt-get clean

echo `python3 --version`

sudo service supervisor start
sudo supervisorctl stop all
#Installation  de pip
pip3 install --upgrade pip
#curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
#python3 get-pip.py

#Installation de nvm / npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
cp -r ${HOME}/.nvm /home/synthese/.nvm
chown -R synthese:synthese /home/synthese/.nvm

nvm install 14 --lts
echo `npm -v`

#Installation de taxhub
if [ ! -d /home/synthese ]; then
adduser --gecos "" --home /home/synthese synthese
sudo passwd -d synthese
adduser synthese sudo
adduser synthese root
adduser synthese www-data
fi
cd /home/synthese
python3 -m pip install virtualenv==20.0.1 --user

sudo a2enmod rewrite proxy proxy_http
sudo apache2ctl restart
sudo apt-get install postgresql postgresql-client postgresql -y

sudo adduser postgres sudo
service postgresql start
sudo -n -u postgres -s psql -c "CREATE ROLE $user_pg WITH PASSWORD '$user_pg_pass';"
sudo -n -u postgres -s psql -c "ALTER ROLE $user_pg WITH LOGIN;"
sudo -n -u postgres -s createdb -O $user_pg $db_name -T template0 -E UTF-8

cd /home/synthese
if [ ! -d /home/synthese/taxhub ]; then
  wget https://github.com/PnX-SI/TaxHub/archive/1.7.3.zip
  unzip 1.7.3.zip
  mv TaxHub-1.7.3/ taxhub/
  rm 1.7.3
fi
cd /home/synthese/taxhub

if [ ! -f settings.ini ]; then
  cp settings.ini.sample settings.ini
fi

echo "sed"
sed -i "s,db_host=.*$,db_host=$pg_host,g" settings.ini
sed -i "s,db_name=.*$,db_name=$pg_dbname,g" settings.ini
sed -i "s,user_pg=.*$,user_pg=$user_pg,g" settings.ini
sed -i "s,user_pg_pass=.*$,user_pg_pass=$user_pg_pass,g" settings.ini
sed -i "s,db_port=.*$,db_port=$pg_port,g" settings.ini
sed -i "s,usershub_release=.*$,usershub_release=2.1.3,g" settings.ini

echo '
<Location /taxhub>
  ProxyPass  http://127.0.0.1:5000/ retry=0
  ProxyPassReverse  http://127.0.0.1:5000/
</Location>

Alias "/static" "/home/synthese/taxhub/static"
<Directory "/home/synthese/taxhub/static">
  AllowOverride None
  Order allow,deny
  Allow from all
</Directory>
' > /etc/apache2/sites-available/taxhub.conf

echo '
RewriteEngine  on
RewriteRule    "taxhub$"  "taxhub/"  [R]
' >> /etc/apache2/sites-available/000-default.conf

sudo a2ensite taxhub.conf
sudo apache2ctl restart

cd /home/synthese/taxhub
mkdir var && chown -R synthese:synthese /home/synthese/taxhub
mkdir -p /tmp/taxhub/ && chown -R synthese:synthese /tmp/taxhub
mkdir p /tmp/usershub/ && chown -R synthese:synthese /tmp/usershub
#sed -i "s,nano.*$,#,g" install_db.sh
#sed -i "s,PnEcrins,PnX-SI,g" install_db.sh
su synthese -c './install_db.sh'
su synthese -c './install_app.sh'
cd $DIR
sudo -u postgres psql $user_pg -c 'create extension postgis;'

mkdir -p var/log

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
  cp ../geonature-service.conf /etc/supervisor/conf.d/
  sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/geonature-service.conf
else
  echo "Build initial du projet"
  npm run build
fi
cd ..

# Création du venv
FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="venv"
venv_path=$FLASKDIR/backend/$venv_dir
if [ ! -f $venv_path/bin/activate ]; then
  python3 -m virtualenv $venv_path
fi
source $venv_path/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
deactivate

touch init_done

#Création de la conf supervisor
sudo -s cp api_geonature-service.conf /etc/supervisor/conf.d/
sudo -s sed -i "s%APP_PATH%${DIR}%" /etc/supervisor/conf.d/api_geonature-service.conf
#
sudo -s supervisorctl reread
sudo -s supervisorctl reload
echo "End"
