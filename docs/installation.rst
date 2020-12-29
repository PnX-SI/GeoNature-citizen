====================================
Installation de GeoNature-citizen
====================================

.. highlight:: sh
.. _TaxHub: https://github.com/PnX-SI/TaxHub/
.. _Debian: https://www.debian.org
.. _Ubuntu: https://ubuntu.com



Prérequis
=========

Cette documentation suppose que vous avez les bases de l'utilisation de la ligne de commande sur un serveur linux.

Dépendances
-----------


La présente documentation présente l'installation de GeoNature-citizen dans un environnement Linux Debian_ (version 9 et supérieures) et Ubuntu_ (version 18.04 et supérieures).

La procédure d'installation dépend de TaxHub_, et de certains paquets, qu'il faut installer.

Commencez par installer les paquets suivants :

::

  su # vous aurez besoin du mot de passe de l'utilisateur root
  apt install sudo git python3 python3-pip python3-venv curl unzip -y


Ensuite : 

- installez TaxHub, si ce n'est pas déjà fait. Vous pouvez suivre la documentation officielle : https://taxhub.readthedocs.io/fr/latest/

- Configurer le serveur : https://taxhub.readthedocs.io/fr/latest/serveur.html#installation-et-configuration-du-serveur

- Configurer PostgreSQL : https://taxhub.readthedocs.io/fr/latest/serveur.html#installation-et-configuration-de-posgresql

- Configuration et installation de l’application : https://taxhub.readthedocs.io/fr/latest/installation.html

**Notez bien les identifiants de connexion à la base de données de Taxhub, car ils seront réutilisés ici.**


Créer un utilisateur pour l'installation
----------------------------------------

Il faut un utilisateur qui soit capable d'utiliser la commande ``sudo``.

Créer un utilisateur appartenant au groupe ``sudo``. Dans cette documentation, nous allons le nommer ``geonatadmin``, mais vous pouvez remplacer cette par une autre si vous le souhaitez. Soyez juste consistant tout au long de l'installation.

::

  su # vous aurez besoin du mot de passe de l'utilisateur root
  # Création de l'utilisateur (ceci vous demandera un mot de passe)
  adduser --gecos "" geonatadmin
  # Ajout dans le groupe sudo
  adduser geonatadmin sudo
  # Connexion avec cet utilisateur
  su - geonatadmin

Mettre la localisation en français
------------------------------------


Générer les locales ``en_US.UTF8`` et ``fr_FR.UTF-8`` puis choisir ``fr_FR.UTF-8`` comme locale par default:

::

  sudo dpkg-reconfigure locales

Si le message d'erreur suivant apparait ``sudo: pas de tty présent et pas de programme askpass spécifié``, ajoutez remplacez ``sudo`` par ``sudo -S``.

Cette commande va afficher une liste de codes internationaux, vous pouvez naviguer avec les flèches du clavier et sélectionner une valeur avec la touche espace. Les valeurs sélectionnées ont une étoile (``*``) devant.

Choisissez deux valeurs: ``en_US.UTF8`` et ``fr_FR.UTF-8``, puis validez.

Pour valider, utilisez la touche de tabulation jusqu'à atteindre ``<ok>`` et appuyez sur la touche entrée.

Une nouvelle liste apparait, cette fois, déplacez-vous sur ``fr_FR.UTF-8``, et sans avoir besoin de valider avec espace, tabulez jusqu'à ``<ok>`` et appuyez sur la touche entrée.


Installation de GeoNature-citizen
=================================

Récupération du code source
---------------------------

Téléchargez et décompressez la dernière version de l'application (actuellement v0.3.0)

::

  # Se positionner dans le dossier par défaut de l'utilisateur (ici /home/geonatadmin)
  cd ~ 
  # Téléchargement de l'application
  curl -OJL https://github.com/PnX-SI/GeoNature-citizen/archive/v0.3.0.zip 
  # Décompression de l'application
  unzip GeoNature-citizen-0.3.0.zip
  # Renommage du dossier contenant l'application
  mv GeoNature-citizen-0.3.0 gncitizen

.. Si nécessaire, vous pouvez récupérer une branche ou un tag particulier avec ``cd GeoNature-citizen && git checkout nom_du_tag_ou_de_la_branch``. Par defaut nous utiliserons la branche master, et il n'y a donc rien à faire.

Décompréssez

Installer les dépendances python
--------------------------------

