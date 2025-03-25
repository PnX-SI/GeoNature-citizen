# CHANGELOG

## 1.2.0 - 202x-xx-xx

**!!! Last version compatible with geoNature 2.14 and below***

### Main new features

* Add id_observation to observations list in backoffice (#428 by @hypsug0)
* Add compatibility to Python 3.12, revoke compatibility with Python 3.8 (#406 by @hypsug0)
* Use BaseLayers sets in conf and impove map in add-site form component. cf. #411, #413, #414 (#415 by @xavyeah39)
* Add sites count stats to home (#438 by @andriacap)

### Fixes

* Standardization of frontend map components between site and observation modules (#415 by @xavyeah39)
* Fix password scratch when user profile edited from backoffice, cf. #420 (#429, #446 by @hypsug0)
* Fix clicnat-citizen url (#433 by @PaulLabruyere)
* Fix url redirection to backoffice (#435 by @andriacap)
* Avoid using single page application to use server side rendering only (#439 by PaulLabruyère)
* Fix thumbnail label not clickable on shot species list (#443 by hypsyg0)

## 1.1.0 - 2024-04-06

### Main new features

* New backoffice views to manage site module data (#402 by @hypsug0)
* Some new github actions (by @hypsug0)

### Fixes

* Fix send email on registration (#396 by @PNPyrenees)
* Standardizing date formatting (#401 by @hypsug0)
* Fix new obs pointer not customizable (#400 by @hypsug0)
* Improve english translations (by @hypsug0)
* Docs and changelog improvements (by @camillemonchicourt)
* Fix invalid password check on password with some special characters (by @hypsug0)

## 1.0.0 - 2024-03-18

### Main new features

* Validation module by @yaal-coop (#359 financed by [SHF](https://lashf.org))
* Registration required can be defined on each program (#278 by @xdidx)
* Refactor and improve performances on observation module (# 363 by @hypsug0)
* New photo galery on programs (#365 by @hypsug0, financed by [SHF](https://lashf.org))
* Add observation export in Admin (#349 by @mvergez)
* Creators can now edit and delete their sites and visits in Sites programs (#319 & #320 by @QuentinJouet)
* Improve Admin panel display (#329 by @mvergez)
* Use Alembic and Flask-Migrate to manage database changes (#342 by @lpofredc)
* Remove TaxHub installation from installation scripts
* Reduce TaxHub database dependencies to use its API (#236 & #321 by @mvergez)
* Remove Ref_geo database dependencies to use Nominatim API (#236 & #321 by @mvergez)
* Improve Docker installation (by @mvergez)
* Automatic resizing of uploaded avatar images (#335 by @xdidx)

### Fixes

* Standard installation fixes (thanks to all testers > #352)
* Fix form validation on negative longitude (#360 & #261 by @pierre56 & @hypsug0)
* Fix user creation from Admin panel (#371 by @edelclaux)
* Fix default map center in Admin panel (#370 by @edelclaux)
* Fix email from (#369 by @edelclaux)

## Release note

Si vous mettez à jour GeoNature-citizen :

Veillez à ce que votre base de données soit bien à jour des scripts de migration de la base de données du dossier `data/migrations` (incluant le dernier `v0.99.4_to_1.0.0.sql`).  
Vous pourrez ensuite stamper la migration de GeoNature-citizen et lancer la nouvelle procédure de mise à jour.

```sh
cd ~/gncitizen
source backend/venv/bin/activate
flask db stamp e8c1cd57ad16
flask db upgrade
```

Si une table `gnc_core.alembic_version` est présente dans la base de données, alors vous disposez d'une version récente de l'application avec intégration d'Alembic pour gérer les migrations de base de données. Cette table a été récemment déplacée dans le schéma `public` et renommée `alembic_version_gncitizen`. Supprimez cette table et lancez les commandes précédentes.

Si vous disposez déjà d'une table `public.alembic_version_gncitizen`, lancez les commandes suivantes :

```sh
cd ~/gncitizen
source backend/venv/bin/activate
flask db upgrade
```

Pour ceux qui avaient activé la synchronisation de GeoNature-citizen avec GeoNature, la fonction `gnc_core.fct_tri_c_upsert_obstax_to_geonature()` a été corrigée. Il est donc conseillé de la supprimer et la recréer (<https://github.com/PnX-SI/GeoNature-citizen/blob/1.0.0/data/addons/scripts/gnc2gn_synthese/gnc2gn_synthese.sql#L113-L374>), puis de relancer la mise à jour des données dans la synthèse de GeoNature avec la requête SQL : `update gnc_obstax.t_obstax set cd_nom=cd_nom;`.  

## Contributors

@lpofredc, @mvergez, @QuentinJouet, @xdidx, @nobohan, @geobrun, @LoanR, @edelclaux, @xavyeah39, @samuelpriou, @camillemonchicourt

## 0.99.4-dev (2021-10-05)

**🚀 New features**

* Add a maintenance page
* Disallow ckeditor cleanup code in backoffice
* Review and improve installation documentation
* Adds the ability to use the [hCaptcha](https://hcaptcha.com/) checker
* Email confirmation of registration is now optional
* Sign-in can be done using username or email (previously only by email)
* Very lightweight observation management in backoffice
* Add new IGN layers to default layers
* Change thumbnail selector to a non interactive image on observations form while there is only one taxa available.
* All visits are now readable on a site details page.

**🐛 Fixes**

* Order API taxa list by French name
* Remove some local taxonomy dependencies
* Update dependencies versions from `requirements.txt` using:

  * `poetry export --without-hashes > requirements.txt`
  * `poetry export --without-hashes -D > requirements-dev.txt`
  * but it's preferable to simply use `poetry install`

* Change internal serialization methods to PnX-SI shared modules `utils-flask-sqlalchemy` &  
  `utils-flask-sqlalchemy-geo`
* Various dependencies updates on both backend and frontend

---

## 0.99.3-dev (2021-02-23)

**🚀 New features**

* Best new feature: sign up is now configurable (options are : never|optional|always) (by @QuentinJouet, financed by Parc National du Mercantour | @samuelpriou )
* Feat: backend python management with python-poetry
* Feat: improve flask-admin UI (hide columns, now use bootstrap 4)
* Various dependencies updates on both backend and frontend

---

## 0.99.1-dev (2021-02-23)

**🐛 Fixes**

* Latest update broke site form validation when type is set by default when there is only one type site
* Some other minor updates

## 0.99.0-dev (2021-02-19)

**🚀 Nouveautés**

* Le mode privilégié pour le Frontend est le Server Side Rendering (rendu côté serveur)
* Développement de la possibilité de créer des programmes d'inventaires et de visites de sites, basés sur des champs additionnels dynamiques stockés en jsonb (actuellement utilisée par <https://www.a-vos-mares.org>) ([#34](https://github.com/PnX-SI/GeoNature-citizen/issues/34), @QuentinJouet & @jolleon)
* Possibilité de définir si un programme est de type "Observations" ou "Sites" ([#179](https://github.com/PnX-SI/GeoNature-citizen/issues/179), [#209](https://github.com/PnX-SI/GeoNature-citizen/issues/209), @QuentinJouet & @jolleon)
* Possibilité d'ajouter des champs additionnels dynamiques stockés en jsonb sur les programmes de type "Observations", utilisant Angular JSON Schema Form (#181, @QuentinJouet & @jolleon)
* Révision ergonomique du formulaire de saisie, positionné sur la liste des observations ([#218](https://github.com/PnX-SI/GeoNature-citizen/issues/218), @jolleon)
* Révision du tableau de bord de l'observateur pour un affichage liste/carte semblable à une page de programme (@jolleon)
* Tableau de bord : Possibilité de visualiser les sites dans la liste des observations ainsi que sur la carte et pouvoir les éditer (@jolleon)
* Tableau de bord : Possibilité d'exporter les sites (@jolleon)
* Exports des observateurs adaptés pour contenir les données de formulaires personnalisés (@jolleon)
* Ajout d'un paramètre `FRONTEND.NEW_OBS_FORM_MODAL_VERSION`, permettant de définir si le formulaire de saisie est sur la barre latérale ou dans une modale comme précédemment ([#218](https://github.com/PnX-SI/GeoNature-citizen/issues/218), @jolleon)
* Possibilité de charger plusieurs photos associées à une observation ([#208](https://github.com/PnX-SI/GeoNature-citizen/issues/208), @jolleon)
* Ajout d'une page de détail pour chaque observation, incluant les éventuelles photos associées ([#223](https://github.com/PnX-SI/GeoNature-citizen/issues/223), @jolleon)
* Mise en place d'un outil permettant de générer un projet QGIS d'administration des données de GeoNature-citizen ([#222](https://github.com/PnX-SI/GeoNature-citizen/issues/222), @lpofredc)
* Ajout de métadonnées aux pages web (title, description, mot-clés) ([#205](https://github.com/PnX-SI/GeoNature-citizen/issues/205), @lpofredc)
* Ajout d'un message paramétrable (`registration_message`) d'incitation à l'inscription ([#177](https://github.com/PnX-SI/GeoNature-citizen/issues/177), @lpofredc)
* Ajout d'un message personnalisé en tête du formulaire de saisie d'une observation, personnalisé dans la table de paramétrage du programme (@lpofredc)
* Ajout de la possibilité d'afficher le nom scientifique des taxons (`taxonDisplaySciName`)
* Sécurisation de l'interface d'administration des programmes (([#211](https://github.com/PnX-SI/GeoNature-citizen/issues/211)) (@lpofredc)
* Administration : Possibilité de charger une géométrie à partir d'un fichier GeoJSON ou KML pour définir l'emprise géographique d'un programme (@jolleon)
* Administration : Possibilité de mutualiser les zones géographiques entre plusieurs programmes ([#245](https://github.com/PnX-SI/GeoNature-citizen/issues/245), @jolleon)
* Enrichissement de l'interface d'administration pour gérer dorénavent les programmes, les formulaires personnalisés (_json schema form_), et les utilisateurs inscrits (@lpofredc)
* Intitulé des programmes personnalisables (ex: Missions, Enquêtes) (@lpofredc)
* Améliorations diverses du style et de l'ergonomie (@jolleon, @lpofredc)
* Révision et réorganisation complète de la documentation (merci @Splendens et @ksamuel) ([#166](https://github.com/PnX-SI/GeoNature-citizen/issues/166))
* Création d'un script pour simplifier et automatiser l'installation de GeoNature-citizen ([#167](https://github.com/PnX-SI/GeoNature-citizen/issues/167))
* Création d'un niveau "Projet" équivalent au cadre d'acquisition de GeoNature ([#247](https://github.com/PnX-SI/GeoNature-citizen/issues/247))
* Mise à disposition d'un script d'alimentation automatique GeoNature (@hypsug0):
  * projet > cadre d'acquisition
  * enquête > jeu de données
  * observation > occurence de taxon en synthèse

**🐛 Corrections**

* Désactivation du bouton d'enregistrement d'une observation après sa validation (évite les enregistrements multiples en cas de réponse lente du backend) (@jolleon)

**⚠️ Notes de version**

Si vous mettez à jour GeoNature-citizen à partir de la version 0.3.0 :

* Lancer successivement les scripts SQL de mise à jour de la BDD de GeoNature-citizen
  _<https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.3.0_to_0.3.1.sql>
  _ <https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.3.1_to_0.4.0.sql>
  _<https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.4.0_to_0.5.0.sql>
  _ <https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/data/migrations/v0.5.0_to_0.99.0.sql>

## 0.3.0 (2020-02-12)

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

* Lancer le script SQL de mise à jour de la BDD de GeoNature-citizen <https://raw.githubusercontent.com/PnX-SI/GeoNature-citizen/master/data/migrations/v0.2.0_to_0.3.0.sql>

## 0.2.0 (2019-11-20)

**🚀 New features**

* Better geolocation icon (#162)
* Allow to desactivate Signup/signin (@jbdesbas)
* Allow to add an optional email field in form when observer is not signed in (@jbdesbas)
* Allow to desactivate Observers names (@jbdesbas & @lpofredc)
* Program selection style in modal similar to home page (@lpofredc)
* Add a CHANGELOG file (@camillemonchicourt)
* Add demo link into README.md

**🐛 Some fixes**

* Add and fix `ondelete` on models
* Update README.md (new screenshots, update project details)

  0.1.1 (2019-09-20)

---

End of Natural Solutions mission

**🚀 New features**

* Taxonomy lists are now selectable in program admin backoffice (@lpofredc)
* Program description width is now 1/3 (instead of 2/3) of program header (@HamoudaAmine from @NaturalSolutions)
* Update badges rules engine (@HamoudaAmine from @NaturalSolutions)

![Programs Model - GN-Citizen: Backoffice d'administration](https://user-images.githubusercontent.com/22891423/64546035-27b87d00-d32a-11e9-9ade-e286283decab.jpg)

![image](https://user-images.githubusercontent.com/22891423/64546023-212a0580-d32a-11e9-8ac7-84b9f6b62adb.png)

## 0.1.0 (2019-08-20)

First pre-release. To test, some few bugs still to fix
