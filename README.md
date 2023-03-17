# GeoNature-citizen

Portail d'inventaire participatif de la biodiversité à destination du grand public ([**Démo**](http://democitizen.geonature.fr)).

![logo](https://github.com/PnX-SI/GeoNature-citizen/raw/master/frontend/src/assets/logo.png)

:bangbang: **Projet en cours de développement, actuellement en version beta**

**English:**

GeoNature-citizen is a free and Open Source web solution for citizen science projects for biodiversity data collection. It is fully customizable. Your platform may be a single or a multiple program and be based on existing or adoc list of species.

The data collection is gamified to improve the user management using badges and scores. It can also be customized to accept new user to be created or not.

It is based on a fully open Source stack from PostgreSQL to Angular.

**Francais:**

GeoNature-citizen est une solution web gratuite et à code source ouvert pour les projets de science citoyenne destinés à la collecte de données sur la biodiversité. L'outil est entièrement personnalisable. Votre plateforme peut être constituée d'un programme unique ou de plusieurs programmes de collecte et être basée sur une liste d'espèces existante ou adoc.

La collecte de données est ludifiée pour améliorer la gestion des utilisateurs à l’aide de badges et de scores. Elle peut également être personnalisée pour accepter que de nouveaux utilisateurs soient créés ou non.

Documentation : https://geonature-citizen.readthedocs.io

## Cas d'utilisation

- https://obs.mercantour-parcnational.fr
- https://www.a-vos-mares.org/participez/
- http://abc-meylan.lpo-aura.org/obs/home
- http://biodiv-valenceromansagglo.lpo-aura.org
- https://biomap.champs-libres.be/fr/home
- https://gncitizen.lpo-aura.org/fr/home
- https://citizen.nature-occitanie.org/fr/home
- https://phenoclim.org/accueil/individus-phenoclim/
- https://atlasdelabiodiversite.cote-emeraude.fr/fr/home
- https://enquetes.lashf.org/fr/home
- https://enquetes.clicnat.fr/

## Solutions logicielles

### Backend (API)

- Python 3
  - Flask (moteur de l'API)
  - flask-jwt-extended (pour l'authentification)
  - SQLAlchemy
- PostgreSQL / Postgis

### Frontend

- NodeJS
- Angular 8
- LeafletJS
- Bootstrap 4.1

### Dépendances

GeoNature-citizen s'appuie sur [TaxHub](https://github.com/PnX-SI/TaxHub) pour la création des listes d'espèces utilisées dans les programmes.

### Installation

- Lancer le script install_app.sh pour installer l'application entière ainsi que ses dépendances (postgres, taxhub ...)
- Au premier lancement le script créera un fichier settings.ini dans config
- Remplacer toutes les variables par vos données de votre serveur
- Relancer le script install_app.sh
  - Les fichiers de conf frontend et backend seront alors créés et configurés
  - Le serveur flask sera lancé via supervisor : api_geonature
  - Si vous avez choisi le mode Server side pour le frontend, il sera lancé via supervisor : geonature sur le port 4000

### Mise à jour

- Lancer le script update_app.sh
  - Le script récupérera les modifications depuis git
  - il va transpiler le front et redémarrer si besoin les services supervisor
  - [Warning] si des modifications SQL ont été faites, il faudra les faire manuellement

## L'origine du projet

Ce projet est initialement développé pour répondre aux besoins de collectes participatives dans le cadre des démarches d'atlas de biodiversité communal/territorial (ABC/ABT).
La première version de ce projet est le fruit d'une démarche mutualisée entre différents projects :

- Projet d'Atlas de biodiversité de territoire de [Valence Romans Agglo](http://www.valenceromansagglo.fr/fr/index.html), en partenariat avec la [LPO Auvergne-Rhône-Alpes](https://auvergne-rhone-alpes.lpo.fr/).
- Projets d'inventaires participatifs du [Parc national du Mercantour](http://www.mercantour-parcnational.fr/fr) et du [Syndicat Mixte pour la gestion et la protection de la Camargue Gardoise](https://www.camarguegardoise.com/), avec une réalisation par [Natural Solutions](https://www.natural-solutions.eu/).

Il constitue l'une des briques du projet GeoNature, porté par les [Parcs nationaux de France](http://www.parcsnationaux.fr/fr) et bénéficie de l'appui technique du [Parc national des Ecrins](http://www.ecrins-parcnational.fr/).

## Contributeurs

[![Contributors](https://contrib.rocks/image?repo=PnX-SI/GeoNature-citizen)](https://github.com/PnX-SI/GeoNature-citizen/graphs/contributors)
