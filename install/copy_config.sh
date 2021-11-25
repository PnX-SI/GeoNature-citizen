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
cd frontend
if [ ! -f src/conf/app.config.ts ]; then
  echo 'Fichier de configuration frontend non existant, copie du template...'
  cp src/conf/app.config.ts.template src/conf/app.config.ts
  sed -i "s|API_ENDPOINT:.*$|API_ENDPOINT:\"$api_endpoint\",|g" src/conf/app.config.ts
  sed -i "s|API_TAXHUB:.*$|API_TAXHUB:\"$api_taxhub\",|g" src/conf/app.config.ts
  sed -i "s|URL_APPLICATION:.*$|URL_APPLICATION:\"$url_application\",|g" src/conf/app.config.ts

fi
if [ ! -f src/conf/map.config.ts ]; then
  echo 'Fichier map non existant, copie du template...'
  cp src/conf/map.config.ts.template src/conf/map.config.ts
fi

#Copie des fichiers custom
if [ ! -f src/custom/custom.css ]; then
  echo 'Fichier custom.css non existant, copie du template...'
  cp src/custom/custom.css.template src/custom/custom.css
fi
if [ ! -f src/custom/about/about.css ]; then
  echo 'Fichiers about non existant, copie du template...'
  cp src/custom/about/about.css.template src/custom/about/about.css
  cp src/custom/about/about.html.template src/custom/about/about.html
fi
if [ ! -f src/custom/footer/footer.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp src/custom/footer/footer.css.template src/custom/footer/footer.css
  cp src/custom/footer/footer.html.template src/custom/footer/footer.html
fi
if [ ! -f src/custom/home/home.css ]; then
  echo 'Fichiers footer non existant, copie du template...'
  cp src/custom/home/home.css.template src/custom/home/home.css
  cp src/custom/home/home.html.template src/custom/home/home.html
fi
