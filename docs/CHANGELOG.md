CHANGELOG
=========

0.99.0-dev (2021-02-19)
-----------------------

**🚀 Nouveautés**

* Le mode privilégié pour le Frontend est le Server Side Rendering (rendu côté serveur)
* Développement de la possibilité de créer des programmes d'inventaires et de visites de sites, basés sur des champs additionnels dynamiques stockés en jsonb (actuellement utilisée par https://www.a-vos-mares.org) ([#34](https://github.com/PnX-SI/GeoNature-citizen/issues/34), @QuentinJouet & @jolleon)
* Possibilité de définir si un programme est de type "Observations" ou "Sites" ([#179](https://github.com/PnX-SI/GeoNature-citizen/issues/179), [#209](https://github.com/PnX-SI/GeoNature-citizen/issues/209), @QuentinJouet & @jolleon)
* Possibilité d'ajouter des champs additionnels dynamiques stockés en jsonb sur les programmes de type "Observations", utilisant Angular JSON Schema Form (#181, @QuentinJouet & @jolleon)
* Révision ergonomique du formulaire de saisie, positionné sur la liste des observations ([#218](https://github.com/PnX-SI/GeoNature-citizen/issues/218), @jolleon)
* Révision du tableau de bord de l'observateur pour un affichage liste/carte semblable à une page de programme (@jolleon)
* Tableau de bord : Possibilité de visualiser les sites dans la liste des observations ainsi que sur la carte et pouvoir les éditer (@jolleon)
* Tableau de bord : Possibilité d'exporter les sites (@jolleon)
* Exports des observateurs adaptés pour contenir les données de formulaires personnalisés (@jolleon)
* Ajout d'un paramètre ``FRONTEND.NEW_OBS_FORM_MODAL_VERSION``, permettant de définir si le formulaire de saisie est sur la barre latérale ou dans une modale comme précédemment ([#218](https://github.com/PnX-SI/GeoNature-citizen/issues/218), @jolleon)
* Possibilité de charger plusieurs photos associées à une observation ([#208](https://github.com/PnX-SI/GeoNature-citizen/issues/208), @jolleon)
* Ajout d'une page de détail pour chaque observation, incluant les éventuelles photos associées ([#223](https://github.com/PnX-SI/GeoNature-citizen/issues/223), @jolleon)
* Mise en place d'un outil permettant de générer un projet QGIS d'administration des données de GeoNature-citizen ([#222](https://github.com/PnX-SI/GeoNature-citizen/issues/222), @lpofredc)
* Ajout de métadonnées aux pages web (title, description, mot-clés) ([#205](https://github.com/PnX-SI/GeoNature-citizen/issues/205), @lpofredc)
* Ajout d'un message paramétrable (``registration_message``) d'incitation à l'inscription ([#177](https://github.com/PnX-SI/GeoNature-citizen/issues/177), @lpofredc)
* Ajout d'un message personnalisé en tête du formulaire de saisie d'une observation, personnalisé dans la table de paramétrage du programme (@lpofredc)
* Ajout de la possibilité d'afficher le nom scientifique des taxons (``taxonDisplaySciName``)
* Sécurisation de l'interface d'administration des programmes (([#211](https://github.com/PnX-SI/GeoNature-citizen/issues/211)) (@lpofredc)
* Administration : Possibilité de charger une géométrie à partir d'un fichier GeoJSON ou KML pour définir l'emprise géographique d'un programme (@jolleon)
* Administration : Possibilité de mutualiser les zones géographiques entre plusieurs programmes ([#245](https://github.com/PnX-SI/GeoNature-citizen/issues/245), @jolleon)
* Enrichissement de l'interface d'administration pour gérer dorénavent les programmes, les formulaires personnalisés (*json schema form*), et les utilisateurs inscrits (@lpofredc)
* Intitulé des programmes personnalisables (ex: Missions, Enquêtes) (@lpofredc)
* Améliorations diverses du style et de l'ergonomie (@jolleon, @lpofredc)
* Révision et réorganisation complète de la documentation (merci @Splendens et @ksamuel) ([#166](https://github.com/PnX-SI/GeoNature-citizen/issues/166))
* Création d'un script pour simplifier et automatiser l'installation de GeoNature-citizen ([#167](https://github.com/PnX-SI/GeoNature-citizen/issues/167))
* Création d'un niveau "Projet" équivalent au cadre d'acquisition de GeoNature ([#247](https://github.com/PnX-SI/GeoNature-citizen/issues/247))
* Mise à disposition d'un script d'alimentation automatique GeoNature:
    * projet > cadre d'acquisition
    * enquête > jeu de données
    * observation > occurence de taxon en synthèse

**🐛 Corrections**

* Désactivation du bouton d'enregistrement d'une observation après sa validation (évite les enregistrements multiples en cas de réponse lente du backend) (@jolleon)

**⚠️ Notes de version**

Si vous mettez à jour GeoNature-citizen à partir de la version 0.3.0 :

* Lancer successivement les scripts SQL de mise à jour de la BDD de GeoNature-citizen 
    * https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.3.0_to_0.3.1.sql
    * https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.3.1_to_0.4.0.sql
    * https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.4.0_to_0.5.0.sql
    * https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.5.0_to_0.99.0.sql


0.3.0 (2020-02-12)
------------------

**🚀 New features**

* Améliorations du tableau de bord de l'observateur connecté avec personnalisation de l'avatar et gestion des observations personnelles (#148, @HamoudaAmine) 
* Ajout de l'avatar observateur dans la liste des observations (@HamoudaAmine) 
* Amélioration du fonctionnement adaptatif de l'interface (@HamoudaAmine) 
* Ajout d'un bloc personnalisable sur la page d'accueil, sous la liste des programmes (@lpofredc) 
* Ajout d'un dispositif de validation des nouvelles inscriptions par email (@HamoudaAmine) 
* L'authentification se fait maintenant avec l'email de l'utilisateur (@HamoudaAmine) 
* L'affichage du bloc de statistiques est optionnel (#165, @HamoudaAmine) 
* Le nom des espèces est cliquable avec un lien paramétrable finissant par le cd_nom, utilisable avec GeoNature-atlas ou avec espèce le site de l'INPN (#142, @HamoudaAmine) 
* Amélioration du footer (#102, @HamoudaAmine)

**🐛 Fixes**

* La compilation SSR fonctionne (#120, #192, @HamoudaAmine)
* Correctifs d'UI (#184, #130)
* Nettoyage de code (#168, @lpofredc)

**⚠️ Version note**

* Lancer le script SQL de mise à jour de la BDD de GeoNature-citizen https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/v0.2.0_to_0.3.0.sql

0.2.0 (2019-11-20)
------------------

**🚀 New features**

* Better geolocation icon (#162)
* Allow to desactivate Signup/signin (@jbdesbas)
* Allow to add an optional email field in form when observer is not signed in (@jbdesbas)
* Allow to desactivate Observers names (@jbdesbas & @lpofredc)
* Program selection style in modal similar to home page (@lpofredc)
* Add a CHANGELOG file (@camillemonchicourt)
* Add demo link into README.md

**🐛 Some fixes**

* Add and fix ``ondelete`` on models
* Update README.md (new screenshots, update project details)

0.1.1 (2019-09-20)
------------------

End of Natural Solutions mission

**🚀 New features**

* Taxonomy lists are now selectable in program admin backoffice (@lpofredc)
* Program description width is now 1/3 (instead of 2/3) of program header (@HamoudaAmine from @NaturalSolutions)
* Update badges rules engine (@HamoudaAmine from @NaturalSolutions)

![Programs Model - GN-Citizen: Backoffice d'administration](https://user-images.githubusercontent.com/22891423/64546035-27b87d00-d32a-11e9-9ade-e286283decab.jpg)

![image](https://user-images.githubusercontent.com/22891423/64546023-212a0580-d32a-11e9-8ac7-84b9f6b62adb.png)

0.1.0 (2019-08-20)
------------------

First pre-release. To test, some few bugs still to fix
