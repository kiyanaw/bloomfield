#!/bin/bash

combine () {
  DIR=$1

  final="$DIR/index.html"
  echo '<html>' > $final
  echo '<head><meta charset="UTF-8"></head><body>' >> $final

  for file in $(ls $DIR | grep part); do
    INPUT="$DIR/$file"
    echo "Processing $INPUT"
    cat $INPUT >> $final
  done

  echo "</body></html>" >> $final
  echo "Done."
}

# combine ./PCT
combine ./SSSC