# GeoNature-citizen

Portail d'inventaire participatif de la biodiversité à destination du grand public.

![logo](https://github.com/PnX-SI/GeoNature-citizen/raw/master/frontend/src/assets/logo.png)

**English:**

GeoNature-citizen is a free and Open Source web solution for citizen science projects for biodiversity data collection. It is fully customizable. Your platform may be a single or a multiple program and be based on existing or adoc list of species.

The data collection is gamified to improve the user management using badges and scores. It can also be customized to accept new user to be created or not.

It is based on a fully open source stack from PostgreSQL to Angular.

**Francais:**

GeoNature-citizen est une solution web gratuite et à code source ouvert pour les projets de science citoyenne destinés à la collecte de données sur la biodiversité. L'outil est entièrement personnalisable. Votre plateforme peut être constituée d'un programme unique ou de plusieurs programmes de collecte et être basée sur une liste d'espèces existante ou adoc.

La collecte de données est ludifiée pour améliorer la gestion des utilisateurs à l’aide de badges et de scores. Elle peut également être personnalisée pour accepter que de nouveaux utilisateurs soient créés ou non.

Documentation : https://geonature-citizen.readthedocs.io

## Cas d'utilisation

- https://obs.mercantour-parcnational.fr
- https://biomap.champs-libres.be
- https://gncitizen.lpo-aura.org
- https://citizen.nature-occitanie.org
- https://phenoclim.org/accueil/individus-phenoclim
- https://enquetes.lashf.org
- https://observatoire-biodiversite.parc-du-vercors.fr
- https://enquetes-biodivrennes.fr
- https://enquetes.clicnat.fr
- https://obs-citoyenne.pyrenees-parcnational.fr
- https://observation.lehavre.fr
- https://enquetes.cbiodiv.org
- https://jobservemonparc.fr

## Solutions logicielles

### Backend (API)

- Python 3
  - Flask (moteur de l'API)
  - flask-jwt-extended (pour l'authentification)
  - SQLAlchemy
- PostgreSQL / PostGIS

### Frontend

- NodeJS
- Angular
- LeafletJS
- Bootstrap 4

### Dépendances

:exclamation: GeoNature-citizen s'appuie sur [TaxHub](https://github.com/PnX-SI/TaxHub) pour la création des listes d'espèces utilisées dans les programmes.

### Installation

Documentation : https://geonature-citizen.readthedocs.io

### Mise à jour

- Lancer le script `update_app.sh`
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
