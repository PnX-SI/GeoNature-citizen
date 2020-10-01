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

    # Debug
    DEBUG = true
    SQLALCHEMY_DEBUG_LEVEL = 'WARNING'

    URL_APPLICATION = 'http://url.com/gncitizen'         # Replace my_url.com by your domain or IP
    API_ENDPOINT = 'http://url.com:API_PORT/gncitizen/api'        # Replace my_url.com by your domain or IP
    API_PORT = 5002 # 5000 déjà utilisé par taxhub
    API_TAXHUB ='http://127.0.0.1:5000/api/'

    # FlaskAdmin
    # credentials for loading map tiles from mapbox
    MAPBOX_MAP_ID = '...'
    MAPBOX_ACCESS_TOKEN = '...'
    DEFAULT_CENTER_LAT = 45
    DEFAULT_CENTER_LONG = 5


    SECRET_KEY = 'MyS3cr3tK3y'
    CONFIRM_MAIL_SALT = 'your-secret-salt' # secret salt for corfirm mail token

    MEDIA_FOLDER = 'media'


    [RESET_PASSWD]
        SUBJECT = "Link"
        FROM = 'contact@geonature-citizen.fr'
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
        FROM = 'contact@geonature-citizen.fr'
        HTML_TEMPLATE = '''<p> Bonjour,</p><br /><p>Nous vous confirmons que votre compte a bien été créé.</p>
        <p> Afin d'activer votre compte veuillez <a href="{activate_url}">cliquer ici.</a>
        <p>Nous vous souhaitons la bienvenue sur notre site.</p><br />
        <p>Bien à vous.</p>
        '''

    [MAIL]
        MAIL_USE_SSL = false
        MAIL_STARTTLS = true
        MAIL_HOST = 'smtpd host'
        MAIL_PORT = 493   # mandatory SSL port
        MAIL_AUTH_LOGIN = 'smtpd/relay host username'
        MAIL_AUTH_PASSWD = 'smtpd/relay host password'


    # API flasgger main config
    [SWAGGER]
        title = 'GeoNature-Citizen API'
        version = 'x.x.x'
        produces = ["application/json"]
        consumes = ["application/json"]



Côté frontend
*************

Les fichiers de configuration du frontend se trouvent dans le dossier ``./frontend/src/conf``

Les fichiers à créer sont ``app.config.ts`` et ``map.config.ts``.
Il sont créés lors de l"installation ou en copiant les fichiers ``app.config.ts.sample`` \
vers ``app.config.ts`` et ``map.config.ts``:

.. code-block:: bash

    $ cp app.config.ts.template app.config.ts
    $ cp map.config.ts.template map.config.ts

Editez alors les différents paramètres de ce fichier.

.. code-block:: typescript

    export const AppConfig = {
        appName: "GeoNature-citizen",
        API_ENDPOINT:"http://localhost:5002/api",
        API_TAXHUB:"http://localhost:5000/api",
        FRONTEND:{
            PROD_MOD:true,
            MULTILINGUAL:false,
            DISPLAY_FOOTER: true,
            DISPLAY_TOPBAR: false,
            DISPLAY_SIDEBAR: true,
            DISPLAY_STATS: true,
        },
        about: true,
        URL_APPLICATION:"http://127.0.0.1:4200",
        REWARDS: true,
        termsOfUse: {
        fr: "assets/cgu.pdf",
        en: "assets/termsOfUse.pdf"
        },
        signup:true,
        email_contact:false,
        platform_intro: {
        fr: "Bienvenue<br /> sur GeoNature Citizen",
        en: "Welcome<br /> on GeoNature Citizen"
        },
        platform_teaser: {
        fr: "Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur.",
        en: "Hae duae provinciae bello quondam piratico catervis mixtae praedonum a Servilio pro consule missae sub iugum factae sunt vectigales. et hae quidem regiones velut in prominenti terrarum lingua positae ob orbe eoo monte Amano disparantur."
        },
        platform_participate: {
        fr: "PARTICIPER AU PROGRAMME",
        en: "PARTICIPATE"
        },
        program_share_an_observation: {
        fr: "PARTAGER UNE OBSERVATION",
        en: "SHARE AN OBSERVATION"
        },
        program_add_an_observation: {
        fr: "AJOUTER UNE OBSERVATION",
        en: "CONTRIBUTE AN OBSERVATION"
        },
        program_allow_email_contact: {
        fr: "J'accepte que mon adresse e-mail puisse être utilisée pour recontacter à propos de mon observation",
        en : "I agree that my e-mail address can be used to recontact about my observation"
        },
        taxonSelectInputThreshold: 7,
        taxonAutocompleteInputThreshold: 12,
        taxonAutocompleteFields: [
        "nom_complet",
        "nom_vern",
        "nom_vern_eng",
        "cd_nom"
        ],
        program_list_observers_names: true,
        program_list_sort: "-timestamp_create",
        details_espece_url: "<url_inpn_or_atlas>/cd_nom/" // !! gardez bien le cd_nom/ dans l'url
    }


.. code-block:: typescript

    export const MAP_CONFIG = {
    DEFAULT_PROVIDER: "OpenStreetMapOrg",
    BASEMAPS: [
        {
        name: "OpenStreetMapOrg",
        maxZoom: 19,
        layer: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: "abc",
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
        },
        {
        name: "OpenTopoMap",
        maxZoom: 17,
        layer: "//{s}.opentopomap.org/{z}/{x}/{y}.png",
        subdomains: "abc",
        attribution: "© OpenTopoMap"
        },
        {
        name: "IGN Vue satellite",
        maxZoom: 17,
        layer: "https://wxs.ign.fr/{apiKey}/geoportail/wmts?&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER={layerName}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        layerName: "ORTHOIMAGERY.ORTHOPHOTOS",
        // Remplacer "pratique" par votre clé IGN
        apiKey: 'pratique',
        subdomains: "abc",
        attribution: "© IGN-F/Geoportail"
        },
        {
        name: "IGN Cartes",
        maxZoom: 17,
        layer: "https://wxs.ign.fr/{apiKey}/geoportail/wmts?&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER={layerName}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        layerName: "GEOGRAPHICALGRIDSYSTEMS.MAPS",
        // Remplacer "pratique" par votre clé IGN
        apiKey: 'pratique',
        subdomains: "abc",
        attribution: "© IGN-F/Geoportail"
        },
    ],
    CENTER: [46.52863469527167, 2.43896484375],
    ZOOM_LEVEL: 6,
    ZOOM_LEVEL_RELEVE: 15,
    NEW_OBS_POINTER: "assets/pointer-blue2.png",
    OBS_POINTER: "assets/pointer-green.png"
    }

