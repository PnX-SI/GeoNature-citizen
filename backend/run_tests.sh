#!/bin/sh

# Heads up! Test user needs to be created by hand the first time before
# running tests. C.f. 'common.py' for SQL query to run.

if [ -z $1 ]; then
    python -m unittest -v tests/test_*
else
    python -m unittest -v $1
fi