::

  cd ~/gncitizen/backend
  # Création et activation d'un environnement virtuel
  python3 -m venv venv
  source venv/bin/activate
  # Installation des dépendances
  python3 -m pip install wheel
  python3 -m pip install -r requirements.txt

Les warnings avec le message "`Failed building wheel`" peuvent être ignorés.

Éditer le fichier de configuration
------------------------------------

Créer le fichier de configuration avec des valeurs par défaut :

::

  cd ~/gncitizen/config
  cp default_config.toml.template default_config.toml

Vous devez maintenant l'éditer :

::

  nano default_config.toml

Et changer les valeurs pour correspondre à la réalité de votre installation. Faites attention à bien respecter les guillemets.

**Quelques valeurs importantes :**

SQLALCHEMY_DATABASE_URI
~~~~~~~~~~~~~~~~~~~~~~~~~

GeoNature-citizen a pour le moment des références au schéma ``taxonomie`` de TaxHub_ (pour l'utilisation du référentiel taxonomique `TaxRef
<https://inpn.mnhn.fr/programme/referentiel-taxonomique-taxref>`_). Ce schéma doit donc être installé dans cette même base de données. 
L'instance de TaxHub définissant les listes d'espèces et les médias associés peut toutefois être une autre instance indépendante.

La valeur de ``SQLALCHEMY_DATABASE_URI`` doit donc être changée pour correspondre aux valeurs utilisées pour se connecter à la BDD de TaxHub.

Exemple, si on se connecte à la BDD ``referentielsdb``, avec l'utilisateur ``geonatuser`` et le mot de passe ``admin123``:

::

  SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://geonatuser:admin123@127.0.0.1:5432/referentielsdb"

Référez-vous donc à la configuration de TaxHub pour saisir ce paramètre.


Les clés secrètes
~~~~~~~~~~~~~~~~~~

Il y a 3 clés secrètes à changer : ``JWT_SECRET_KEY``, ``SECRET_KEY`` et ``CONFIRM_MAIL_SALT``.

Elles doivent être changées pour contenir chacune une valeur secrète différente, connue de vous seul. Vous n'aurez jamais à saisir ces valeurs plus tard, donc faites les très longues.

Pour se simplifier la vie, on peut utiliser http://nux.net/secret pour générer une valeur pour chaque clé, et simplement la copier/coller. Il suffit de recharger la page pour obtenir une nouvelle valeur.

DEBUG
~~~~~

À mettre sur ``false`` si on est en production.

URL_APPLICATION
~~~~~~~~~~~~~~~

L'URL que l'utilisateur final va taper dans son navigateur pour aller visiter votre instance de GeoNature-citizen. Elle doit contenir votre nom de domaine ou l'adresse IP de votre serveur.

Exemple :

http://votredomaine.com/citizen

Ou:

http://ADRESSE_IP/citizen

Notez que nous suffixons avec "citizen", ce qui n'est pas obligatoire, mais nous utiliserons cette configuration pour Apache plus loin. Quelle que soit la valeur choisie, gardez-la sous la main pour cette dernière.

EMAILS
~~~~~~~~~~~~~~~~~~

L'inscription à GeoNature-citizen n'est pas obligatoire pour les contributeurs. 

Toutefois, si un contributeur souhaite créer un compte, un email de vérification de son adresse mail lui est transmis. Cet email contient un lien permettant l'activation du compte. 

Pour cela, il est nécessaire de configurer un serveur SMTP permettant l'envoi de ces emails de vérification. 

La partie ``EMAILS`` est donc indispensable et il faut la remplir sans erreur.

Les entrées ``RESET_PASSWD`` et ``CONFIRM_EMAIL`` seront utilisées pour formater les emails envoyés par GeoNature-citizen. Changez au moins les deux valeurs ``FROM`` pour correspondre à votre propre email.

Pour que l'envoi fonctionne, il faut ensuite configurer la partie ``MAIL`` avec les paramètres d'envoi via SMTP de votre fournisseur d'email. Ce dernier est le seul à pouvoir vous fournir les informations nécessaires à cette configuration. Chaque valeur de cette section est importante et conditionne si l'email de confirmation va partir ou non. Vérifiez bien les fautes de frappe, et faites-vous aider par quelqu'un qui a l'habitude de configurer l'envoi d'email (via thunderbird, outlook, etc.) si vous le pouvez.

Il faut également bien renseigner la variable ``URL_APPLICATION`` qui est utilisée pour générer l'adresse du lien d'activation du compte.

Attention, Gmail peut être _particulièrement_ difficile à configurer, car il faut aller sur son compte Google pour changer les paramètres de sécurité. Utilisez un autre service si vous le pouvez.

Pour activer un compte manuellement, il est possible de lancer une inscription via le site, et, même sans recevoir l'email, de changer la valeur de la colonne ``active`` du compte utilisateur dans la table ``t_users``. Cela peut permettre de tester le reste de l'installation même si la partie email n'est pas encore prête.

Pour essayer de comprendre pourquoi un email n'est pas envoyé, on peut regarder les erreurs présentes dans ``Geonature-Citizen/var/log/gn_errors.log`` intitulées "*send confirm_email failled.*"

Voici un exemple de configuration avec office365 :

.. code-block:: text

  [RESET_PASSWD]
    SUBJECT = "Changement de votre mot de passe"
    FROM = 'monnom@mondomaine.fr'    
    TEXT_TEMPLATE = '''
    Bonjour,\r\nVoici votre nouveau mot de passe :\r\n{passwd}\r\n"{app_url}
    '''
    HTML_TEMPLATE = '''
    Bonjour,<br /><br />Voici votre nouveau mot de passe :<br />
    {passwd}
    <br /><br />"
    <a href="{app_url}">Connexion</a>'
    '''


  [CONFIRM_EMAIL]
    SUBJECT = "Activez votre compte"
    FROM = 'monnom@mondomaine.fr'
    HTML_TEMPLATE = '''<p> Bonjour,</p><br /><p>Nous vous confirmons que votre compte a bien été créé.</p>
     <p> Afin d'activer votre compte veuillez <a href="{activate_url}">cliquer ici.</a>
     <p>Nous vous souhaitons la bienvenue sur notre site.</p><br />
     <p>Bien à vous.</p>
    '''


  [MAIL]
    MAIL_USE_SSL = false
    MAIL_HOST = 'smtp.office365.com'
    MAIL_PORT = 587   # mandatory SSL port
    MAIL_AUTH_LOGIN = 'monnom@mondomaine.fr'
    MAIL_AUTH_PASSWD = 'monmotdepasse'
    MAIL_STARTTLS = true



API_ENDPOINT
~~~~~~~~~~~~~~~

L'URL que va utiliser GeoNature-citizen pour exposer ses données. Cette valeur doit commencer comme ``URL_APPLICATION``, mais finir par ``/api`` et utiliser le même port que définit par ``API_PORT`` (5002 par défaut, vous n'avez probablement pas besoin de le changer).

