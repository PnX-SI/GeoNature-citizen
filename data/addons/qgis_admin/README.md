# Projet QGIS pour l'administration des données

Dans l'attente d'une interface de gestion des données intégrée à l'application web, ce projet permet la visualisation et l'admnistration des données issues de GeoNature-citizen dans le SIG QGIS.

Pour générer un projet connecté à votre base de données, il est nécessaire d'éditer le fichier `settings.ini` dans le dossier config et créé d'après le modèle `settings.ini.template`. 

Vous y renseignerez les paramètres de connexion à la base de données ainsi que l'URL de l'application (pour la visualisation des photos chargées par les utilisateurs).

Ensuite, placez-vous dans ce dossier et éxécutez le script `./generateQgisProject.sh`

Cela génèrera le projet qgis `citizenOnQgis-admin.qgs` que vous pourrez ouvrir directement avec QGIS (**Version 3.10 minimum requis**).

![Capture d'écran](screenshot.png)
