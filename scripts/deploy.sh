#!/bin/bash

source ./.env

# Function App
FUNC_APP="${PREFIX}-runcmd-func"
REVISION=$(jq -r .version ../package.json)

# Prepare package
./prepare-package.sh

# Deploy
az functionapp deployment source config-zip -g $RESOURCE_GROUP -n $FUNC_APP --src ../packages/runcmd-func-app-rev${REVISION}.zip
