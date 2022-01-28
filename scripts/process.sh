#!/bin/bash

convert () {
  DIR=$1

  for file in $(ls $DIR | grep xml); do
    INPUT="$DIR/$file"
    OUTPUT=$(echo $INPUT | sed -e 's/xml/html.part/')
    echo "Processing $INPUT"
    # curl -s -F "data=@$INPUT" https://www.oxygenxml.com/xml-json-converter/rest/convert/xmltojson > $OUTPUT
    node parse.js $INPUT > $OUTPUT
  done
}

# convert ./PCT
convert ./SSSC