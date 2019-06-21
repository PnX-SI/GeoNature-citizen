.. GeoNature-citizen documentation master file, created by
   sphinx-quickstart on Tue Jan 15 09:58:53 2019.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Documentation de GeoNature-citizen!
=============================================

.. .. versionadded:: 2.5
..    The *spam* parameter.

.. warning::

   GeoNature-citizen est encore en phase intensive de développement et n'est pas encore fonctionnel.

.. toctree::
   :maxdepth: 3
   :caption: Contenu:

   devs/index



Sommaire
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`



 Installation de Geonature Citizen sur un environnement Debian 
==================

Créer un utilisateur debian :

adduser nom_utilisateur (geonatadmin)
entrez un mot de passe (****)

usermod -aG sudo nom_utilisateur (geonatadmin)

su - nom_utilisateur (geonatadmin)

Vérifications que l’utilisateur est correctement créé :
sudo -l (entrez un mot de passe) : vérifier que ALL
sudo whoami : ok si on peut faire un sudo

Changer la locale en fr (il faut être root) :
sudo dpkg-reconfigure locales

-----------------------------------------------------------

INSTALLATION DE TAXHUB
==================

Pour plus de détails, lien officiel pour l’installation de taxhub :
https://taxhub.readthedocs.io/fr/latest/

Configurer le serveur :
https://taxhub.readthedocs.io/fr/latest/serveur.html#installation-et-configuration-du-serveur :

Configurer postgresql :
https://taxhub.readthedocs.io/fr/latest/serveur.html#installation-et-configuration-de-posgresql

Configuration et installation de l’application :
https://taxhub.readthedocs.io/fr/latest/installation.html

Remarques :
-	Bien vérifier de ne pas être en root :
su - nom_utilisateur (geonatadmin)
-	Pour avoir les caractéristiques de votre instance
lsb_release -a
uname -a


-------------------------------------------------------------------------

Nos lignes de code pour l’installation sur le serveur Debian (en vrac par rapport à la doc officielle d’installation qu’on aurait dû suivre scrupuleusement) :

sudo groupadd www-data
sudo apt-get install apache2 curl python-dev python-pip libpq-dev libgeos-dev supervisor
sudo usermod -g www-data username (geonatadmin)

wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install --lts
nvm use --lts

sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo apache2ctl restart

A ne pas faire selon Patrick :
#sed -e "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" -i /etc/postgresql/10/main/postgresql.conf
#sudo sed -e "s/# IPv4 local connections:/# IPv4 local connections:\nhost\tall\tall\t0.0.0.0\/0\t md5/g" -i /etc/postgresql/10/main/pg_hba.conf

wget https://github.com/PnX-SI/TaxHub/archive/1.6.2.zip
unzip 1.6.2.zip
mv TaxHub-1.6.2/ taxhub/

cd taxhub
cp settings.ini.sample settings.ini
nano settings.ini # faire les modif

## Configuration d’apache

Editer taxhub :
sudo nano /etc/apache2/sites-available/taxhub.conf
Ajouter :
# Configuration TaxHub
  <Location /taxhub>
    ProxyPass  http://127.0.0.1:5000/ retry=0
    ProxyPassReverse  http://127.0.0.1:5000/
  </Location>
#FIN Configuration TaxHub

sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2ensite taxhub.conf
sudo apache2ctl restart

cd ~/taxhub
#editer les settings drop_db=true
./install_db.sh   # pas de sudo … patcher la doc !
./install_app.sh

----------------------------------------------------------------------------------------------------------

INSTALLATION DE GEONATURE CITIZEN
==================

----------
Si Taxhub n’est pas installé :



* Etape 1 : “init_launch_db.rst” (https://github.com/PnX-SI/GeoNature-citizen/blob/taxhub_rest/docs/devs/init_launch_db.rst) :

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main" >> /etc/apt/sources.list.d/postgresql.list'

sudo wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-10 postgresql-10-postgis-2.5 postgresql-10-postgis-2.5-scripts git

sudo -u postgres createuser -e -E -P dbuser (geonatadmin)
(Entrez le password) 

sudo -u postgres createdb -e -E UTF8 -O dbuser (geonatadmin) dbname (geonature2db) 

Remarque :
ls /etc/init.d/ : pour lister les services
sudo service restart postgresql : vérification 

sudo -u postgres psql dbname (geonature2db) -c 'create extension postgis; create extension "uuid-ossp";'

--------------

* Etape 2 : Installer python3, pip et virtualenv :

python3 -m pip install --upgrade --user virtualenv
sudo apt install python3-pip

installer virtualenv :
export PATH=/home/username/.local/bin:$PATH (username = geonatadmin)
echo $PATH

virtualenv -p /usr/bin/python3 venv
source venv/bin/activate
python3 -m pip install -r requirements.txt




* Etape 3 : editer fichier de config (https://github.com/PnX-SI/GeoNature-citizen/blob/taxhub_rest/docs/devs/config_files.rst) :

cd ../config
## editer les paramètres dans default_config.toml

-	SQLALCHEMY_DATABASE_URI : "postgresql+psycopg2://dbuser(geonatadmin):password(***)@127.0.0.1:5432/dbname(geonature2db)"
-	URL_APPLICATION : 'https://ipserveur:4200/'
-	API_ENDPOINT : 'https://ipserveur:5002/api'
-	API_TAXHUB : 'http://ipserveur/taxhub/api/'

Notes pour la configuration des badges :
clé attendance (global): 
- CuSn = au bout de n médailles de bronze
- Ar : argent 
- Au : or

seniority : ancienneté de la plate-forme




* Etape 4: “init_launch_backend.rst” et creation referentiel géo (https://github.com/PnX-SI/GeoNature-citizen//blob/taxhub_rest/docs/devs/init_launch_backend.rst):

Si git n’est pas installé : (sudo apt install git)

Cloner le dépôt github de Geonature Citizen
git clone name (citizen)
git checkout branch_name
cd citizen/backend


# Création du référentiel des géométries communales
wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/public.sql -P /tmp
wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/ref_geo.sql -P /tmp
wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/ref_geo_municipalities.sql -P /tmp

psql -d geonature2db -h localhost -p 5432 -U geonatadmin -f /tmp/public.sql
sed 's/MYLOCALSRID/2154/g' /tmp/ref_geo.sql > /tmp/ref_geo_2154.sql
# set search_path = ref_geo, pg_catalog;
psql -d geonature2db -h localhost -p 5432 -U geonatadmin -f /tmp/ref_geo_2154.sql


# Pour restaurer en cas de besoin :
psql -d geonature2db -h localhost -U geonatadmin -f ~/citizen_taxhub_l_areas_dump.sql


if [ ! -f '/tmp/communes_fr_admin_express_2019-01.zip' ]
then
    wget  --cache=off http://geonature.fr/data/ign/communes_fr_admin_express_2019-01.zip -P /tmp
else
    echo "/tmp/communes_fr_admin_express_2019-01.zip already exist"
fi
unzip /tmp/communes_fr_admin_express_2019-01.zip -d /tmp/

psql -d geonature2db -h localhost -p 5432 -U geonatadmin -f /tmp/fr_municipalities.sql
psql -d geonature2db -h localhost -p 5432 -U geonatadmin -c "ALTER TABLE ref_geo.temp_fr_municipalities OWNER TO geonatadmin;"
psql -d geonature2db -h localhost -p 5432 -U geonatadmin -f /tmp/ref_geo_municipalities.sql
psql -d geonature2db -h localhost -p 5432 -U geonatadmin -c "DROP TABLE ref_geo.temp_fr_municipalities;"

# lancement du backend pour générer les schémas
# … en mode debug
export FLASK_ENV=development; export FLASK_DEBUG=1; export FLASK_RUN_PORT=5002; export FLASK_APP=wsgi; python -m flask run --host=0.0.0.0

#python3 wsgi.py

# enregistrement du module principal:
insert into gnc_core.t_modules values (1, 'main', 'main', 'main', NULL, false, '2019-05-26 09:38:39.389933', '2019-05-26 09:38:39.389933');

# enregistrement d’un programme exemple
psql -d geonature2db -h localhost -p 5432 -U geonatadmin -c "INSERT INTO gnc_core.t_programs VALUES (1, 'Au 68', 'inventaire  du 68', 'desc', NULL,	NULL,	1,	1,	't', '0106000020E6100000010000000103000000010000000500000001000070947C154042CA401665A5454001000070EE7C15402235D7E667A54540010000D81C7D1540AFBA27365AA5454000000040C47C1540DD9BD74A58A5454001000070947C154042CA401665A54540',	'2019-05-26 09:38:39.389933', '2019-05-26 09:38:39.389933');"

# enregistrement de citizen auprès de supervisord
/etc/supervisor/conf.d/geonature-citizen-service.conf
[program:citizen]
command = /home/geonatadmin/citizen/backend/start_gunicorn.sh
autostart=true
autorestart=true
stdout_logfile = /var/log/supervisor/citizen.log
redirect_stderr = true

# /home/geonatadmin/citizen/backend/start_gunicorn.sh doit avoir le bit executable !

# pour les images et les badges
mkdir ~/citizen/media
chmod g+w ~/citizen/media

sudo vim /etc/apache2/sites-available/citizen.conf

sudo a2ensite citizen 

sudo systemctl reload apache2



* Etape 5:  Font End (https://github.com/PnX-SI/GeoNature-citizen/tree/dev/docs/devs/init_launch_frontend.rst

):

cd citizen/frontend/

nvm use --lts  # Now using node v10.16.0 (npm v6.9.0)
si pas installé : nvm install --lts (remplacer lts par la dernière version)

cp -v src/assets/badges_* ../media/


# éditer la conf
cp src/conf*.ts.sample src/conf/  # ajuster la conf

# copier le template css alternatif
cp src/custom/custom.css.template src/custom/custom.css

# Lancer le front 
npm run start -- --host=0.0.0.0


# ré génération des locales après modification de l’UI:
for lang in 'fr' 'en'; do npm run -- ng xi18n --output-path locale --out-file _messages.${lang}.xlf --i18n-locale ${lang}; done
