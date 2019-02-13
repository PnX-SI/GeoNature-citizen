Installer GeoNature-citizen en mode développement
=================================================

.. warning::

    GeoNature-citizen nécessite l'installation préalable de TaxHub > https://taxhub.readthedocs.io/fr/latest/


**********************
Contribuer avec GitHub
**********************
.. warning::

    Aucun commit n'est réalisé directement sur le dépot principal du projet (https://github.com/PnX-SI/GeoNature-citizen).
    Pour contribuer, il est nécessaire de faire un *fork* du projet, de travailler sur ce fork et de proposer des mises à jour du dépot principal par *pull request*.

Faire un fork du projet
#######################

`Tout est ici <https://help.github.com/articles/fork-a-repo/>`_


Cloner le projet
################

Dans un terminal::

    $ git clone git@github.com:YOUR_NAME/GeoNature-citizen.git

    Cloning into `GeoNature-citizen`...
    remote: Counting objects: 10, done.
    remote: Compressing objects: 100% (8/8), done.
    remove: Total 10 (delta 1), reused 10 (delta 1)
    Unpacking objects: 100% (10/10), done.

Récupérer les mises à jour du dépot principal
*********************************************

Dans un terminal, dans le dossier cloné::

    $ git remote add upstream git@github.com:PnX-SI/GeoNature-citizen.git

Pour vérifier que votre clone local puisse suivre votre
dépot (*origin*) et le dépot principal (*upstream*)::

    $ git remove -v

    origin	git@github.com:YOUR_NAME/GeoNature-citizen.git (fetch)
    origin	git@github.com:YOUR_NAME/GeoNature-citizen.git (push)
    upstream	git@github.com:PnX-SI/GeoNature-citizen.git (fetch)
    upstream	git@github.com:PnX-SI/GeoNature-citizen.git (push)

Créer votre propre branche de développement
*******************************************

Pour créer votre branche de développement, dans un terminal::

    $ git checkout -b dev_mabranche


****************************************
Renseigner les fichiers de configuration
****************************************

Modifier le fichier de configuration
####################################

Les fichiers de configuration sont dans le dossier ``config``.
Le fichier à modifier est default_config.toml.
Le fichier utilisé par GeoNature-citizen est default_config.toml.
Il peut-être créé en copiant le fichier ``default_config.toml.example`` vers ``default_config.toml``::

    $ cp default_config.toml.example default_config.toml

Editez alors les différents paramètres de ce fichier.

::

    # Database
    SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://geonatuser:monpassachanger@127.0.0.1:5432/geonaturedb"
    SQLALCHEMY_TRACK_MODIFICATIONS = false

    # JWT Auth
    JWT_SECRET_KEY = 'jwt-secret-string'
    JWT_BLACKLIST_ENABLED = true
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']

    # Application

    appName = 'GeoNature-citizen'                               # Application name in the home page
    DEFAULT_LANGUAGE = 'fr'

    # Nom du zonage du portail
    PORTAL_AREA_NAME = 'zonage'

    DEBUG = true

    URL_APPLICATION = 'http://url.com/gncitizen'         # Replace my_url.com by your domain or IP
    API_ENDPOINT = 'http://url.com/gncitizen/api'        # Replace my_url.com by your domain or IP
    API_PORT = 5001 # 5000 déjà utilisé par taxhub
    API_TAXHUB ='http://127.0.0.1:5000/api/'

    SESSION_TYPE = 'filesystem'
    SECRET_KEY = 'MyS3cr3tK3y'
    COOKIE_EXPIRATION = 7200
    COOKIE_AUTORENEW = true
    TRAP_ALL_EXCEPTIONS = false
    HTTPS = false
    MEDIA_FOLDER = 'static/medias'
    # File
    # BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = 'static/medias'

    # Front end configuration
    [FRONTEND]
        PROD_MOD = false
        DISPLAY_HEADER = false
        DISPLAY_FOOTER = false
        MULTILINGUAL = false

    [MAILERROR]
        MAIL_ON_ERROR = false
        MAIL_HOST = 'host mail'
        HOST_PORT = host mail port
        MAIL_FROM = 'Email from'
        MAIL_USERNAME = 'email username'
        MAIL_PASS = 'email to'
        MAIL_TO = 'email to'


    # API flasgger main config
    [SWAGGER]
        title = 'GeoNature-Citizen API'
        version = 'x.x.x'
        produces = ["application/json"]
        consumes = ["application/json"]


*******************************
Configurer et lancer le backend
*******************************

Installer l'environnement virtuel python
########################################

La création de l'environnement virtuel python3 nécessite ``virtualenv``
ou ``pyenv`` ou tout autre outil équivalent (ex: pyenv)::

    cd backend
    virtualenv -p /usr/bin/python3 venv

L'activation de cet environnement se fait avec la commande suivante::

    source venv/bin/activate

Et l'installation des librairies nécessaires à GeoNature-citizen avec la commande suivante::

    pip install -r requirements.txt


Lancement du Backend
####################

Pour lancer l'application Backend, il suffit d'éxécuter les commandes suivantes
depuis l'environnement virtuel python::

    cd backend
    source venv/bin/activate
    python -m wsgi.py

Vous pouvez alors aller sur la page de documentation de l'API à l'adresse suivant ``http://VOTRE_HOTE:5001/apidocs``, en local, ce sera `http://localhost:5001/apidocs <http://localhost:5001/apidocs>`_.

********************************
Configurer et lancer le frontend
********************************

.. warning::

    A venir


Gestion du Server Side Rendering
################################

Le SSR a été intégré au projet à partir de la commande:

    npm run ng add @nguniversal/express-engine --clientProject frontend

NB: L'intégration Leaflet.MarkerCluster a nécessité de déclarer une variable globale ``L`` et d'y importer Leaflet; c'est dans le script ``server.ts``.

Les modules ``BrowserTransferState`` et ``ServerTransferState`` importés, nous avons créé un couple ``{clé: valeur}`` pour être transféré du serveur au client.

La clé est créée avec la fonction factory `makeStateKey <https://angular.io/api/platform-browser/StateKey#description>`_.

    const PROGRAMS_KEY = makeStateKey("programs");

Le transfert d'état s'effectue avec des accesseurs:

    this.programs = this.state.get(PROGRAMS_KEY, null as any);
    if (!this.programs) {
      /*
        code exécuté côté serveur Node, express
        qui effectue donc un appel à l'API de GN-Citizen
        et génère une capture d'état
      */

      this.state.set(PROGRAMS_KEY, programs as any);
    } else {
      /*
        code exécuté côté présentation qui consomme l'état "cristallisé"
        transféré depuis le serveur.
      */
    }

Le ``build`` et le démarrage du service sur le port 4000 s'effectue via le oneliner:

    npm run build:ssr && npm run serve:ssr

La redirection de port pourrait se faire au niveau du serveur web / reverse proxy, avec un filtre sur l'entête de requête ``User-Agent``
