#!/bin/bash

currentDir=$(pwd)
cd ..
npm run prestart

REVISION=$(jq -r .version package.json)

scripts/prepare-package.sh
zip -r ./packages/runcmd-func-app-rev${REVISION}.zip . -x ./docs/**\* ./src/**\* ./scripts/**\* ./.git/**\* ./.vscode/**\* ./packages/**\* MYLOG.md local.settings.json

cd $currentDir
