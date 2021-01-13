#!/bin/bash
. ../config/settings.ini
echo "PGPASSWORD=$user_pg_pass psql -h $pg_host -d $pg_dbname -U $user_pg -p $pg_port"
dburi='postgres'
echo "db name is $pg_dbname"
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
PGPASSWORD=$user_pg_pass psql -h $pg_host -d $pg_dbname -U $user_pg -p $pg_port -f tmp/geonature/fr_municipalities.sql
echo ""
echo "Insert data in l_areas and li_municipalities tables"
echo "--------------------"
PGPASSWORD=$user_pg_pass psql -h $pg_host -d $pg_dbname -U $user_pg -p $pg_port -f ./data/ref_geo.sql
echo ""
echo "Drop french municipalities temp table"
echo "--------------------"
PGPASSWORD=$user_pg_pass psql -h $pg_host -d $pg_dbname -U $user_pg -p $pg_port -c "DROP TABLE ref_geo.temp_fr_municipalities;"
