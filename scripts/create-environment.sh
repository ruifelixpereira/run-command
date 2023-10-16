#!/bin/bash

source ./.env

# Storage account
STORAGE_ACCOUNT="${PREFIX}runcmdsa"

# Function App
FUNC_APP="${PREFIX}-runcmd-func"

# Log Analytis workspace
LOG_ANALYTICS_WORKSPACE="${PREFIX}-runcmd-law"
LOG_ANALYTICS_TABLE_NAME="RunCmdHistory"

# Data collection endpoint
DCE_NAME="${PREFIX}-runcmd-dce"

# Data collection rule
DCR_NAME="${PREFIX}-runcmd-dcr"

#
# Create/Get a resource group.
#
#RG_ID=$(az group create --name $RESOURCE_GROUP --location $LOCATION --query id)
RG_ID=$(az group show --name $RESOURCE_GROUP --query id -o tsv)
#echo $RG_ID

#
# Create AAD application
#
# Start by registering a Microsoft Entra application to authenticate against the API.
#
APP_JSON=$(az ad sp create-for-rbac -n $APP_NAME --role "Owner" --scopes $RG_ID)
echo $APP_JSON | jq '.'

# collect the secret and appid from the output
#APP_ID=$(echo $APP_JSON | jq -r '.appId')
#APP_PWD=$(echo $APP_JSON | jq -r '.password')
APP_OBJECT_ID=$(az ad sp list --display-name $APP_NAME --query "[].{id:id}" --output tsv)
APP_ID=$(az ad sp list --display-name $APP_NAME --query "[].{appId:appId}" --output tsv)

#
# The accoun t neeed t be able to get all VMs and execute Run command in all VM in all subscriptions
#
for item in $SUBSCRIPTIONS; 
  do
    echo $item
    az role assignment create --assignee $APP_ID --role "Contributor" --scope /subscriptions/${item}
  done

#
# Create Storage account
#
STORAGE_ACCOUNT_ID=$(az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS --kind StorageV2 --https-only true --allow-blob-public-access true --min-tls-version TLS1_2 --access-tier Hot --default-action Deny --query id -o tsv)
#STORAGE_ACCOUNT_ID=$(az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query id -o tsv)
#echo $STORAGE_ACCOUNT_ID

# Assign Storage Blob Data Owner role to AAD application
az role assignment create --assignee $APP_ID --role "Storage Blob Data Owner" --scope $STORAGE_ACCOUNT_ID
az role assignment create --assignee $APP_ID --role "Storage Queue Data Contributor" --scope $STORAGE_ACCOUNT_ID

#
# Upload configuration
#
az storage container create -n runcmd-config --account-name $STORAGE_ACCOUNT
az storage blob upload -f ../config/runcmd-config.json -c runcmd-config -n runcmd-config.json --account-name $STORAGE_ACCOUNT

#
# Create Function App
#
az storage account update --name $STORAGE_ACCOUNT --default-action Allow 
az functionapp create --consumption-plan-location $LOCATION --name $FUNC_APP --os-type Linux --resource-group $RESOURCE_GROUP --runtime node --functions-version 4 --runtime-version 18 --storage-account $STORAGE_ACCOUNT
# --assign-identity
az storage account update --name $STORAGE_ACCOUNT --default-action Deny

#az storage account update --name $STORAGE_ACCOUNT --public-network-access Enabled

#
# Create Log Analytics Workspace
#
LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace create --resource-group $RESOURCE_GROUP --workspace-name $LOG_ANALYTICS_WORKSPACE --location $LOCATION --query id -o tsv)
#LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace show --resource-group $RESOURCE_GROUP --workspace-name $LOG_ANALYTICS_WORKSPACE --query id -o tsv)
#echo $LOG_ANALYTICS_WORKSPACE_ID

#
# Create Log Analytics ingestion: data collection endpoint
#
# A DCE is required to accept the data being sent to Azure Monitor.
# After you configure the DCE and link it to a DCR, you can send data over HTTP from your application.
#
DCE_ID=$(az deployment group create --resource-group $RESOURCE_GROUP --template-file ./dce.json --parameters dataCollectionEndpointName=$DCE_NAME location=$LOCATION --query properties.outputs.dataCollectionEndpointId.value -o tsv)
#echo $DCE_ID

# Create new table in Log Analytics workspace
az monitor log-analytics workspace table create --resource-group $RESOURCE_GROUP --workspace-name $LOG_ANALYTICS_WORKSPACE -n ${LOG_ANALYTICS_TABLE_NAME}_CL --retention-time 45 --columns \
   commandId=string \
   commandName=string \
   location=string \
   vmName=string \
   resourceGroup=string \
   subscriptionId=string \
   source=string \
   executionState=string \
   executionMessage=string \
   exitCode=string \
   stdOutput=string \
   stdError=string \
   startTime=datetime \
   endTime=datetime \
   TimeGenerated=datetime

#
# Create Log Analytics ingestion: data collection rule
#
# The DCR defines how the data will be handled once it's received. This includes:
#    - Schema of data that's being sent to the endpoint
#    - Transformation that will be applied to the data before it's sent to the workspace
#    - Destination workspace and table the transformed data will be sent to
#
DCR_ID=$(az deployment group create --resource-group $RESOURCE_GROUP --template-file ./dcr.json --parameters dataCollectionRuleName=$DCR_NAME location=$LOCATION workspaceResourceId=$LOG_ANALYTICS_WORKSPACE_ID endpointResourceId=$DCE_ID workspaceTableName=$LOG_ANALYTICS_TABLE_NAME --query properties.outputs.dataCollectionRuleId.value -o tsv)
#echo $DCR_ID

#
# Assign permissions to a DCR
#
# The application needs to be given permission to it.
# Permission will allow any application using the correct application ID and application key to send data to the new DCE and DCR.
#
az role assignment create --assignee $APP_ID --role "Monitoring Metrics Publisher" --scope $DCR_ID
