# GeoNature-citizen

![logo](https://github.com/PnX-SI/GeoNature-citizen/raw/master/frontend/src/assets/logo.png)

:bangbang: **Projet en cours de développement, actuellement en version beta**

**English:**

GeoNature-citizen is a free and Open Source web solution for citizen science projects for biodiversity data collection. It is fully customizable. Your platform may be a single or a multiple program and be based on existing or adoc list of species.
The data collection is gamified to improve the user management using badges and scores. It can also be customized to accept new user to be created or not.
It is based on a fully open Source stack from PostgreSQL to Angular.

**Francais:**

GeoNature-citizen est une solution web gratuite et à code source ouvert pour les projets de science citoyenne destinés à la collecte de données sur la biodiversité. L'outil est entièrement personnalisable. Votre plateforme peut être constituée d'un programme unique ou de plusieurs programmes de collecte et être basée sur une liste d'espèces existante ou adoc.
La collecte de données est ludifiée pour améliorer la gestion des utilisateurs à l’aide de badges et de scores. Elle peut également être personnalisée pour accepter que de nouveaux utilisateurs soient créés ou non.

Portail d'inventaire participatif de la biodiversité à destination du grand public

Uilisé sur les sites : 
- https://obs.mercantour-parcnational.fr
- https://www.a-vos-mares.org/participez/

## Solutions logicielles

### Backend (API)

* Python 3
  * Flask (moteur de l'API)
  * flask-jwt-extended (pour l'authentification)
  * SQLAlchemy
* PostgreSQL 10 / Postgis 2.4

### Frontend

* NodeJS 10
* Angular 8
* Leaflet
* Bootstrap 4.1

### Dépendances

GeoNature-citizen s'appuie sur [TaxHub](https://github.com/PnX-SI/TaxHub) pour la création des listes d'espèces utilisées dans les programmes.

## L'origine du projet

Ce projet est initialement développé pour répondre aux besoins de collectes participatives dans le cadre des démarches d'atlas de biodiversité communal/territorial (ABC/ABT). 
La première version de ce projet est le fruit d'une démarche mutualisée entre différents projects :
* Projet d'Atlas de biodiversité de territorie de [Valence Romans Agglo](http://www.valenceromansagglo.fr/fr/index.html), en partenariat avec la [LPO Auvergne-Rhône-Alpes](https://auvergne-rhone-alpes.lpo.fr/).
* Projets d'inventaires participatifs du [Parc national du Mercantour](http://www.mercantour-parcnational.fr/fr) et du [Syndicat Mixte pour la gestion et la protection de la Camargue Gardoise](https://www.camarguegardoise.com/), avec une réalisation par [NaturalSolutions](https://www.natural-solutions.eu/).

Il constitue l'une des briques du projet GeoNature, porté par les [Parcs nationaux de France](http://www.parcsnationaux.fr/fr) et bénéficie de l'appui technique du [Parc national des Ecrins](http://www.ecrins-parcnational.fr/).

## Captures d'écran


![Screen Shot 2019-11-20 at 09 44 19](https://user-images.githubusercontent.com/22891423/69222731-5b115680-0b7a-11ea-8cc7-095d9258f8cd.png)

![Screen Shot 2019-11-20 at 09 39 57](https://user-images.githubusercontent.com/22891423/69222565-05d54500-0b7a-11ea-97fa-d03545d617b9.png)

![Screen Shot 2019-11-20 at 09 40 37](https://user-images.githubusercontent.com/22891423/69222574-08379f00-0b7a-11ea-8d25-2bcaeef1e957.png)

![Screen Shot 2019-11-20 at 09 41 28](https://user-images.githubusercontent.com/22891423/69222578-0968cc00-0b7a-11ea-8d4c-7f90175c0cf7.png)
