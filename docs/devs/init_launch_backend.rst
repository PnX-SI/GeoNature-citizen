
*******************************
Configurer et lancer le backend
*******************************

Installer l'environnement virtuel python
########################################

La création de l'environnement virtuel python3 nécessite ``virtualenv``
ou ``pyenv`` ou tout autre outil équivalent (ex: pyenv):

.. code-block:: bash

    cd backend
    virtualenv -p /usr/bin/python3 venv

L'activation de cet environnement se fait avec la commande suivante:

.. code-block:: bash

    source venv/bin/activate

Et l'installation des librairies nécessaires à GeoNature-citizen avec la commande suivante:

.. code-block:: bash

    pip install -r requirements.txt


Lancer le backend
#################

Pour lancer l'application Backend, il suffit d'éxécuter les commandes suivantes
depuis l'environnement virtuel python:

.. code-block:: bash

    cd backend
    source venv/bin/activate
    python -m wsgi.py

Vous pouvez alors aller sur la page de documentation de l'API à l'adresse suivant ``http://VOTRE_HOTE:5002/apidocs``, en local, ce sera `http://localhost:5002/apidocs <http://localhost:5002/apidocs>`_.
