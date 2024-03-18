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

# For each TypeScript file in the base-files directory, copy it in
# (no merging, because we can't merge TypeScript files like we can with JSON).
find "$base_files_dir" -name '*.ts' | xargs -n 1 sh -ec '
  echo `basename $0`
  cp $0 `basename $0`
'
