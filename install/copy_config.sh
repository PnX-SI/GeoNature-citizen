if [ ! -f config/default_config.toml ]; then
  echo 'Fichier de configuration API non existant, copie du template...'
  cp config/default_config.toml.template config/default_config.toml
  sed -i "s/SQLALCHEMY_DATABASE_URI = .*$/SQLALCHEMY_DATABASE_URI = \"postgresql:\/\/$user_pg:$user_pg_pass@$pg_host:$pg_port\/$pg_dbname\"/" config/default_config.toml
  sed -i "s,URL_APPLICATION = .*$,URL_APPLICATION = \"$url_application\",g" config/default_config.toml
  sed -i "s,API_ENDPOINT = .*$,API_ENDPOINT = \"$api_endpoint\",g" config/default_config.toml
  sed -i "s,API_PORT = .*$,API_PORT = \"$api_port\",g" config/default_config.toml
  sed -i "s,API_TAXHUB = .*$,API_TAXHUB = \"$api_taxhub\",g" config/default_config.toml
fi

#Création d'un fichier de configuration pour le front
if [ ! -f frontend/src/conf/app.config.ts ]; then
  echo 'Fichier de configuration frontend non existant, copie du template...'
  cp frontend/src/conf/app.config.ts.template frontend/src/conf/app.config.ts
  sed -i "s|API_ENDPOINT:.*$|API_ENDPOINT:\"$api_endpoint\",|g" frontend/src/conf/app.config.ts
  sed -i "s|API_TAXHUB:.*$|API_TAXHUB:\"$api_taxhub\",|g" frontend/src/conf/app.config.ts
  sed -i "s|URL_APPLICATION:.*$|URL_APPLICATION:\"$url_application\",|g" frontend/src/conf/app.config.ts

fi
if [ ! -f frontend/src/conf/map.config.ts ]; then
  echo 'Fichier map non existant, copie du template...'
  cp frontend/src/conf/map.config.ts.template frontend/src/conf/map.config.ts
fi

#Copie des fichiers custom
if [ ! -f frontend/src/custom/custom.css ]; then
  echo 'Fichier custom.css non existant, copie du template...'
  cp frontend/src/custom/custom.css.template frontend/src/custom/custom.css
fi
if [ ! -f frontend/src/custom/about/about.css ]; then
  echo 'Fichiers about non existant, copie du template...'
  cp frontend/src/custom/about/about.css.template frontend/src/custom/about/about.css
  cp frontend/src/custom/about/about.html.template frontend/src/custom/about/about.html
fi
if [ ! -f frontend/src/custom/footer/footer.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp frontend/src/custom/footer/footer.css.template frontend/src/custom/footer/footer.css
  cp frontend/src/custom/footer/footer.html.template frontend/src/custom/footer/footer.html
fi
if [ ! -f frontend/src/custom/home/home.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp frontend/src/custom/home/home.css.template frontend/src/custom/home/home.css
  cp frontend/src/custom/home/home.html.template frontend/src/custom/home/home.html
fi
