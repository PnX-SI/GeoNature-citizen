#!/bin/bash

FLASKDIR=$(readlink -e "${0%/*}")
APP_DIR="$(dirname "$FLASKDIR")"
venv_dir="venv"

echo "Starting $app_name"
echo "$FLASKDIR"
echo $APP_DIR

# activate the virtualenv
source $FLASKDIR/$venv_dir/bin/activate

cd $FLASKDIR

# Start your gunicorn
exec mkdir -p $APP_DIR/var/log/
exec gunicorn --error-log $APP_DIR/var/log/gn_errors.log --pid="geonature-citizen.pid" -b "0.0.0.0:5001"  -n "geonature-citizen" wsgi:app
