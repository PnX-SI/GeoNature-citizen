
#Installation de nvm / npm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
#cp -r ${HOME}/.nvm /home/synthese/.nvm
#

sudo a2enmod rewrite proxy proxy_http
sudo apache2ctl restartchown -R synthese:synthese /home/synthese/.nvm

sudo apt-get install postgresql postgresql-client postgresql postgresql-postgis -y

sudo adduser postgres sudo
sudo service postgresql start
sudo -n -u postgres psql -c "CREATE ROLE $user_pg WITH PASSWORD '$user_pg_pass';"
sudo -n -u postgres psql -c "ALTER ROLE $user_pg WITH LOGIN;"
sudo -n -u postgres createdb -O $user_pg $pg_dbname -T template0 -E UTF-8

cd $HOME
if [ ! -d $HOME/taxhub ]; then
  wget https://github.com/PnX-SI/TaxHub/archive/$taxhub_version.zip
  unzip $taxhub_version.zip
  mv TaxHub-$taxhub_version/ taxhub/
  rm $taxhub_version
fi
cd $HOME/taxhub

if [ ! -f settings.ini ]; then
  cp settings.ini.sample settings.ini
fi

sed -i "s,db_host=.*$,db_host=$pg_host,g" settings.ini
sed -i "s,db_name=.*$,db_name=$pg_dbname,g" settings.ini
sed -i "s,user_pg=.*$,user_pg=$user_pg,g" settings.ini
sed -i "s,user_pg_pass=.*$,user_pg_pass=$user_pg_pass,g" settings.ini
sed -i "s,db_port=.*$,db_port=$pg_port,g" settings.ini
sed -i "s,usershub_release=.*$,usershub_release=2.1.3,g" settings.ini

sudo printf "
<Location /taxhub> \n
  ProxyPass  http://127.0.0.1:5000/ retry=0 \n
  ProxyPassReverse  http://127.0.0.1:5000/ \n
</Location> \n
\n
Alias '/static' 'HOME_PATH/taxhub/static' \n
<Directory 'HOME_PATH/taxhub/static'> \n
  AllowOverride None \n
  Order allow,deny \n
  Allow from all \n
</Directory> \n
" | sed "s,HOME_PATH,$HOME,g" | sudo tee /etc/apache2/sites-available/taxhub.conf

sudo printf '
RewriteEngine  on \n
RewriteRule    "taxhub$"  "taxhub/"  [R] \n
' | sudo tee /etc/apache2/sites-available/000-default.conf

sudo a2ensite taxhub.conf
sudo apache2ctl restart

cd $HOME/taxhub
mkdir -p var/log
mkdir -p $DIR/var/log
touch $DIR/var/log/api_geonature-errors.log
mkdir -p /tmp/taxhub/
mkdir -p /tmp/usershub/
sudo chown -R $(whoami) $HOME/taxhub
sudo chown -R $(whoami) /tmp/taxhub
sudo chown -R $(whoami) /tmp/usershub
#sed -i "s,nano.*$,#,g" install_db.sh
#sed -i "s,PnEcrins,PnX-SI,g" install_db.sh
./install_db.sh
./install_app.sh

cd $DIR
. config/settings.ini
sudo -u postgres psql $pg_dbname -c 'create extension postgis;'

echo "install municipalities"
./data/ref_geo.sh
