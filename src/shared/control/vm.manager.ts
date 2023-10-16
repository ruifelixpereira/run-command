// Azure authentication library
import { DefaultAzureCredential } from "@azure/identity";
import { ComputeManagementClient, VirtualMachineRunCommand } from "@azure/arm-compute";

import { queueConstants, blobConstants, logIngestionConstants } from '../common/constants';
import { AppError, _getString } from "../common/apperror";
import { VmInfo, RunCommandOutput, RunCommandResult } from "../common/interfaces";
import { QueueManager } from "./queue.manager";
import { BlobManager } from "./blob.manager";
import { LogIngestionManager } from "./logingestion.manager";
import { getAllVMs } from "./resource-graph";


export async function discoverVMs(): Promise<any[]> {

    // 1. Get All VMs
    const allVMs = await getAllVMs();

    //
    // 2. Send VMs: one event per VM to queue
    //
    const credential = new DefaultAzureCredential();
    const queueManager = new QueueManager(process.env.CONTROL_ACCOUNT as string, credential);

    let allPromises = [];
    allVMs.forEach(vm => {
        // Trigger new VM
        let newPromise = queueManager.sendTriggerToQueue(queueConstants.VMS_QUEUE_NAME, JSON.stringify(vm));
        allPromises.push(newPromise);
    });

    return Promise.all(allPromises);

}


export async function runCmd(vmMsg: VmInfo): Promise<RunCommandOutput> {

    // 1. Run command on VM
    //console.log(JSON.stringify(vmMsg));

    let runCommandOut = "";
    if (vmMsg.PowerState === "PowerState/running") {

        const credential = new DefaultAzureCredential();

        // Load run cmd config
        const blobManager = new BlobManager(process.env.CONTROL_ACCOUNT as string, credential);
        const runCmdConfig = await blobManager.loadConfigFromBlob(blobConstants.CONFIG_CONTAINER, blobConstants.CONFIG_BLOB);

        // Get cmd for OS
        const cmd = runCmdConfig.find(cmd => cmd.os === vmMsg.OS);

        // Run command on VM
        const computeClient = new ComputeManagementClient(credential, vmMsg.subscriptionId);

        try {
            const cmdToExecute: VirtualMachineRunCommand = {
                asyncExecution: true,
                location: vmMsg.location,
                source: {
                    script: cmd?.cmd
                },
                //outputBlobUri: "https://runcmd971f.blob.core.windows.net/script-output/MyScriptoutput.txt",
                //outputBlobManagedIdentity: {
                //    clientId: "b42aea65-9f13-4bc5-852c-00fb36e88d6a"
                //}
            }

            const runCommandName = `cmd${Date.now()}`;
            const runCommandResult = await computeClient.virtualMachineRunCommands.beginCreateOrUpdate(
                vmMsg.resourceGroup,
                vmMsg.name,
                runCommandName,
                cmdToExecute
            );
            //console.log(runCommandResult);


            // 2. Send command results to queue
            const queueManager = new QueueManager(process.env.CONTROL_ACCOUNT as string, credential);

            const runResult: RunCommandResult = {
                vmName: vmMsg.name,
                resourceGroup: vmMsg.resourceGroup,
                subscriptionId: vmMsg.subscriptionId,
                comandName: runCommandName,
                location: cmdToExecute.location
            };
            const msg = JSON.stringify(runResult);
            await queueManager.sendTriggerToQueue(queueConstants.RUNCMD_RESULTS_QUEUE_NAME, msg);

            runCommandOut = msg;
            //console.log(runCommandId);

        } catch (error) {
            const message = `Unable to run command on vm '${vmMsg.resourceGroup}/${vmMsg.name}' with error: ${_getString(error)}`;
            throw new AppError(message);
        }
    }
    else {
        runCommandOut = `VM ${vmMsg.name} is not running`;
    }

    return {
        runCommandOutput: runCommandOut
    }
};


export async function checkResults(cmdResult: RunCommandResult): Promise<RunCommandOutput> {

    // 1. Check Run command results
    console.log(cmdResult);

    const credential = new DefaultAzureCredential();
    const computeClient = new ComputeManagementClient(credential, cmdResult.subscriptionId);

    const runCmdResult = await computeClient.virtualMachineRunCommands.getByVirtualMachine(cmdResult.resourceGroup, cmdResult.vmName, cmdResult.comandName, { expand: "instanceView" });
    console.log(runCmdResult);

    switch (runCmdResult.instanceView?.executionState) {
        case "Pending":  // Execution still running
        case "Running":
            console.log(runCmdResult.instanceView?.executionState + " with exit code " + runCmdResult.instanceView?.exitCode);

            // 2. Results are not yet ready

            // 2.1 Wait for 10 seconds
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await delay(process.env.PENDING_WAIT_MILLISECONDS || 10000);

            // 2.2  Send back to the queue to check again later
            const queueManager = new QueueManager(process.env.CONTROL_ACCOUNT as string, credential);
            await queueManager.sendTriggerToQueue(queueConstants.RUNCMD_RESULTS_QUEUE_NAME, JSON.stringify(cmdResult));

            break;
        case "Succeeded":  // Execution terminated
        case "Failed":
        default:
            console.log(runCmdResult.instanceView?.executionState + " with exit code " + runCmdResult.instanceView?.exitCode);

            // 3. Send results to log ingestion
            const logIngestionManager = new LogIngestionManager(
                process.env.LOG_INGESTION_ENDPOINT as string,
                process.env.LOG_INGESTION_RULE_IMMUTABLE_ID as string,
                logIngestionConstants.STREAM_NAME,
                credential);
            
            await logIngestionManager.sendLogs([
                {
                    Time: (new Date()).toISOString(),
                    commandId: runCmdResult.id,
                    commandName: runCmdResult.name,
                    location: runCmdResult.location,
                    vmName: cmdResult.vmName,
                    resourceGroup: cmdResult.resourceGroup,
                    subscriptionId: cmdResult.subscriptionId,
                    source: runCmdResult.source,
                    InstanceView: runCmdResult.instanceView
                }
            ]);

            // 4. Delete run command
            //const result = await computeClient.virtualMachineRunCommands.beginDeleteAndWait(cmdResult.resourceGroup, cmdResult.vmName, cmdResult.comandName);
            break;
    }

    return {
        runCommandOutput: "" + runCmdResult
    }
};
