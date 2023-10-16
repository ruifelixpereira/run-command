#!/bin/bash

currentDir=$(pwd)
cd ..
npm run prestart

REVISION=$(jq -r .version package.json)

rm -rf packages
mkdir packages

zip -r ./packages/runcmd-func-app-rev${REVISION}.zip . -x ./docs/**\* ./src/**\* ./scripts/**\* ./.git/**\* ./.vscode/**\* ./.github/**\* ./packages/**\* MYLOG.md local.settings.json

cd $currentDir
