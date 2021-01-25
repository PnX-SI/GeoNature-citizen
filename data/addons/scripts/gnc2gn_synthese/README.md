# Scripts pour alimenter automatiquement une synthèse GeoNature2 à partir de GeoNature-citizen

## Prérequis

GeoNature2 et GeoNature-citizen doivent être installés sur une même base de données.

## Déroulement

L'alimentation automatique de GeoNature2 s'effectue par l'application de triggers sur les tables de GeoNature-citizen:

1. Projets > Cadres d'acquisitions
2. Programmes > Jeux de données;
3. Observations > Occurence de taxon en synthèse.

## Mise en place

Dans un terminal, éxécutez le script sur la base de données GeoNature en adaptant la commande suivante:

```bash
psql -d <mabddgeonature> -f gnc2gn_synthese.sql
```

## Astuce

Il est possible de référencer automatiquement les nomenclatures de la synthèse à partir des donnes du formulaire custom.

Pour cela, configurez des champs nommés comme les champs de la synthèse sans le préfixe `id_` et utilisez
le `cd_nomenclature` comme valeur à enregistrer dans le champ json.

Par exemple, pour le sexe d'un taxon (champ `id_nomenclature_sexe` dans la table `gn_synthese.synthese`, créez un
champ `nomenclature_sexe` et donnez lui les valeurs de cd_nomenclature correspondant.

