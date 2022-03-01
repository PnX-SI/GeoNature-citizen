****************************************
Renseigner les fichiers de configuration
****************************************

Modifier le fichier de configuration
####################################


Côté backend
************

Les fichiers de configuration sont dans le dossier ``config``.
Le fichier à modifier est ``config.toml``.
Le fichier utilisé par GeoNature-citizen est config.toml.
Il peut-être créé en copiant le fichier ``config.toml.example`` \
vers ``config.toml``:

.. code-block:: bash

    $ cp config.toml.example config.toml

Editez alors les différents paramètres de ce fichier.

fichier ``config.toml``

.. literalinclude:: ../config/config.toml.template
  :language: toml

Côté frontend
*************

Les fichiers de configuration du frontend se trouvent dans le dossier ``./frontend/src/conf``


Les fichiers ``app.config.ts`` et ``map.config.ts`` permettent de personnaliser la configuration définie par défaut dans ``main.config.ts``.
Il sont créés lors de l"installation ou en copiant les fichiers ``app.config.ts.sample`` \
vers ``app.config.ts`` et ``app.config.ts.sample`` vers ``map.config.ts`` :


.. code-block:: bash

    $ cd ./frontend/src/conf
    $ cp app.config.ts.template app.config.ts
    $ cp map.config.ts.template map.config.ts

Editez alors les différents paramètres de ces fichiers.

fichier ``app.config.ts``

.. literalinclude:: ../frontend/src/conf/app.config.ts.template
  :language: TypeScript

fichier ``map.config.ts``

.. literalinclude:: ../frontend/src/conf/map.config.ts.template
  :language: TypeScript

===================================
Configuration de l'authentification
===================================

Le fichier ``frontend/src/conf/app.config.ts`` permet notamment de configuer l'authentification.

Il y a 3 possibilités :

- un mode sans authentifiaction (``signup : "never"``),
- un mode avec authentification optionnelle (``signup : "optional"``) tout en conservant le mode sans authentification,
- un mode avec authentification obligatoire (``signup : "always"``).