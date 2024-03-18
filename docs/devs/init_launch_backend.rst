
*******************************
Configurer et lancer le backend
*******************************

Installer l'environnement virtuel python
########################################

La gestion des dépendances du backend est assurée par 
`python-poetry <https://python-poetry.org/docs/#installation>`_.

Une fois ``poetry-python`` installé, rendez-vous lancez les commandes suivantes 
pour créer l'environnement virtuel et installer les dépendances.

.. code-block:: bash

    cd backend
    poetry install
    

Lancer le backend
#################

Pour lancer l'application Backend, il suffit d'éxécuter les commandes suivantes
depuis l'environnement virtuel python:

.. code-block:: bash

    cd backend
    
    cp ../config/config.toml.example ../config/config.toml
    
    poetry run python -m wsgi.py
    # debug mode
    # export FLASK_ENV=development; export FLASK_DEBUG=1; export FLASK_RUN_PORT=5002; export FLASK_APP=wsgi; python -m flask run --host=0.0.0.0

Vous pouvez alors aller sur la page de documentation de l'API à l'adresse suivant ``http://VOTRE_HOTE:5002/api/docs``, en local, ce sera `http://localhost:5002/api/docs <http://localhost:5002/api/docs>`_.
