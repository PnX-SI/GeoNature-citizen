====================================
Configuration des badges
====================================

**Types de récompense:**

- Seniority: ancienneté d'inscription sur la plateforme
- all_attendance: participation sur la plateforme( faire des observations)
- Program_Attendance: participation par programme
- recognition:  identification d'espèces

 
**niveaux de récompense:**

 - min_obs : nombre d'observations minimum pour obtenir le badge
 - min_date : date minimum pour obtenir le badge

**Configuration  de récompense:**

 - type : type de récompense (exemple Seniority)
 - reward_label : label de la récompense ( a afficher du coté forntend)
 - id_program : identifant du programme ( 0 pour les récompenses géneral)
 - badges : tableau des badges par type de récompense 

 Pour les récompenses de type recognition il faut renseigner soit la classe ou la famille du taxref 

 
:notes:
 Pour plus d'informations voir : https://github.com/PnX-SI/GeoNature-citizen/issues/7
 
 
 
