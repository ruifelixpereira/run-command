import { app, InvocationContext } from "@azure/functions";

import { runCmd } from "../shared/control/vm.manager";
import { VmInfo } from "../shared/common/interfaces";
import { AppError, _getString } from "../shared/common/apperror";

export async function runcmd(queueItem: VmInfo, context: InvocationContext): Promise<void> {
    
    try {
        //context.log('runcmd function processed queue work item', queueItem);
        const cmdResults = await runCmd(queueItem);

    } catch (error) {
        const message = `Unable to run command on vm '${queueItem.name}' with error: ${_getString(error)}`;
        context.log(message);
        throw new AppError(message);
    }

}

app.storageQueue('runcmd', {
    queueName: 'vms',
    connection: 'CONTROL_ACCOUNT_CONN_STRING',
    handler: runcmd
});
