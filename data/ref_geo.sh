#!/bin/bash
echo "What is the db name?"
read db_name
echo "db name is $db_name"
echo "--------------------"
echo "Insert default French municipalities (IGN admin-express)"
echo "--------------------"
echo ""
if [ ! -f 'tmp/geonature/communes_fr_admin_express_2019-01.zip' ]; then
    wget --cache=off http://geonature.fr/data/ign/communes_fr_admin_express_2019-01.zip -P tmp/geonature
else
    echo "tmp/geonature/communes_fr_admin_express_2019-01.zip already exist"
fi
unzip tmp/geonature/communes_fr_admin_express_2019-01.zip -d tmp/geonature
sudo -n -u postgres -s psql -d $db_name -f tmp/geonature/fr_municipalities.sql
echo ""
echo "Insert data in l_areas and li_municipalities tables"
echo "--------------------"
sudo -n -u postgres -s psql -d $db_name -f ./ref_geo.sql
echo ""
echo "Drop french municipalities temp table"
echo "--------------------"
#sudo -n -u postgres -s psql -d $db_name -c "DROP TABLE ref_geo.temp_fr_municipalities;"
