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

Pour construire un select basé sur les nomenclatures:

```sql
SELECT
    json_agg(
            json_build_object('value', cd_nomenclature, 'name', label_default)
        ) AS titlemap
    FROM
        ref_nomenclatures.t_nomenclatures
    WHERE
            id_type = ref_nomenclatures.get_id_nomenclature_type(
                'SEXE')
;
```

Exemple de formulaire custom avec les nomenclatures `SEXE` et `STADE_VIE`

```json
{
  "schema": {
    "type": "object",
    "properties": {
      "nomenclature_sex": {
        "type": "string",
        "title": "Sexe"
      },
            "nomenclature_life_stage": {
        "type": "string",
        "title": "Stade de vie"
      }
    }
  },
  "form": [
    { "key": "nomenclature_sex",
      "type": "select",
      "titleMap": [
        {"value" : "0", "name" : "Inconnu"},
        {"value" : "1", "name" : "Indéterminé"},
        {"value" : "2", "name" : "Femelle"},
        {"value" : "3", "name" : "Mâle"},
        {"value" : "4", "name" : "Hermaphrodite"},
        {"value" : "5", "name" : "Mixte"},
        {"value" : "6", "name" : "Non renseigné"}
      ]
    },
    { "key": "nomenclature_life_stage",
      "type": "select",
      "titleMap": [
          {"value" : "0", "name" : "Inconnu"}, 
          {"value" : "1", "name" : "Indéterminé"}, 
          {"value" : "2", "name" : "Adulte"}, 
          {"value" : "3", "name" : "Juvénile"},
          {"value" : "4", "name" : "Immature"}, 
          {"value" : "5", "name" : "Sub-adulte"}, 
          {"value" : "6", "name" : "Larve"}, 
          {"value" : "7", "name" : "Chenille"}, 
          {"value" : "8", "name" : "Têtard"}, 
          {"value" : "9", "name" : "Œuf"}, 
          {"value" : "10", "name" : "Mue"}, 
          {"value" : "11", "name" : "Exuvie"}, 
          {"value" : "12", "name" : "Chrysalide"}, 
          {"value" : "13", "name" : "Nymphe"}, 
          {"value" : "14", "name" : "Pupe"}, 
          {"value" : "15", "name" : "Imago"}, 
          {"value" : "16", "name" : "Sub-imago"}, 
          {"value" : "17", "name" : "Alevin"}, 
          {"value" : "18", "name" : "Germination"}, 
          {"value" : "19", "name" : "Fané"}, 
          {"value" : "20", "name" : "Graine"}, 
          {"value" : "21", "name" : "Thalle, protothalle"}, 
          {"value" : "22", "name" : "Tubercule"}, 
          {"value" : "23", "name" : "Bulbe"}, 
          {"value" : "24", "name" : "Rhizome"}, 
          {"value" : "25", "name" : "Emergent"}, 
          {"value" : "26", "name" : "Post-Larve"}
          ] 
    }
  ]
}
```