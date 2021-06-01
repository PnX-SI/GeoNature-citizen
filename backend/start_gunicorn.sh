#!/bin/bash


echo "------------------------------------------------"
echo "GeoNature-citizen backend server is starting ..."
echo "------------------------------------------------"


FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"

. $APP_DIR/config/settings.ini

echo "info: Starting $app_name"
echo "info: FLASKDIR: $FLASKDIR"
echo "info: APP_DIR: $APP_DIR"

# activate the virtualenv
venv_dir=${venv_dir:-".venv"}
source $FLASKDIR/$venv_dir/bin/activate

cd $FLASKDIR

# Start your gunicorn
LOG_DIR="$APP_DIR/var/log"
echo "LOG_DIR: $LOG_DIR"
if [[ ! -e $LOG_DIR ]]; then
    mkdir -p $LOG_DIR
elif [[ ! -d $LOG_DIR ]]; then
    echo "LOG_DIR already exists but is not a directory" 1>&2
fi
export PYTHONPATH=`pwd`/${venv_dir}
#echo $PYTHONPATH
echo "info:  Starting gunicorn"
echo "--"
exec  gunicorn -w ${gun_num_workers:-2} --error-log $APP_DIR/var/log/gunicorn_gncitizen_errors.log --pid="${app_name:-"gncitizen"}.pid" -b ${gun_host:-"localhost"}:${gun_port:-5002} --timeout=${gun_timeout:-30} --reload -n "geonature-citizen" wsgi:app
