#!/bin/bash


echo "------------------------------------------------"
echo "GeoNature-citizen backend server is starting ..."
echo "------------------------------------------------"


FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="venv"

echo "Starting $app_name"
echo "FLASKDIR: $FLASKDIR"
echo "APP_DIR: $APP_DIR"

# activate the virtualenv
source $FLASKDIR/$venv_dir/bin/activate
echo "VENV: $FLASKDIR/$venv_dir/bin/activate"

cd $FLASKDIR

echo $(pip freeze)

# Start your gunicorn
LOG_DIR="$APP_DIR/var/log"
echo "LOG_DIR: $LOG_DIR"
if [[ ! -e $LOG_DIR ]]; then
    mkdir -p $LOG_DIR
elif [[ ! -d $LOG_DIR ]]; then
    echo "LOG_DIR already exists but is not a directory" 1>&2
fi
export PYTHONPATH=`pwd`/venv
#echo $PYTHONPATH
echo "Starting gunicorn"
exec  gunicorn -w 4 --pid="geonature-citizen.pid" -b :5002 --reload -n "geonature-citizen" wsgi:app
