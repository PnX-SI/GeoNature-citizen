CHANGELOG
=========

1.0.0 (unreleased)
------------------

Voir https://github.com/PnX-SI/GeoNature-citizen/compare/dev

**🚀 New features**

* Révision et rérganisation complète de la documentation (#000000)
* Mise en place d'un outil permettant de générer un projet QGIS d'administration des données de GeoNature-citizen (#221)
* Ajout de métadonnées aux pages web (title, description, description)
* Améliorations diverses du style et de l'ergonomie

**🐛 Fixes**

* 

**⚠️ Version note**

* 

0.3.0 (2020-02-12)
------------------

**🚀 New features**

* Améliorations du tableau de bord de l'observateur connecté avec personnalisation de l'avatar et gestion des observations personnelles (par @HamoudaAmine, *cf.* #148) 
* Ajout de l'avatar observateur dans la liste des observations (par @HamoudaAmine) 
* Amélioration du fonctionnement adaptatif de l'interface (par @HamoudaAmine) 
* Ajout d'un bloc personnalisable sur la page d'accueil, sous la liste des programmes (par @lpofredc) 
* Ajout d'un dispositif de validation des nouvelles inscriptions par email (par @HamoudaAmine) 
* L'authentification se fait maintenant avec l'email de l'utilisateur (par @HamoudaAmine) 
* L'affichage du bloc de statistiques est optionnel (par @HamoudaAmine, *cf*. #165) 
* Le nom des espèces est cliquable avec un lien paramétrable finissant par le cd_nom, utilisable avec GeoNature-atlas ou avec espèce le site de l'INPN (par @HamoudaAmine, *cf.* #142) 
* Amélioration du footer (par @HamoudaAmine *cf.* #102)

**🐛 Fixes**

* La compilation SSR fonctionne (par @HamoudaAmine, fix #120, #192)
* Correctifs d'UI (fix #184, #130)
* Nettoyage de code (par @lpofredc, fix #168)

**⚠️ Version note**

* Lancer le script SQL de mise à jour de la BDD de GeoNature-citizen https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/v0.2.0_to_0.3.0.sql

0.2.0 (2019-11-20)
------------------

**🚀 New features**

* Better geolocation icon (#162)
* Allow to desactivate Signup/signin (by @jbdesbas)
* Allow to add an optional email field in form when observer is not signed in (by @jbdesbas)
* Allow to desactivate Observers names (by @jbdesbas & @lpofredc)
* Program selection style in modal similar to home page (by @lpofredc)
* Add a CHANGELOG file (by @camillemonchicourt)
* Add demo link into README.md

**🐛 Some fixes**

* Add and fix ``ondelete`` on models
* Update README.md (new screenshots, update project details)

0.1.1 (2019-09-20)
------------------

End of Natural Solutions mission

**🚀 New features**

* Taxonomy lists are now selectable in program admin backoffice (by @lpofredc)
* Program description width is now 1/3 (instead of 2/3) of program header (by @HamoudaAmine from @NaturalSolutions)
* Update badges rules engine (by @HamoudaAmine from @NaturalSolutions)

![Programs Model - GN-Citizen: Backoffice d'administration](https://user-images.githubusercontent.com/22891423/64546035-27b87d00-d32a-11e9-9ade-e286283decab.jpg)

![image](https://user-images.githubusercontent.com/22891423/64546023-212a0580-d32a-11e9-8ac7-84b9f6b62adb.png)

0.1.0 (2019-08-20)
------------------

First pre-release. To test, some few bugs still to fix
