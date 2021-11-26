echo "Creating Citizen database..."
sudo -u postgres -s createdb -O $user_pg $pg_dbname -T template0 -E UTF-8 -l $my_local
sudo -u postgres -s psql -d $pg_dbname -c "CREATE EXTENSION IF NOT EXISTS postgis;"
