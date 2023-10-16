#!/bin/bash

currentDir=$(pwd)

cd ..
REVISION=$(jq -r .version package.json)

git tag -a v${REVISION} -m "Tagging version ${REVISION}"

git push origin --tags

cd $currentDir
