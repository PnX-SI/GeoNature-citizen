
********************************
Configurer et lancer le frontend
********************************

Installer l'environnement virtuel NodeJS avec nvm
#################################################

L'installation de ``nvm`` se fait en suivant les instructions du dépot principal de l'outil nvm par creationix `creationix/nvm <https://github.com/creationix/nvm#installation-and-update>`_
Une fois l'environnement installé, installer la dernière version stable de ``nodejs``:

.. code:: sh

    nvm install --lts

Pour utiliser cette version:

.. code:: sh

    npm use --lts

Installer angular CLI (version LTS 6) et les dépendances requises:

.. code:: sh

    npm install -g @angular/cli@v6-lts
    npm install

Lancer du frontend
##################

Vous pouvez lancer le frontend dans deux modes:

En mode client-side rendering
*****************************

.. code:: sh

    ng serve

En mode Server-side rendering
*****************************

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

.. code-block:: typescript


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
