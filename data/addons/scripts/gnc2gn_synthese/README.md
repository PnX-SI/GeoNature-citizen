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


| Type nomenclature | titleMap |
| :--- | :--- |
| TYP\_INF\_GEO | ```[{"value" : "1", "name" : "Géoréférencement"}, {"value" : "2", "name" : "Rattachement"}]``` |
| STATUT\_OBS | ```[{"value" : "No", "name" : "Non observé"}, {"value" : "Pr", "name" : "Présent"}]``` |
| SEXE | ```[{"value" : "0", "name" : "Inconnu"}, {"value" : "1", "name" : "Indéterminé"}, {"value" : "2", "name" : "Femelle"}, {"value" : "3", "name" : "Mâle"}, {"value" : "4", "name" : "Hermaphrodite"}, {"value" : "5", "name" : "Mixte"}, {"value" : "6", "name" : "Non renseigné"}]``` |
| STATUT\_SOURCE | ```[{"value" : "Co", "name" : "Collection"}, {"value" : "Li", "name" : "Littérature"}, {"value" : "NSP", "name" : "Ne Sait Pas"}, {"value" : "Te", "name" : "Terrain"}]``` |
| PREUVE\_EXIST | ```[{"value" : "0", "name" : "Inconnu"}, {"value" : "1", "name" : "Oui"}, {"value" : "2", "name" : "Non"}, {"value" : "3", "name" : "Non acquise"}]``` |
| METH\_OBS | ```[{"value" : "0", "name" : "Vu"}, {"value" : "1", "name" : "Entendu"}, {"value" : "2", "name" : "Coquilles d'œuf"}, {"value" : "3", "name" : "Ultrasons"}, {"value" : "4", "name" : "Empreintes"}, {"value" : "5", "name" : "Exuvie"}, {"value" : "6", "name" : "Fèces/Guano/Epreintes"}, {"value" : "7", "name" : "Mues"}, {"value" : "8", "name" : "Nid/Gîte"}, {"value" : "9", "name" : "Pelote de réjection"}, {"value" : "10", "name" : "Restes dans pelote de réjection"}, {"value" : "11", "name" : "Poils/plumes/phanères"}, {"value" : "12", "name" : "Restes de repas"}, {"value" : "13", "name" : "Spore"}, {"value" : "14", "name" : "Pollen"}, {"value" : "15", "name" : "Oosphère"}, {"value" : "16", "name" : "Ovule"}, {"value" : "17", "name" : "Fleur"}, {"value" : "18", "name" : "Feuille"}, {"value" : "19", "name" : "ADN environnemental"}, {"value" : "20", "name" : "Autre"}, {"value" : "21", "name" : "Inconnu"}, {"value" : "22", "name" : "Mine"}, {"value" : "23", "name" : "Galerie/terrier"}, {"value" : "24", "name" : "Oothèque"}, {"value" : "25", "name" : "Vu et entendu"}, {"value" : "26", "name" : "Olfactif"}, {"value" : "27", "name" : "Empreintes et fèces"}]``` |
| TECHNIQUE\_OBS | ```[{"value" : "15", "name" : "Création d'habitat refuge : autres techniques"}, {"value" : "14", "name" : "Chalutage terrestre \(capture au filet de toit - voiture\)"}, {"value" : "16", "name" : "Création d'habitat refuge : couverture du sol \(plaques, bâches\)"}, {"value" : "1", "name" : "Analyse ADN environnemental \(ADNe\)"}, {"value" : "2", "name" : "Analyse de restes de prédateurs - pelotes de réjection, restes de repas de carnivores, analyses stomacales"}, {"value" : "3", "name" : "Aspirateur à air comprimé \(marin\)"}, {"value" : "4", "name" : "Aspiration moteur type D-VAC \(aspirateur à moteur\)"}, {"value" : "5", "name" : "Attraction pour observation \(miellée, phéromones…\)"}, {"value" : "6", "name" : "Battage \(battage de la végétation, parapluie japonais\)"}, {"value" : "7", "name" : "Battue avec rabatteurs"}, {"value" : "8", "name" : "Brossage \(terrestre : écorces…\)"}, {"value" : "9", "name" : "Capture au collet"}, {"value" : "10", "name" : "Capture au filet Cryldé"}, {"value" : "11", "name" : "Capture au filet japonais"}, {"value" : "12", "name" : "Capture au filet stationnaire"}, {"value" : "13", "name" : "Capture directe \(capture à vue, capture relâche\)"}, {"value" : "17", "name" : "Création d'habitat refuge : dévitalisation de plantes, mutilation"}, {"value" : "18", "name" : "Création d'habitat refuge : hôtels à insectes, nichoirs"}, {"value" : "19", "name" : "Création d'habitat refuge : substrat artificiel aquatique"}, {"value" : "20", "name" : "Détection au chien d'arrêt"}, {"value" : "21", "name" : "Détection des ultrasons \(écoute indirecte, analyse sonore, détection ultrasonore\)"}, {"value" : "22", "name" : "Détection nocturne à la lampe frontale \(chasse de nuit à la lampe frontale\)"}, {"value" : "23", "name" : "Ecorcage"}, {"value" : "24", "name" : "Ecoute directe \(reconnaissance sonore directe, détection auditive\)"}, {"value" : "25", "name" : "Ecoute directe avec hydrophone"}, {"value" : "26", "name" : "Ecoute directe avec repasse"}, {"value" : "27", "name" : "Enregistrement sonore avec hydrophone"}, {"value" : "28", "name" : "Enregistrement sonore simple"}, {"value" : "29", "name" : "Etude de la banque de graines du sol"}, {"value" : "30", "name" : "Examen des hôtes - écrevisses et poissons \(sangsues piscicolidae et branchiobdellidae\)"}, {"value" : "31", "name" : "Extraction de substrat : délitage de susbtrats durs \(marin\)"}, {"value" : "32", "name" : "Extraction de substrat par benne \(Van Veen, Smith McIntyre, Hamon…\)"}, {"value" : "33", "name" : "Extraction de substrat par carottier à main \(en plongée\)"}, {"value" : "34", "name" : "Extraction de substrat par carottier à main \(sans plongée - continental ou supra/médiolittoral\)"}, {"value" : "35", "name" : "Extraction de substrat par filet dragueur ou haveneau \(drague Rallier du Baty, Charcot Picard…\)"}, {"value" : "36", "name" : "Extraction de substrat terrestre : bloc de sol, récolte de litière…"}, {"value" : "37", "name" : "Fauchage marin au filet fauchoir \(en plongée\)"}, {"value" : "38", "name" : "Fauchage marin au filet fauchoir \(sans plongée - supra/médiolittoral\)"}, {"value" : "39", "name" : "Fauchage terrestre au filet fauchoir \(fauchage de la végétation\)"}, {"value" : "40", "name" : "Fumigation \(fogging, thermonébulisation insecticide\)"}, {"value" : "41", "name" : "Grattage, brossage du susbtrat \(marin\)"}, {"value" : "42", "name" : "Méthode de De Vries \(méthode des prélèvements, méthode des poignées\)"}, {"value" : "43", "name" : "Méthode de l'élastique \(lézards arboricoles\)"}, {"value" : "44", "name" : "Observation à la moutarde - vers de terre"}, {"value" : "45", "name" : "Observation aux jumelles \(observation à la longue-vue\)"}, {"value" : "46", "name" : "Observation aux lunettes polarisantes"}, {"value" : "47", "name" : "Observation de détritus d'inondation, débris et laisses de crues"}, {"value" : "48", "name" : "Observation de larves \(recherche de larves\)"}, {"value" : "49", "name" : "Observation de macro-restes \(cadavres, élytres…\)"}, {"value" : "50", "name" : "Observation de micro-habitats \(recherche de gîtes, chandelles, polypores, dendrotelmes…\) "}, {"value" : "51", "name" : "Observation de pontes \(observation des œufs, recherche des pontes\)"}, {"value" : "52", "name" : "Observation de substrat et tamisage"}, {"value" : "53", "name" : "Observation de substrat par extraction : appareil de Berlèse-Tullgren, Winckler-Moczarski…"}, {"value" : "54", "name" : "Observation de substrat par extraction : par flottaison \(par densité\)"}, {"value" : "55", "name" : "Observation de trous de sortie, trous d'émergence"}, {"value" : "56", "name" : "Observation d'exuvies"}, {"value" : "57", "name" : "Observation d'indices de présence"}, {"value" : "58", "name" : "Observation directe marine \(observation en plongée\)"}, {"value" : "59", "name" : "Observation directe terrestre diurne \(chasse à vue de jour\)"}, {"value" : "60", "name" : "Observation directe terrestre nocturne \(chasse à vue de nuit\)"}, {"value" : "61", "name" : "Observation directe terrestre nocturne au phare"}, {"value" : "62", "name" : "Observation manuelle de substrat \(litière, sol…\)"}, {"value" : "63", "name" : "Observation marine par caméra suspendue"}, {"value" : "64", "name" : "Observation marine par traineau vidéo"}, {"value" : "65", "name" : "Observation marine par véhicule téléguidé \(ROV\)"}, {"value" : "66", "name" : "Observation marine photographique \(observation photographique en plongée\)"}, {"value" : "67", "name" : "Observation par piège photographique"}, {"value" : "68", "name" : "Observation photographique aérienne, prise de vue aérienne"}, {"value" : "69", "name" : "Observation photographique terrestre \(affût photographique\)"}, {"value" : "70", "name" : "Paniers à vers de terre"}, {"value" : "71", "name" : "Pêche à la palangre"}, {"value" : "72", "name" : "Pêche à l'épuisette \(capture par épuisette, chasse à l'épuisette\)"}, {"value" : "73", "name" : "Pêche au chalut, chalutage \(chalut à perche...\)"}, {"value" : "74", "name" : "Pêche au filet - à détailler"}, {"value" : "75", "name" : "Pêche au filet lesté \(pêche à la senne\)"}, {"value" : "76", "name" : "Pêche au filet Surber"}, {"value" : "77", "name" : "Pêche au filet troubleau \(chasse au filet troubleau\)"}, {"value" : "78", "name" : "Pêche électrique, électropêche"}, {"value" : "79", "name" : "Piégeage à appât type Plantrou \(piège à Charaxes\)"}, {"value" : "80", "name" : "Piégeage à cornet \(capture par piège cornet unidirectionnel\)"}, {"value" : "81", "name" : "Piégeage à fosse à coprophages"}, {"value" : "82", "name" : "Piégeage à fosse à nécrophages"}, {"value" : "83", "name" : "Piégeage à fosse appâté \(capture par piège à fosse avec liquide conservateur, piège Barber, pot-piège\)"}, {"value" : "84", "name" : "Piégeage à fosse non appâté \(piège à fosse sans liquide conservateur\)"}, {"value" : "85", "name" : "Piégeage adhésif \(piège collant, piège gluant, bande collante\)"}, {"value" : "86", "name" : "Piégeage aérien à succion \(aspirateur échantillonneur, piège à moustiques\)"}, {"value" : "87", "name" : "Piégeage aérien rotatif"}, {"value" : "88", "name" : "Piégeage au sol - à détailler"}, {"value" : "89", "name" : "Piégeage bouteille \(piège à vin, piège à appât fermenté, piège à cétoines\)"}, {"value" : "90", "name" : "Piégeage entomologique composite \(PEC\)"}, {"value" : "91", "name" : "Piégeage lumineux aquatique à fluorescence"}, {"value" : "92", "name" : "Piégeage lumineux aquatique à incandescence"}, {"value" : "93", "name" : "Piégeage lumineux aquatique à LED"}, {"value" : "94", "name" : "Piégeage lumineux automatique à fluorescence"}, {"value" : "95", "name" : "Piégeage lumineux automatique à incandescence"}, {"value" : "96", "name" : "Piégeage lumineux automatique à LED"}, {"value" : "97", "name" : "Piégeage lumineux manuel à fluorescence"}, {"value" : "98", "name" : "Piégeage lumineux manuel à incandescence"}, {"value" : "99", "name" : "Piégeage lumineux manuel à LED"}, {"value" : "100", "name" : "Piégeage Malaise \(capture par tente Malaise\)"}, {"value" : "101", "name" : "Piégeage Marris House Net \(capture par piège Malaise type Marris House Net\)"}, {"value" : "102", "name" : "Piégeage microtube à fourmis"}, {"value" : "103", "name" : "Piégeage par assiettes colorées \(piège coloré, plaque colorée adhésive\)"}, {"value" : "104", "name" : "Piégeage par attraction sexuelle avec femelles"}, {"value" : "105", "name" : "Piégeage par attraction sexuelle avec phéromones"}, {"value" : "106", "name" : "Piégeage par enceinte à émergence aquatique \(nasse à émergence aquatique\)"}, {"value" : "107", "name" : "Piégeage par enceinte à émergence terrestre ex situ \(nasse à émergence terrestre, éclosoir\)"}, {"value" : "108", "name" : "Piégeage par enceinte à émergence terrestre in situ \(nasse à émergence terrestre, éclosoir\)"}, {"value" : "109", "name" : "Piégeage par enceinte type biocénomètre"}, {"value" : "110", "name" : "Piégeage par nasse à Coléoptères Hydrocanthares \(piège appâté aquatique\)"}, {"value" : "111", "name" : "Piégeage par nasses aquatiques ou filets verveux \(appâtés\)"}, {"value" : "112", "name" : "Piégeage par nasses aquatiques ou filets verveux \(non appâtés\)"}, {"value" : "113", "name" : "Piégeage par piège à entonnoir terrestre \(funnel trap\) \(appâté\)"}, {"value" : "114", "name" : "Piégeage par piège à entonnoir terrestre \(funnel trap\) \(non appâté\)"}, {"value" : "115", "name" : "Piégeage par piège-vitre bidirectionnel \\\\\\"mimant une cavité\\\\\\" \(bande noire\)"}, {"value" : "116", "name" : "Piégeage par piège-vitre bidirectionnel \(piège fenêtre, piège-vitre plan\)"}, {"value" : "117", "name" : "Piégeage par piège-vitre multidirectionnel avec alcool \(piège Polytrap, PIMUL\)"}, {"value" : "118", "name" : "Piégeage par piège-vitre multidirectionnel sans alcool \(piège Polytrap, PIMUL\)"}, {"value" : "119", "name" : "Piégeage par sac collecteur de feuillage et rameaux ligneux"}, {"value" : "120", "name" : "Piégeage par sélecteur de Chauvin"}, {"value" : "121", "name" : "Piégeage par tissu imbibé d'insecticide"}, {"value" : "122", "name" : "Piégeage SLAM \(capture par piège Sand Land and Air Malaise\)"}, {"value" : "123", "name" : "Piégeages par pièges barrières \(pots-pièges associés à une barrière d'interception\)"}, {"value" : "124", "name" : "Pièges à poils"}, {"value" : "125", "name" : "Pièges à traces \(pièges à empreintes\)"}, {"value" : "126", "name" : "Pièges aquatiques à sangsues \(bouteilles percées, appâtées…\)"}, {"value" : "127", "name" : "Pièges cache-tubes"}, {"value" : "128", "name" : "Pièges cache-tubes adhésifs \(tubes capteurs de poils\)"}, {"value" : "129", "name" : "Prélèvement par râteau ou grappin \(macrophytes\)"}, {"value" : "130", "name" : "Prospection à pied de cours d'eau \(macrophytes\)"}, {"value" : "131", "name" : "Prospection active dans l'habitat naturel \(talus, souches, pierres…\)"}, {"value" : "132", "name" : "Recherche dans filtres de piscines, skimmer"}, {"value" : "133", "name" : "Non renseigné"}]``` |
| METH\_DETERMIN | ```[{"value" : "3", "name" : "Analyse d’ADN environnemental"}, {"value" : "4", "name" : "Analyse ADN de l'individu ou de ses restes"}, {"value" : "5", "name" : "Analyse biophysique ou biochimique"}, {"value" : "6", "name" : "Déduction de l'espèce par n° d'identification"}, {"value" : "7", "name" : "Détermination informatique par un outil de reconnaissance automatique"}, {"value" : "8", "name" : "Examen biométrique"}, {"value" : "9", "name" : "Examen auditif direct"}, {"value" : "10", "name" : "Examen auditif avec transformation électronique"}, {"value" : "11", "name" : "Examen des organes reproducteurs ou critères spécifiques en laboratoire"}, {"value" : "2", "name" : "Autre méthode de détermination"}, {"value" : "22", "name" : "Examen visuel sur photo ou vidéo"}, {"value" : "16", "name" : "Examen des traces ou indices de présence sur photo ou vidéo"}, {"value" : "21", "name" : "Examen visuel de l’individu en main"}, {"value" : "1", "name" : "Non renseigné"}, {"value" : "12", "name" : "Examen des organes reproducteurs ou critères spécifiques sur le terrain"}, {"value" : "13", "name" : "Examen des restes de l’individu sous loupe ou microscope"}, {"value" : "14", "name" : "Examen visuel des restes de l’individu"}, {"value" : "15", "name" : "Examen des restes de l'individu sur photo ou vidéo"}, {"value" : "17", "name" : "Examen direct des traces ou indices de présence"}, {"value" : "18", "name" : "Examen visuel à distance"}, {"value" : "19", "name" : "Examen visuel en collection "}, {"value" : "20", "name" : "Examen visuel sous loupe ou microscope"}]``` |
| NATURALITE | ```[{"value" : "0", "name" : "Inconnu"}, {"value" : "1", "name" : "Sauvage"}, {"value" : "2", "name" : "Cultivé/élevé"}, {"value" : "3", "name" : "Planté"}, {"value" : "4", "name" : "Féral"}, {"value" : "5", "name" : "Subspontané"}]``` |
| STATUT\_BIO | ```[{"value" : "0", "name" : "Inconnu"}, {"value" : "1", "name" : "Non renseigné"}, {"value" : "2", "name" : "Non Déterminé"}, {"value" : "3", "name" : "Reproduction"}, {"value" : "4", "name" : "Hibernation"}, {"value" : "5", "name" : "Estivation"}, {"value" : "9", "name" : "Pas de reproduction"}, {"value" : "13", "name" : "Végétatif"}]``` |
| DEE\_FLOU | ```[{"value" : "NON", "name" : "Non"}, {"value" : "OUI", "name" : "Oui"}, {"value" : "NSP", "name" : "NSP"}]``` |
| ETA\_BIO | ```[{"value" : "0", "name" : "NSP"}, {"value" : "1", "name" : "Non renseigné"}, {"value" : "2", "name" : "Observé vivant"}, {"value" : "3", "name" : "Trouvé mort"}]``` |
| OBJ\_DENBR | ```[{"value" : "NSP", "name" : "Ne Sait Pas"}, {"value" : "IND", "name" : "Individu"}, {"value" : "CPL", "name" : "Couple"}, {"value" : "COL", "name" : "Colonie"}, {"value" : "NID", "name" : "Nid"}, {"value" : "PON", "name" : "Ponte"}, {"value" : "HAM", "name" : "Hampe florale"}, {"value" : "TIGE", "name" : "Tige"}, {"value" : "TOUF", "name" : "Touffe"}, {"value" : "SURF", "name" : "Surface"}]``` |
| TYP\_DENBR | ```[{"value" : "Ca", "name" : "Calculé"}, {"value" : "Co", "name" : "Compté"}, {"value" : "Es", "name" : "Estimé"}, {"value" : "NSP", "name" : "Ne sait pas"}]``` |
| NAT\_OBJ\_GEO | ```[{"value" : "In", "name" : "Inventoriel"}, {"value" : "NSP", "name" : "Ne sait pas"}, {"value" : "St", "name" : "Stationnel"}]``` |
| STADE\_VIE | ```[{"value" : "0", "name" : "Inconnu"}, {"value" : "1", "name" : "Indéterminé"}, {"value" : "2", "name" : "Adulte"}, {"value" : "3", "name" : "Juvénile"}, {"value" : "4", "name" : "Immature"}, {"value" : "5", "name" : "Sub-adulte"}, {"value" : "6", "name" : "Larve"}, {"value" : "7", "name" : "Chenille"}, {"value" : "8", "name" : "Têtard"}, {"value" : "9", "name" : "Œuf"}, {"value" : "10", "name" : "Mue"}, {"value" : "11", "name" : "Exuvie"}, {"value" : "12", "name" : "Chrysalide"}, {"value" : "13", "name" : "Nymphe"}, {"value" : "14", "name" : "Pupe"}, {"value" : "15", "name" : "Imago"}, {"value" : "16", "name" : "Sub-imago"}, {"value" : "17", "name" : "Alevin"}, {"value" : "18", "name" : "Germination"}, {"value" : "19", "name" : "Fané"}, {"value" : "20", "name" : "Graine"}, {"value" : "21", "name" : "Thalle, protothalle"}, {"value" : "22", "name" : "Tubercule"}, {"value" : "23", "name" : "Bulbe"}, {"value" : "24", "name" : "Rhizome"}, {"value" : "25", "name" : "Emergent"}, {"value" : "26", "name" : "Post-Larve"}, {"value" : "27", "name" : "Fruit"}]``` |
| TYP\_GRP | ```[{"value" : "AUTR", "name" : "AUTR"}, {"value" : "CAMP", "name" : "CAMP"}, {"value" : "INVSTA", "name" : "INVSTA"}, {"value" : "LIEN", "name" : "LIEN"}, {"value" : "NSP", "name" : "NSP"}, {"value" : "OBS", "name" : "OBS"}, {"value" : "OP", "name" : "OP"}, {"value" : "PASS", "name" : "PASS"}, {"value" : "POINT", "name" : "POINT"}, {"value" : "REL", "name" : "REL"}, {"value" : "STRAT", "name" : "STRAT"}]``` |
| NIV\_PRECIS | ```[{"value" : "0", "name" : "Standard"}, {"value" : "1", "name" : "Commune"}, {"value" : "2", "name" : "Maille"}, {"value" : "3", "name" : "Département"}, {"value" : "4", "name" : "Aucune"}, {"value" : "5", "name" : "Précise"}]``` |
| SENSIBILITE | ```[{"value" : "1", "name" : "Département, maille, espace, commune, ZNIEFF"}, {"value" : "2", "name" : "Département et maille 10 x 10 km"}, {"value" : "0", "name" : "Maximale"}, {"value" : "3", "name" : "Département seulement"}, {"value" : "4", "name" : "Aucune diffusion \(cas exceptionnel\)"}]``` |
