#!/bin/bash

slugify () {
  echo "$1" | iconv -c -t ascii//TRANSLIT | sed -E 's/[~^]+//g' | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr A-Z a-z
}

convert () {
  DIR=$1

  for file in $(ls $DIR | grep xml); do
    INPUT="$DIR/$file"
    echo "Processing $INPUT"

    name=$(cat $DIR/$file | grep '<head>' | sed 's/head//g' | sed 's/[</>]//g')
    author=$(cat $DIR/$file | grep '<docauthor>' | sed 's/docauthor//g' | sed 's/[</>]//g')

    title="$name - $author"
    slug=$(slugify "$title")

    node parse-html-table.js $INPUT > ./html/$slug.html
  done
}

convert ./source/PCT
convert ./source/SSSC