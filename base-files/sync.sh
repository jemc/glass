#!/usr/bin/env sh

base_files_dir=`dirname "$0"`

# For each JSON file in the base-files directory, merge it into the same-named
# file in the current directory working directory, creating it if needed.
find "$base_files_dir" -name '*.json' | xargs -n 1 sh -ec '
  echo `basename $0`
  touch `basename $0`
  jq -s ".[0] * (.[1] // {})" `basename $0` $0 > `basename $0`.tmp
  mv `basename $0`.tmp `basename $0`
'