Exemple :

http://votredomaine.com:5002/citizen/api

Gardez cette valeur sous la main, nous l'utiliserons dans la configuration Apache plus loin.

Authentification Mapbox
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Si vous avez des identifiants Mapbox, inscrivez-les dans ``MAPBOX_MAP_ID`` et ``MAPBOX_ACCESS_TOKEN``. Ils sont utilisés pour afficher des fonds de carte dans la partie administration des programmes.

Installation du backend et de la base des données
-------------------------------------------------


Création du référentiel des géométries communales
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

On continue d'utiliser les identifiants de la BDD de TaxHub, ici avec les exemples ``referentielsdb`` et ``geonatuser``.

Téléchargez les données SQL depuis le dépôt de GeoNature:

::

  wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/public.sql -P /tmp
  wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/ref_geo.sql -P /tmp
  wget https://github.com/PnX-SI/GeoNature/raw/master/data/core/ref_geo_municipalities.sql -P /tmp

Pour importer les données dans la BDD, munissez-vous du mot de passe que vous avez choisi lors de la création de celle-ci, puis (dans cet exemple, on utilise le système de coordonnées avec le SRID 2154) :

:: 

  sudo su postgres # les extensions doivent être ajoutées par un admin
  psql -d referentielsdb -c "CREATE EXTENSION postgis;"
  exit
  psql -d referentielsdb -h localhost -p 5432 -U geonatuser -f /tmp/public.sql
  # Choix du SRID ici
  sed 's/MYLOCALSRID/2154/g' /tmp/ref_geo.sql > /tmp/ref_geo_2154.sql
  psql -d referentielsdb -h localhost -p 5432 -U geonatuser -f /tmp/ref_geo_2154.sql

Si les communes françaises ne sont pas déjà dans la base, les importer :

