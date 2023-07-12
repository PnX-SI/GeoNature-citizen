echo "Creating Citizen database..."
echo "SELECT 'CREATE DATABASE $pg_dbname' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$pg_dbname')\gexec" | sudo -u postgres psql
sudo -u postgres -s psql -d $pg_dbname -c "CREATE EXTENSION IF NOT EXISTS postgis;"
