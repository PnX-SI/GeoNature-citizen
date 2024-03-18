
********************************
Configurer et lancer le frontend
********************************

Installer l'environnement virtuel NodeJS avec nvm
#################################################

L'installation de ``nvm`` se fait en suivant les instructions du dépot principal de l'outil nvm par creationix `creationix/nvm <https://github.com/creationix/nvm#installation-and-update>`_.

Une fois l'environnement installé, installer la dernière version stable de ``nodejs`` compatible:

.. code:: sh

    cd frontend
    nvm install

Pour utiliser cette version:

.. code:: sh

    cd frontend
    nvm use

Installer angular CLI (version LTS 8) et les dépendances requises:

.. code:: sh

    npm install -g @angular/cli@v8-lts
    npm install

Lancer du frontend
##################

Vous pouvez lancer le frontend dans deux modes:

En mode développement et client-side rendering:
***********************************************

.. code:: sh

    nvm exec npm run start

En mode Server Side Rendering, optimisé pour le SEO et réservé aux robots d'indexation:
***************************************************************************************

.. code:: sh

    nvm exec npm run build:ssr && nvm exec npm run serve:ssr

Gestion du Server Side Rendering
################################

Le SSR a été intégré au projet à partir de la commande :

.. code-block:: sh

    npm run ng add @nguniversal/express-engine --clientProject frontend

NB: L'intégration Leaflet.MarkerCluster a nécessité de déclarer une variable globale ``L`` et d'y importer Leaflet; c'est dans le script ``server.ts``.

Les modules ``BrowserTransferState`` et ``ServerTransferState`` importés, nous avons créé un couple ``{clé: valeur}`` pour être transféré du serveur au client.

La clé est créée avec la fonction factory `makeStateKey <https://angular.io/api/platform-browser/StateKey#description>`_ :

.. code-block:: typescript

    const PROGRAMS_KEY = makeStateKey("programs");

Le transfert d'état s'effectue avec accesseur et mutateur:

.. code-block:: javascript

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


La redirection de port pourrait se faire au niveau du serveur web / reverse proxy, avec un filtre sur l'entête de requête ``User-Agent``

Gestion de l'internationalisation (i18n)
########################################

La fonctionnalité i18n a été intégrée avec `@ngx-i18nsupport <https://github.com/martinroob/ngx-i18nsupport/wiki/Tutorial-for-using-xliffmerge-with-angular-cli>`_.

L'interface est paramétrée par défaut en langue française.

Mettre à jour les traductions
*****************************

La commande suivante met à jour les fichiers de traduction (ajout/suppression de traductions symbolisées par l'argument ``i18n`` dans les templates.

.. code-block:: sh

    nvm exec npm run extract-i18n

Les fichiers de traduction sont dans le répertoire ``frontend/src/i18n``.

Mettre à jour les nouvelles traductions (texte dans les balises ``<target></target>`` des fichiers  localisés ``messages.fr.xlf`` et ``messages.en.xlf``.


Déploiement
###########

Préparer la distribution avec:

.. code-block:: sh

    nvm exec npm run build:i18n-ssr


Annexe:
#######

Exemple de fichier de configuration serveur Apache2:
****************************************************
``/etc/apache2/sites-enabled/citizen.conf``

.. code-block:: apacheconf

    <VirtualHost *:80>
        # Host
        ServerName mydomain.net

        # Root url (for frontend)
        <Location />
            ProxyPass  http://localhost:4000/ retry=0
            ProxyPassReverse  http://localhost:4000/
        </Location>

        # API Url
        <Location /api>
            ProxyPass  http://localhost:5002/api retry=0
            ProxyPassReverse  http://localhost:5002/api
        </Location>

        # Secured backoffice
        <Location /api/admin/>
            AuthType Basic
            AuthName "Restricted Area"
            AuthBasicProvider file
            AuthUserFile "APP_PATH/config/backoffice_htpasswd"
            Require user backoffice_username
        </Location>

        # Error logs	
        ErrorLog APP_PATH/var/log/apache2-citizen.log
        CustomLog APP_PATH/var/log/apache2-citizen.log combined

    </VirtualHost>


Suivi des journaux d'évenements et d'erreurs:
*********************************************

Backend:
========

.. code-block:: sh

    tail -f /var/log/supervisor/citizen.log


Gunicorn (option de gestion de processus pour lancer le backend):
=================================================================

.. code-block:: sh

    tail -f ~/citizen/var/log/gn_errors.log


Apache:
=======

.. code-block:: sh

    sudo tail -f /var/log/apache2/{error,access,other_vhosts_access}.log


Utiliser PgAdmin pour la gestion de la BDD distante (production):
=================================================================

``~/.ssh/config``

.. code-block::

    Host nom_du_raccourci
    Hostname son_addresse_ip
    User mon_user
    LocalForward 5433 localhost:5432

Se logguer en SSH (``ssh nom_du_raccourci``) sur l'hôte distant va opérer une redirection de port et rendre la BDD distante accessible sur le port local ``5433`` pour un client PostgreSQL.

Il suffit alors d'ajuster les paramètres de ``psql`` en CLI ou ceux de l'assistant de configuration de PgAdmin pour son interface graphique.
