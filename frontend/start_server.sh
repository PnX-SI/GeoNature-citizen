#!/bin/bash

echo "-------------------------------------------------"
echo "GeoNature-citizen frontend server is starting ..."
echo "-------------------------------------------------"

cd  $(dirname $0)
. ~/.nvm/nvm.sh
nvm use
npm run serve:ssr