::

    wget  --cache=off http://geonature.fr/data/ign/communes_fr_admin_express_2019-01.zip -P /tmp
    unzip /tmp/communes_fr_admin_express_2019-01.zip -d /tmp/
    psql -d referentielsdb -h localhost -p 5432 -U geonatuser -f /tmp/fr_municipalities.sql
    psql -d referentielsdb -h localhost -p 5432 -U geonatuser -c "ALTER TABLE ref_geo.temp_fr_municipalities OWNER TO geonatuser;"
    sed -i "s/, geojson\w*//g" /tmp/ref_geo_municipalities.sql
    psql -d referentielsdb -h localhost -p 5432 -U geonatuser -f /tmp/ref_geo_municipalities.sql
    psql -d referentielsdb -h localhost -p 5432 -U geonatuser -c "DROP TABLE ref_geo.temp_fr_municipalities;"

Générer les schémas de GeoNature-citizen
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Il faut maintenant faire au moins une requête au serveur pour le forcer à créer les tables dont il a besoin.

Lancement du backend pour générer les schémas :

::

    # assurez vous de bien être toujours connecté en tant que geonatadmin
    # avec le venv activé avant de lancer cette étape
    sudo chown geonatadmin:geonatadmin /home/geonatadmin/gncitizen/ -R
    cd ~/gncitizen/backend
    export FLASK_ENV=development; export FLASK_DEBUG=1; export FLASK_RUN_PORT=5002; export FLASK_APP=wsgi;
    nohup python -m flask run --host=0.0.0.0 > /dev/null 2>&1 &
    serverPID=$!
    sleep 1 && wget http://127.0.0.1:5002/ # ceci devrait renvoyer 404: NOT FOUND.
    kill $serverPID


Enregistrement du module principal :

::

  psql -d referentielsdb -h localhost -p 5432 -U geonatuser -c "insert into gnc_core.t_modules values (1, 'observations', 'observations', 'observations', NULL, false, now(), now());"

Vous pouvez créer un programme test avec la ligne de commande suivante :

::

  psql -d referentielsdb -h localhost -p 5432 -U geonatuser -c "INSERT INTO gnc_core.t_programs VALUES (1, 'Au 68', 'inventaire  du 68', 'desc', NULL,  NULL, 1,  100,  't', '0106000020E6100000010000000103000000010000000500000001000070947C154042CA401665A5454001000070EE7C15402235D7E667A54540010000D81C7D1540AFBA27365AA5454000000040C47C1540DD9BD74A58A5454001000070947C154042CA401665A54540',  now(), now());"

Celui-ci suppose l'existence d'une liste de taxons dont l'ID est 100, qui normalement existe sur TaxHub par défaut. Remplacez la valeur 100 par une liste existante si ce n'est pas le cas, ou créez une liste avec cet ID sur TaxHub.

Mettre en place le système de badge
------------------------------------------------------


::

  mkdir ~/gncitizen/media
  cp -v ~/gncitizen/frontend/src/assets/badges_* ~/gncitizen/media/

Vous pouvez aussi optionnellement modifier le fichier ``~/gncitizen/config/badges_config.py`` pour changer les noms, images et nombre d'observations minimum pour obtenir les badges, par programme.

Lancement du service
------------------------------------------------------

D'abord, créez un fichier de configuration supervisor (``sudo nano /etc/supervisor/conf.d/geonature-citizen-service.conf``) qui va contenir ceci :

::

  [program:citizen]
  command=/home/geonatadmin/gncitizen/backend/start_gunicorn.sh
  user=geonatadmin
  autostart=true
  autorestart=true
  stdout_logfile=/var/log/supervisor/citizen.log
  redirect_stderr=true

Puis lancez le chargement du service :

::

  sudo chown geonatadmin:geonatadmin ~/gncitizen/ -R
  sudo supervisorctl reload


Installation du frontend
------------------------------------------------------

Installer l'environnement javascript
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

  cd ~/gncitizen/frontend/
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
  source ~/.bashrc
  nvm install
  npm install


Éditer la conf et les fichiers de personnalisation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

De nombreux fichiers peuvent être configurés ou personnalisés côté frontend. Ils sont nommés avec l'extension ``.template``, et il est nécessaire de les copier une fois sans cette extension pour avoir des fichiers de base sur lesquels travailler :

::

  cd ~/gncitizen/frontend/
  find . -iname "*.template" -exec bash -c 'for x; do cp -n "$x" "${x/.template/}"; done' _ {} +

Ces commandes vont créer les fichiers de configuration comme :

::

  src/conf/app.config.ts # configuration du front ends: URL, ports, messages, etc
  src/conf/map.config.ts # tiles de carte

Une modification courante est de changer ``details_espece_url`` dans ``app.config.ts`` pour faire pointer l'adresse vers un autre service. Attention à garder ``cd_nom`` à la fin.

