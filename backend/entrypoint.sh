#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

flask db upgrade

exec "$@"