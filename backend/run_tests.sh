#!/bin/sh

if [ -z $1 ]; then
    python -m unittest -v tests/test_*
else
    python -m unittest -v $1
fi
