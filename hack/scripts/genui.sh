#!/usr/bin/env bash

version=${1}

if [ -d "web" ]; then
  pushd web || exit
  cp package.json package.json.example
  # cat package.json  | jq '.version="'${version}'"' > package.json.new
  jq '.version="'"${version}"'"' package.json > package.json.new && mv package.json.new package.json
  if [ ! -d "node_modules" ];then
    npm install
  fi
  DISABLE_ESLINT_PLUGIN='true' VITE_APP_VERSION=$version npm run build
  mv package.json.example package.json
  popd || exit
fi
