
********************************
Configurer et lancer le frontend
********************************

Installer l'environnement virtuel NodeJS avec nvm
#################################################

L'installation de ``nvm`` se fait en suivant les instructions du dépot principal de l'outil nvm par creationix `creationix/nvm <https://github.com/creationix/nvm#installation-and-update>`_.

Une fois l'environnement installé, installer la dernière version stable de ``nodejs``:

.. code:: sh

    nvm install --lts

Pour utiliser cette version:

.. code:: sh

    nvm use --lts

Installer angular CLI (version LTS 6) et les dépendances requises:

.. code:: sh

    npm install -g @angular/cli@v6-lts
    npm install

Dans son incarnation actuelle, quelques fichiers de dépendances doivent être patchés pour passer l'étape de compilation.

.. code:: diff

    --- frontend/node_modules/@types/leaflet.locatecontrol/index.d.ts.old	2019-03-07 08:47:03.475859400 +0100
    +++ frontend/node_modules/@types/leaflet.locatecontrol/index.d.ts	2019-03-07 08:47:23.460562933 +0100
    @@ -38,6 +38,7 @@
               onLocationOutsideMapBounds?: any;
               showPopup?: boolean;
               strings?: any;
    +          getLocationBounds?: Function;
               locateOptions?: L.LocateOptions;
           }
       }

.. code:: diff

    --- frontend/node_modules/@types/leaflet/index.d.ts.old  2019-04-10 09:02:08.012010439 +0200
    +++ frontend/node_modules/@types/leaflet/index.d.ts      2019-04-10 09:02:23.239901103 +0200
    @@ -495,7 +495,7 @@
         zoomReverse?: boolean;
         detectRetina?: boolean;
         crossOrigin?: boolean;
    -    // [name: string]: any;
    +    [name: string]: any;
         // You are able add additional properties, but it makes this interface unchackable.
         // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/15313
         // Example:
    @@ -1025,6 +1025,7 @@
          tapTolerance?: number;
          touchZoom?: Zoom;
          bounceAtZoomLimits?: boolean;
     +    gestureHandling?: boolean;
      }

      export type ControlPosition = 'topleft' | 'topright' | 'bottomleft' |
     'bottomright';

Lancer du frontend
##################

Vous pouvez lancer le frontend dans deux modes:

En mode développement et client-side rendering:
***********************************************

.. code:: sh

    ng serve

En mode Server Side Rendering, optimisé pour le SEO et réservé aux robots d'indexation:
***************************************************************************************

.. code:: sh

    npm run build:ssr && npm run serve:ssr

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

Le ``build`` et le démarrage du service sur le port ``4000`` s'effectue via le oneliner :

.. code-block:: sh

    npm run build:ssr && npm run serve:ssr

La redirection de port pourrait se faire au niveau du serveur web / reverse proxy, avec un filtre sur l'entête de requête ``User-Agent``

Gestion de l'internationalisation (i18n)
########################################

La fonctionnalité i18n a été intégrée selon `la recette originale <https://angular.io/guide/i18n>`_.

L'interface est paramétrée par défaut en langue française.


Si l'on souhaitait la servir en langue anglaise:

.. code-block:: sh

    npm run ng serve -- --configuration=en

La stratégie en cas de traduction manquante est de faire remonter une erreur.

(Ré)génération des fichiers de traduction:
******************************************

.. code-block:: sh

    npm run -- ng xi18n --output-path locale --out-file _messages.fr.xlf --i18n-locale fr

.. code-block:: sh

    npm run -- ng xi18n --output-path locale --out-file _messages.en.xlf --i18n-locale en


Les fichiers de traduction se retrouvent dans le répertoire ``frontend/src/locale``.

Les copier en ``messages.fr.xlf`` et ``messages.en.xlf`` après édition (mon approche est de les mettre à jour depuis un éditeur de différence).

Génération du rendu SSR dans le context de l'i18n:
**************************************************

La commande suivante permet de générer un rendu SSR multilingue et le servir en langue française.


.. code-block:: sh

    npm run build:i18n-ssr && npm run serve:ssr


Déploiement
###########

Préparer la distribution avec:

.. code-block:: sh

    npm run ng build -- --prod

ou:

.. code-block:: sh

    npm run ng build -- --configuration=en --prod

pour une version en langue anglaise.

Tout est contenu dans le répertoire ``frontend/dist``, qu'il faut copier sur la plateforme acceuillant le service.



Annexe:
#######

Exemple de fichier de configuration serveur Apache2:
****************************************************
``/etc/apache2/sites-enabled/citizen.conf``

.. code-block:: conf

    # Configuration GeoNature-citizen
    Alias /citizen /home/utilisateur/citizen/frontend/dist/browser

    <Directory /home/utilisateur/citizen/frontend/dist/browser>
      Require all granted
      AllowOverride All

      <IfModule mod_rewrite.c>
          Options -MultiViews

          RewriteEngine On
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteCond %{REQUEST_FILENAME} !-f
              RewriteRule ".*" "index.html" [QSA,L]
      </IfModule>

    </Directory>
    <Location /citizen/api>
      ProxyPass http://127.0.0.1:5002/api
      ProxyPassReverse  http://127.0.0.1:5002/api
    </Location>

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

.. code-block:: conf

    Host nom_du_raccourci
    Hostname son_addresse_ip
    User mon_user
    LocalForward 5433 localhost:5432

Se logguer en SSH (``ssh nom_du_raccourci``) sur l'hôte distant va opérer une redirection de port et rendre la BDD distante accessible sur le port local ``5433`` pour un client PostgreSQL.

Il suffit alors d'ajuster les paramètres de ``psql`` en CLI ou ceux de l'assistant de configuration de PgAdmin pour son interface graphique.
