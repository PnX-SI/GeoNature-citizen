#!/bin/bash

echo "MMMMMmhyo++++++osydNMMMMMMMMMMMMNmhyso+++osshdNMMMMMNoooooMMMMMMMmhso++++oosydmM"
echo "MMNho++++++oo+++++++smMMMMMMMMms+++++++++++++++smMMMN+++++MMMMMdo++++++++++++++h"
echo "Mdo++++sdNMMMMNmho++++yNMMMMNs++++oshmmmmmdyo+odMMMMN+++++MMMMm+++++hmNNmmdysoyM"
echo "d++++omMMMMMMMMMMMh++++sMMMNo++++yNMMMMMMMMMMmNMMMMMN+++++MMMMd+++++hNNMMMMMMNMM"
echo "o+oooNMMMMmdddmMMMMyoooodMMhoooosMMMMMMMMMMMMMMMMMMMNoooooMMMMMyoooooossyhdmNMMM"
echo "oooooMMMMMy+///sdMMhoooodMMyoooohMMMMMMMMMMMyyyymMMMNoooooMMMMMMmhysoooooooosydM"
echo "yoooodMMMMms+:.-:+dmyooomMMhoooosNMMMMMMMMMMoooodMMMNoooooMMMMMMMMMNNNmdhsoooooh"
echo "NsoooohNMMMMmo-oo++ohdydMMMMyoooosmMMMMMMMMMoooodMMMNoooooMMMMmydNMMMMMMMMhooooo"
echo "MNhsooosydmmmmdhsoo++ohNMMMMMhsssssshddmddhyssssdMMMNsssssMMMmsssssyhdmmdhsssssh"
echo "MMMNdyssssssssshmdssoo+odMMMMMNdysssssssssssssshNMMMNsssssMMMNdysssssssssssssydM"
echo "MMMMMMNmddhhhhhdmMMdyssohMMMMMMMMNmdhhhhhhddmNMMMMMMMhhhhhMMMMMMMNmddhhhhhdmNMMM"
echo ""


. ../../config/settings.ini

my_url="${my_url//\//\\/}"

FILE=citizenOnQgis-admin.qgs

if test -f "$FILE"; then
    echo "Suppression du $FILE déjà présent"
    rm citizenOnQgis-admin.qgs
fi


cp citizenOnQgis-admin.qgs.template citizenOnQgis-admin.qgs
echo ""
echo "Copie du projet depuis le template"

sed -i "s/citizenDbHost/$pg_host/g" $FILE
sed -i "s/citizenDbPort/$pg_port/g" $FILE
sed -i "s/citizenDbName/$pg_dbname/g" $FILE
sed -i "s/citizenDbUser/$user_pg/g" $FILE
sed -i "s/citizenDbPwd/$user_pg_pass/g" $FILE
sed -i "s/citizenMyUrl/$my_url/g" $FILE

echo ""
echo "Fichier $FILE prêt"