Il y a aussi des feuilles de style qui permettent de personnaliser la mise en page de certaines pages :

::

  src/custom/custom.css # tout le site
  src/custom/footer/footer.css # pied de page
  src/custom/home/home.css # acceuil
  src/custom/about/about.css # à propos

Et des patrons HTML qui permettent de changer le contenu de certaines pages :

::

  src/custom/about/about.html # a propos
  src/custom/footer/footer.html # pied de page
  src/custom/home/home.html # accueil

Vous pouvez modifier ces fichiers, leur contenu apparaitra sur le site.

Servir l'application en mode monopage
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Faire le build du code du frontend
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

Après chaque modification sur un des éléments qui concerne le frontend, il faut relancer le processus de build :

::

  cd ~/gncitizen/frontend/
  npm run ng build -- --prod

Si vous souhaitez que l'application soit disponible depuis un chemin spécifique (ex: ``mondomaine.org/citizen``), remplacez la dernière commande par 

::

  npm run ng build -- --prod --base-href=/citizen/


Configuration d'Apache
++++++++++++++++++++++

Voici un exemple de fichier de configuration Apache, qu'il faudra adapter à votre cas d'usage.
Si vous souhaitez que l'application soit disponible depuis un chemin spécifique (ex: ``mondomaine.org/citizen``), pensez à décommenter la ligne ``Alias`` 


::

  <VirtualHost *:80>

    ServerName mondomaine.org
    # Les logs sont sockés dans /var/log/apache2
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    # Les fichiers statiques tels que les images, le js et le css sont servis
    # via 4 routes:
    # - / -> ./frontend/dist/browser/, Ex: /index.html
    # - /assets/ -> ./frontend/dist/browser/assets, Ex: /assets/default_program.jpg
    # - /citizen/api/media/ (apache) -> ./frontend/dist/browser/assets, Ex: /citizen/api/media/logo.png
    # - /citizen/api/media/ (served by python) -> ./media/, Ex: /api/media/obstax_60612_1_20200822_125238.png
    # Le fichier essaye donc d'accomoder ces routes

    # Tout ce qui arrive sur / va dans DocumentRoot, et donc tous les fichiers
    # statiques sont par défaut pris dans ce dossier
    DocumentRoot /home/geonatadmin/gncitizen/frontend/dist/browser/
    # Si vous souhaitez que l'application soit disponible depuis un chemin spécifique (ex: `mondomaine.org/citizen`), décommentez la ligne suivante
    #Alias /citizen "/home/geonatadmin/gncitizen/frontend/dist/browser/"

    <Directory /home/geonatadmin/gncitizen/frontend/dist/browser/>
        Require all granted
    </Directory>

    # si aucun fichier n'est demandé, servir index.html
    FallbackResource /index.html
    ErrorDocument 404 /index.html

    # Les demandes qui arrivent sur /citizen/api/media/ peuvent correspondre soit
    # à un fichier dans le dossier assets, soit à un une demande de fichier à l'API.
    # Dans un premier temps, on vérifie que le fichier existe dans assets, et si
    # oui, on réécrit l'URL pour le servir.
    RewriteEngine on
    RewriteCond "%{DOCUMENT_ROOT}/assets/$1" -f
    RewriteRule "^/citizen/api/media/(.*)" "/assets/$1"

    # Si on arrive ici, c'est qu'il n'existe pas de fichier dans assets portant
    # ce nom, dans ce cas on redirige tout vers l'API

    # Les ports utilisés pour ces 3 Locations doivent correspondre aux ports
    # utilisés par ces services.

    <Location /citizen/api>
      ProxyPass http://127.0.0.1:5002/api retry=0
      ProxyPassReverse  http://127.0.0.1:5002/api
    </Location>

    # La suite de la configuration ne concerne plus les fichiers statiques
    # mais passe simplement les requêtes à un des 3 services

    # Chemin de taxhub
    <Location /taxhub>
    ProxyPass  http://127.0.0.1:5000/ retry=0
    ProxyPassReverse  http://127.0.0.1:5000/
    </Location>


  </VirtualHost>

Ce fichier se met dans sites-available, par exemple ``/etc/apache2/sites-available/citizen.conf``. Il faut ensuite faire un lien symbolique vers sites-enabled :

::

  sudo a2ensite citizen.conf

On vérifie la configuration d'Apache :

::

  sudo apachectl -t

Si tout est OK, alors on redémarre le service Apache :

