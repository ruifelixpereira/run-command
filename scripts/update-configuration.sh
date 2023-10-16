#!/bin/bash

source ./.env

# Storage account
STORAGE_ACCOUNT="${PREFIX}runcmdsa"

#
# Upload configuration
#
az storage container create -n runcmd-config --account-name $STORAGE_ACCOUNT
az storage blob upload -f ../config/runcmd-config.json -c runcmd-config -n runcmd-config.json --account-name $STORAGE_ACCOUNT --overwrite

