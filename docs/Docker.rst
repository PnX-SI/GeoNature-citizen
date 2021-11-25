****************************
Utiliser Citizen avec Docker
****************************

.. _IBM: https://www.youtube.com/watch?v=0qotVMX-J5s

Introduction aux conteneurs
===========================

Docker
^^^^^^

Docker est un gestionnaire de conteneurs.
Pour faire très simple : un conteneur peut être vu comme une 
mini machine virtuelle utilisant les librairies de l'OS sur lequel 
il est lancé.
Cela le rend donc plus léger qu'une machine virtuelle.

Je vous invite à regarder cette vidéo : _IBM et même toute la série de 
vidéos relatives à la conteneurisation

L'objectif des conteneurs et d'isoler les applications.
Dans une application web, les conteneurs suivants sont souvent les suivants:

- Base de données
- Backend
- Frontend
- Proxy

Docker-compose
^^^^^^^^^^^^^^

Utilitaire permettant de créer facilement des conteneurs. Ces conteneurs sont
définis par des services.
Cet utilitaire permet de se simplifier la vie en créant rapidement des services
et en les faisant communiquer entre eux.

Nomenclature
^^^^^^^^^^^^

Image : peut se rapprocher d'un fichier isoler
Dockerfile : ensemble d'instructions 
Conteneur : emplacement dans lequel est monté l'iso
Service : ici peut se traduire directement par : un conteneur


Avantages
=========

- Chaque service est isolé (pas de dépendance "forte")
- Chaque service s'execute dans un environnement vierge (aucun conflit)
- Le code est beaucoup plus portatif : seul docker est requis sur la machine
- Donc installations beaucoup plus rapides
- Le déploiement peut se faire automatiquement : à chaque merge sur une branche
particulière : construction des images; mise à disposition via une bibliothèque
d'images; Téléchargement des images; Montage des images dans les conteneurs; les
services sont opérationnels et accessible par les utilisateurs.
- Vastement utilsé.


Inconvénients
=============

Concepts parfois complexes à appréhender (images, conteneurs, 
volumes, network, contexte...)
Lignes de commandes à "apprendre"
Langage à apprendre (Dockerfile)


Utiliser Docker dans Citizen en production
==========================================

4 services/images/conteneurs sont cré(e)s depuis docker-compose.yml

- Service base de données (postgis)
- Backend
- Frontend
- Proxy nginx

Lancer les services
^^^^^^^^^^^^^^^^^^^

Lancer cette commande : ``docker-compose up``
Cette commande va construire les images et les monter une par une
dans un conteneur qui leur est propre.

Il est possible de masquer toute la sortie de la commande en
lançant ``docker-compose up -d`` (detaché).

Arrêter les services
^^^^^^^^^^^^^^^^^^^^^
Pour "tuer" les services : ``docker-compose down``

Contruire une ou plusieurs images
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**Situation 1** : le front a été modifié et j'ai besoin de reconstruire 
l'image

Lancer : ``docker-compose build frontend``. Cela va reconstruire le 
frontend

Pour construire puis lancer directement le service : ``docker-compose up frontend --build``

**Situation 2** : J'ai besoin de tout reconstruire

Lancer : ``docker-compose build`` 
OU : ``docker-compose up --build`` pour tout reconstruire et relancer tous
les services


Utiliser Docker dans Citizen en developpement
=============================================

Lancer ``docker-compose -f docker-compose-dev.yml up --build``

Cela utilisera le docker-compose et les images pour le developpement 
(rechargement automatique du front, accès à tous les services et pas
juste au proxy).
