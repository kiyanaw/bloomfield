#!/bin/bash

slugify () {
  echo "$1" | iconv -c -t ascii//TRANSLIT | sed -E 's/[~^]+//g' | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr A-Z a-z
}

convert () {
  DIR=$1

  for file in $(ls $DIR | grep xml); do
    name=$(cat $DIR/$file | grep '<head>' | sed 's/head//g' | sed 's/[</>]//g')
    author=$(cat $DIR/$file | grep '<docauthor>' | sed 's/docauthor//g' | sed 's/[</>]//g')

    title="$name - $author"
    slug=$(slugify "$title")

    echo "<li><a href='/$slug.html'>$name - $author</a></li>"

  done
}



pct=$(convert ./source/PCT)
sssc=$(convert ./source/SSSC)

table="<table><tr><td>$pct</td><td>$sssc</td></tr></table>"

footer="<h3>Acknowledgements</h3><p>Bloomfield collected these texts in southern Saskatchewan in the 1920s and published them into two works: Sacred Stories of the Sweetgrass Cree and Plains Cree Texts. We acknowledge the work of the various scholars who have helped bring these into a digital format so they could be shared with you now. </p>"

body="<h2>Bloomfield's texts</h2>$table<footer></footer>"

template=$(cat template.html)

echo "${template//\{\{ body \}\}/$body}" > ./html/index.html