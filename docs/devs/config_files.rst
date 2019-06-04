****************************************
Renseigner les fichiers de configuration
****************************************

Modifier le fichier de configuration
####################################


Côté backend
************

Les fichiers de configuration sont dans le dossier ``config``.
Le fichier à modifier est default_config.toml.
Le fichier utilisé par GeoNature-citizen est default_config.toml.
Il peut-être créé en copiant le fichier ``default_config.toml.example`` \
vers ``default_config.toml``:

.. code-block:: bash

    $ cp default_config.toml.example default_config.toml

Editez alors les différents paramètres de ce fichier.

.. code-block:: python

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
    API_ENDPOINT = 'http://url.com/gncitizen/api:API_PORT'        # Replace my_url.com by your domain or IP
    API_PORT = 5002 # 5000 déjà utilisé par taxhub
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


Côté frontend
*************

Le fichier de configuration du frontend se trouve dans le dossier ``./frontend/src/conf``

Le fichier à créer est ``app.config.ts``
Il peut-être créé en copiant le fichier ``app.config.ts.sample`` \
vers ``app.config.ts``:

.. code-block:: bash

    $ cp default_config.toml.example default_config.toml

Editez alors les différents paramètres de ce fichier.

.. code-block:: typescript

    export const AppConfig = {
        "appName": "GeoNature-citizen",
        "API_ENDPOINT":"http://localhost:5002/api",
        "API_TAXHUB":"http://localhost:5000/api",
        "FRONTEND":{
            "PROD_MOD":true,
            "MULTILINGUAL":false,
            "DISPLAY_FOOTER": true,
            "DISPLAY_TOPBAR": false,
            "DISPLAy_SIDEBAR": true
        },
        "URL_APPLICATION":"http://localhost:4200"
    }
