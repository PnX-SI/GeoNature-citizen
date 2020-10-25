CHANGELOG
=========

1.0.0 (unreleased)
------------------

Voir https://github.com/PnX-SI/GeoNature-citizen/compare/dev

**🚀 Nouveautés**

* Développement de la possibilité de créer des programmes d'inventaires et de visites de sites, basés sur des champs additionnels dynamiques stockés en jsonb, uniquement pour des mares pour le moment (https://www.a-vos-mares.org) (#34)
* Possibilité de définir si un programme est de type "Observations" ou "Sites" (#179, #209)
* Possibilité d'ajouter des champs additionnels dynamiques stockés en jsonb sur les programmes de type "Observations", utilisant Angular JSON Schema Form (#181)
* Révision ergonomique du formulaire de saisie, positionné sur la liste des observations (#218)
* Ajout d'un paramètre ``FRONTEND.NEW_OBS_FORM_MODAL_VERSION``, permettant de définir si le formulaire de saisie est sur la barre latérale ou dans une modale comme précédemment (#218)
* Possibilité de charger plusieurs photos associées à une observation (#208)
* Ajout d'une page de détail pour chaque observation, incluant les éventuelles photos associées (#223)
* Mise en place d'un outil permettant de générer un projet QGIS d'administration des données de GeoNature-citizen (#222)
* Ajout de métadonnées aux pages web (title, description, mot-clés) (#205)
* Ajout d'un message paramétrable (``registration_message``) d'incitation à l'inscription (#177)
* Ajout de la possibilité d'afficher le nom scientifique des taxons (``taxonDisplaySciName``)
* Sécurisation de l'interface d'administration des programmes (#211)
* Améliorations diverses du style et de l'ergonomie
* Révision et réorganisation complète de la documentation (merci @Splendens et @ksamuel) (#166)

**🐛 Corrections**

* 

**⚠️ Notes de version**

* Un SQL pour mettre à jour la BDD pour ceux en version 0.3.0 ? data/migrations/v0.3.1_to_0.4.0.sql ? A renommer v0.3.0_to_1.0.0 ?
* Des scripts ou commandes spécifiques à cette version à exécuter ?
* Une procédure classique de MAJ de GN-citizen à suivre ?

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
