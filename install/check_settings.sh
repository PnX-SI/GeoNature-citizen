# Script to copy the configuration
#création d'un fichier de configuration pour api/back
if [ ! -f ./config/settings.ini ]; then
  echo 'Fichier de configuration du projet non existant, copie du template...'
  cp ./config/settings.ini.template ./config/settings.ini
  echo "Fichier de config disponible : $DIR/config/settings.ini."
  echo "Merci de renseigner le fichier et de relancer la commande"
  exit 1
elif [[ $(diff -q ./config/settings.ini.template ./config/settings.ini) = "" ]] 
then
  echo "Merci de renseigner le fichier config/settings.ini et de relancer la commande"
  exit 1
fi

