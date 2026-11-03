#!/bin/sh
set -eu

mkdir -p dist

rsync -a --delete \
  --exclude='.git/' \
  --exclude='dist/' \
  --exclude='logs/' \
  --exclude='video/' \
  --exclude='.DS_Store' \
  --exclude='*.mp4' \
  --exclude='*.m4v' \
  --exclude='*.zip' \
  --exclude='node_modules/' \
  --exclude='wrangler.jsonc' \
  --exclude='build.sh' \
  ./ dist/
