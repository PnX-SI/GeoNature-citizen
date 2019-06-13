
*******************************
Configurer et lancer le backend
*******************************

Installer l'environnement virtuel python
########################################

La création de l'environnement virtuel python3 nécessite ``virtualenv``
ou ``pyenv`` ou tout autre outil équivalent (ex: pyenv):

.. code-block:: bash

    cd backend
    sudo apt install python3-pip
    python3 -m pip install --upgrade --user virtualenv
    export PATH=/home/geonatadmin/.local/bin:$PATH
    virtualenv -p /usr/bin/python3 venv

L'activation de cet environnement se fait avec la commande suivante:

.. code-block:: bash

    source venv/bin/activate

Et l'installation des librairies nécessaires à GeoNature-citizen avec la commande suivante:

.. code-block:: bash

    python3 -m pip install -r requirements.txt


Lancer le backend
#################

Pour lancer l'application Backend, il suffit d'éxécuter les commandes suivantes
depuis l'environnement virtuel python:

.. code-block:: bash

    cd backend
    source venv/bin/activate
    
    cd ../config
    cp default_config.toml.example default_config.toml
    
    python -m wsgi.py
    # debug mode
    # export FLASK_ENV=development; export FLASK_DEBUG=1; export FLASK_RUN_PORT=5002; export FLASK_APP=wsgi; python -m flask run --host=0.0.0.0

Vous pouvez alors aller sur la page de documentation de l'API à l'adresse suivant ``http://VOTRE_HOTE:5002/apidocs``, en local, ce sera `http://localhost:5002/apidocs <http://localhost:5002/apidocs>`_.
