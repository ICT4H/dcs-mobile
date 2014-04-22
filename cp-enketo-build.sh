#!/bin/bash

PWD=`pwd`
ENKETO="${PWD}/enketo-core/build/"
DEST_BASE="${PWD}/dcs-app/www/"
JS="js/enketo.min.js"

(cd $ENKETO &&
cp $JS $DEST_BASE$JS &&
cp css/* "${DEST_BASE}css/" &&
cp fonts/* "${DEST_BASE}fonts/")
echo "copied artifacts to $DEST_BASE"
