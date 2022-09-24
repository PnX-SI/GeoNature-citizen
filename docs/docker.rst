****************************
Utiliser Citizen avec Docker
****************************

.. _IBM: https://www.youtube.com/watch?v=0qotVMX-J5s
.. _Docker: https://docs.docker.com/

Introduction aux conteneurs
===========================

Docker
^^^^^^

`Docker`_  est un gestionnaire de conteneurs.

Pour faire très simple : un conteneur peut être vu comme une 
mini machine virtuelle utilisant les librairies de l'OS sur lequel 
il est lancé.
Cela le rend donc plus léger et plus rapide qu'une machine virtuelle.

Je vous invite à regarder cette vidéo : `IBM`_ et même toute la série de 
vidéos relatives à la conteneurisation.

L'objectif des conteneurs et d'isoler les applications.
Dans une application web, les conteneurs suivants sont souvent mis en place :

- Base de données
- Backend
- Proxy & Frontend (le frontend est considéré ici comme statique)

Docker-compose
^^^^^^^^^^^^^^

Utilitaire permettant de créer facilement des conteneurs. Ces conteneurs sont
définis par des services. Il permet également de faciliter la mise en place
d'un réseau (network) pour faire communiquer les conteneurs entre eux.

Nomenclature
^^^^^^^^^^^^

- Image : peut se rapprocher d'un fichier ISO
- Dockerfile : ensemble d'instructions permettant de construire une image
- Conteneur : emplacement dans lequel est monté l'ISO
- Service : ici peut se traduire directement par : un conteneur


Avantages
=========

- Chaque service est isolé (pas de dépendance "forte")
- Chaque service s'execute dans un environnement vierge (aucun conflit)
- Le code est beaucoup plus portatif : seul docker est requis sur la machine
- Donc installations beaucoup plus rapides
- Le déploiement peut se faire automatiquement : 
  - à chaque merge sur une branche particulière : construction des images; 
  - mise à disposition via une bibliothèque d'images; 
  - Téléchargement des images; 
  - Montage des images dans les conteneurs; 
  - les services sont opérationnels et accessibles par les utilisateurs.
- Beaucoup utilisé dans la communauté open-source.


Inconvénients
=============

- Concepts parfois complexes à appréhender (images, conteneurs, 
  volumes, network, contexte...).
- Lignes de commandes à "apprendre"
- Langage à apprendre (Dockerfile)


Utiliser Docker dans Citizen en production
==========================================

4 services/images/conteneurs sont cré(e)s depuis docker-compose.yml

- Service base de données (postgis)
- Backend
- Frontend (car ici le frontend est en server-side rendering ou SSR)
- Proxy nginx

Lancer les services
^^^^^^^^^^^^^^^^^^^

Lancer ``./docker.sh``

Lancer cette commande : ``docker-compose -f docker-compose.yml -f
docker-compose.prod.yml up``
Cette commande va construire les images et les monter une par une
dans un conteneur qui leur est propre.
Il est très important de spécifier les 2 fichiers yml en production

Il est possible de détacher le programme (comme un ``&`` sur Linux) et 
donc toute la sortie de la commande en lançant 
``docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`` (detaché).

Arrêter les services
^^^^^^^^^^^^^^^^^^^^^
Pour "tuer" les services : ``docker-compose -f docker-compose.yml -f docker-compose.prod.yml down``

Contruire une ou plusieurs images
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**Situation 1** : le front a été modifié et j'ai besoin de reconstruire 
l'image

Lancer : ``docker-compose -f docker-compose.yml -f docker-compose.prod.yml build 
frontend``. Cela va reconstruire le frontend

Pour construire puis lancer directement le service : ``docker-compose -f
docker-compose.yml -f docker-compose.prod.yml up frontend --build``

**Situation 2** : J'ai besoin de tout reconstruire

Lancer : ``docker-compose -f docker-compose.yml -f docker-compose.prod.yml build`` 
OU : ``docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
--build`` pour tout reconstruire et relancer tous les services


Utiliser Docker dans Citizen en developpement
=============================================

Lancer ``docker-compose up --build``

Cela utilisera le ficher de configuration des services
et construira les images pour le developpement 
(rechargement automatique du front, accès à tous les services et pas
juste au proxy...).
En effet, par défaut, docker-compose prend comme fichiers ``docker-compose.yml``
ainsi que ``docker-compose.override.yml``


Ce qu'il reste à améliorer
==========================

- Il n'est pas possible de ne pas construire en front autrement qu'en
  SSR
- Les docker-compose prod et dev pourraient être mieux écrits pour qu'il
  y en ai un qui "écrase" l'autre (override) et donc pourraient être 
  lancés comme ceci : 
  ``docker-compose -f docker-compose.prod.yml -f docker-compose.dev.yml up``
- Les fichers pourraient être mieux nommés
- Les Dockerfile pourraient être améliorées nottamment le front en ajoutant
  un "Stage" pour copier le front buildé
- Sûrement d'autres choses...
 