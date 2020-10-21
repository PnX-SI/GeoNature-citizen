#Mise à jour du git
git pull

. config/settings.ini
npm install
#Transpilation du frontend
if [ $server_side ]; then
  echo "Build server side project"
  npm run build:i18n-ssr
  echo "Reloading Front server ..."
  sudo -s supervisorctl reload geonature
else
  echo "Build initial du projet"
  npm run build
fi

#Reload Supervisor pour l'api
echo "Reloading Api ..."
sudo -s supervisorctl reload api_geonature