::

  sudo service apache2 restart


Servir l'application en mode rendu côté serveur (*SSR = Server side rendering*)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Installer l'application pm2 pour créer un service permanent
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

`PM2 <https://pm2.keymetrics.io/>`_  permet de lancer une application Javascript en tâche de fond.

::

  cd ~/gncitizen/frontend
  nvm use
  npm install -g pm2


Faire le build du code du frontend en mode SSR et créer un service pour le frontend
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

Après chaque modification sur un des éléments qui concerne le frontend, il faut relancer le processus de build :

::

  npm run build:i18n-ssr

Puis lancer le service pour le mode SSR

::

  pm2 start dist/server.js --name gncitizen
  pm2 save



Configuration d'Apache
++++++++++++++++++++++

Voici un exemple de fichier de configuration Apache, qu'il faudra adapter à votre cas d'usage.

::

  <VirtualHost *:80>

    ServerName mondomaine.org
    # Les logs sont sockés dans /var/log/apache2
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    # Les fichiers statiques tels que les images, le js et le css sont servis
    # via 4 routes:
    # - / -> ./frontend/dist/browser/, Ex: /index.html
    # - /assets/ -> ./frontend/dist/browser/assets, Ex: /assets/default_program.jpg
    # - /citizen/api/media/ (apache) -> ./frontend/dist/browser/assets, Ex: /citizen/api/media/logo.png
    # - /citizen/api/media/ (served by python) -> ./media/, Ex: /api/media/obstax_60612_1_20200822_125238.png
    # Le fichier essaye donc d'accomoder ces routes

    # Tout ce qui arrive sur / va dans DocumentRoot, et donc tous les fichiers
    # statiques sont par défaut pris dans ce dossier

    # Les demandes qui arrivent sur /citizen/api/media/ peuvent correspondre soit
    # à un fichier dans le dossier assets, soit à un une demande de fichier à l'API.
    # Dans un premier temps, on vérifie que le fichier existe dans assets, et si
    # oui, on réécrit l'URL pour le servir.
    RewriteEngine on
    RewriteCond "%{DOCUMENT_ROOT}/assets/$1" -f
    RewriteRule "^/citizen/api/media/(.*)" "/assets/$1"

    # Si on arrive ici, c'est qu'il n'existe pas de fichier dans assets portant
    # ce nom, dans ce cas on redirige tout vers l'API

    # Les ports utilisés pour ces 3 Locations doivent correspondre aux ports
    # utilisés par ces services.

    # Chemin de GeoNature-citizen (frontend)
    <Location />
      ProxyPass http://127.0.0.1:4000/ retry=0
      ProxyPassReverse  http://127.0.0.1:4000/
    </Location>


    # Chemin de GeoNature-citizen (API)
    <Location /citizen/api>
      ProxyPass http://127.0.0.1:5002/api retry=0
      ProxyPassReverse  http://127.0.0.1:5002/api
    </Location>


    # La suite de la configuration ne concerne plus les fichiers statiques
    # mais passe simplement les requêtes à un des 3 services


    # Chemin de l'interface web de taxhub
    <Location /taxhub>
    ProxyPass  http://127.0.0.1:5000/ retry=0
    ProxyPassReverse  http://127.0.0.1:5000/
    </Location>

  </VirtualHost>

Ce fichier se met dans sites-available, par exemple `/etc/apache2/sites-available/citizen.conf`. Il faut ensuite faire un lien symbolique vers sites-enabled :

::

  sudo a2ensite citizen.conf

On vérifie la configuration d'Apache :

::

  sudo apachectl -t

Si tout est OK, alors on redémarre le service Apache :

::

  sudo service apache2 restart



Sécuriser l'interface d'administration
++++++++++++++++++++++++++++++++++++++

L'interface d'administration de GeoNature-citizen n'est par défaut pas sécurisée. Sa sécurisation passe par une configuration spécifique du serveur Apache2.


::

  mkdir -p /etc/apache2/passwd
  htpasswd -c /etc/apache2/passwd/gncitizen admin

Puis ajouter les lignes suivantes dans la configuration Apache2 du site (``nano /etc/apache2/sites-available/citizen.conf``), après le bloc  ``<Location /citizen/api>...</Location>``.


:: 

    # Sécurisation du chemin du backoffice
    <Location /citizen/api/admin>
    AuthType Basic
    AuthName "Restricted Area"
    AuthBasicProvider file
    AuthUserFile "/etc/apache2/passwd/gncitizen"
    Require user admin
    </Location>
