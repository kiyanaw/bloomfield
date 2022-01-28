#!/bin/bash

convert () {
  DIR=$1

  for file in $(ls $DIR | grep xml); do
    INPUT="$DIR/$file"
    OUTPUT=$(echo $INPUT | sed -e 's/xml/html/')
    echo "Processing $INPUT"

    filename=$(echo $OUTPUT | cut -d'/' -f3)
    node parse-html-table.js $INPUT > ./html/$filename
  done
}

convert ./PCT
convert ./SSSC