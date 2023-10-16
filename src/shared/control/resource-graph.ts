// Azure authentication library
import { DefaultAzureCredential } from "@azure/identity";

// Resource Graph
import { ResourceGraphClient } from "@azure/arm-resourcegraph";

import { VmInfo } from "../common/interfaces";


export async function getAllVMs(): Promise<Array<VmInfo>> {

    // Azure SDK clients accept the credential as a parameter
    const credential = new DefaultAzureCredential();
    
    const clientGraph = new ResourceGraphClient(credential);

    const result = await clientGraph.resources(
        {
            query: `Resources
            | where type == 'microsoft.compute/virtualmachines'
            | project subscriptionId, resourceGroup, name, location, OS = tostring(properties.storageProfile.osDisk.osType), PowerState = tostring(properties.extended.instanceView.powerState.code)
            | order by name asc`
        },
        { resultFormat: "table" }
    );

    return result.data;
};
