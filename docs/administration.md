# Création de programmes

## Processus de création de programmes

1. Projet (à considérer comme un cadre d'acquisition au sens SINP)
2. Création d'une zone géographique
3. Création d'un formulaire dynamique (optionnel)
4. Création d'un type de site (obligatoire pour enquetes "Site" uniquement)
5. Création d'un programme (à considérer comme un jeu de données au sens SINP)

## Création d'un projet

... à compléter

## Création d'une zone géographique

... à compléter

## Création d'un formulaire dynamique

Les formulaires dynamiques sont actuellement gérés par le module [`Angular JSON Schema Form`](https://github.com/hamzahamidi/ajsf).

Un site de test et de développement des formulaires est disponible sur [https://partage.lpo-aura.org/minisite/ajsf/](https://partage.lpo-aura.org/minisite/ajsf/).

Des exemples issues d'enquêtes mises en place sur GeoNature-citizen sont disponibles sur [https://gist.github.com/lpofredc/a85e994776efd6a63757d2817fd7862c](https://gist.github.com/lpofredc/a85e994776efd6a63757d2817fd7862c)

## Création d'un type site

Il est possible, pour les enquêtes "Sites" de paramétrer plusieurs types de sites pour une même enquête. Chacun permettant d'utiliser un formulaire dynamique spécifique en fonction du type choisi.

## Création d'un programme

... à compléter

## Activer le module de validation

Module financé par la SHF dans le cadre du projet "Un Dragon dans mon jardin".

Le concept du module de validation de GeoNature-citizen est différent de la validation au sens du SINP. Il s'agit d'un processus d'interaction avec l'observateur permettant de redéfinir l'espèce observée (sur la base de éléments fournis) ou d'informer l'observateur que son observation ne peut être confirmée en l'état. L'initiative de ce module est décrit ici: https://github.com/PnX-SI/GeoNature-citizen/issues/359

Pour activer le module de validation, il est nécessaire de configurer les paramètres :

    VERIFY_OBSERVATIONS_ENABLED (dans `config/config.toml` et `frontend/src/conf/app.config.ts`)
    VALIDATION_EMAIL (dans `config/config.toml`)

Il est nécessaire de recompiler le frontend pour que ce paramètre prenne effet.
