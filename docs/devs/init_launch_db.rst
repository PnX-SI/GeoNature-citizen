******************************************
Configurer et installer la base de données
******************************************

GeoNature-citizen s'appuie sur le serveur de base de données spatiales \
PostgreSQL et son extension spatiale PostGIS.


Installer le serveur
####################

Pour installer le serveur de base de données, suiviz les \
instructions du site officiel \
`PostgreSQL Downloads <https://www.postgresql.org/download/>`_:

Concrètement, sur Debian stretch:

.. code:: sh

    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main" >> /etc/apt/sources.list.d/postgresql.list'
    sudo wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install postgresql-10 postgresql-10-postgis-2.5 postgresql-10-postgis-2.5-scripts git

Configurer la base de données
#############################

Création du role principal
**************************

Pour créer la base de données spatiale. On considèrera ici que l'utilisateur \
de la base de données sera ``dbuser``, renseignez alors le mot de passe de \
l'utilisateur lorsqu'il vous sera demandé :

.. code:: sh

    sudo -u postgres createuser -e -E -P dbuser

Créez la base de données, ici nommée ``geonaturedb`` appartenant à l'utilisateur ``dbuser``:

Création de la base de données et des extensions
************************************************

.. code:: sh

    sudo -u postgres createdb -e -E UTF8 -O dbuser geonaturedb

Activez les extensions ``postgis`` pour la gestion des données spatiales et ``uuid-ossp`` \
pour la gestion des uuid. Seul un superutilisateur peut activer les extensions (ici, \
l'utilisateur ``postgres``, installé par défaut) :

.. code:: sh 

    sudo -u postgres psql geonaturedb -c 'create extension postgis; create extension "uuid-ossp";'

Votre serveur de base de données est maintenant opérationel.




