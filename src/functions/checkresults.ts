import { app, InvocationContext } from "@azure/functions";

import { checkResults } from "../shared/control/vm.manager";
import { RunCommandResult } from "../shared/common/interfaces";
import { AppError, _getString } from "../shared/common/apperror";

export async function checkresults(queueItem: RunCommandResult, context: InvocationContext): Promise<void> {
    
    try {
        //context.log('runcmd function processed queue work item', queueItem);
        const cmdResults = await checkResults(queueItem);

    } catch (error) {
        const message = `Unable to check results on '${queueItem}' with error: ${_getString(error)}`;
        context.log(message);
        throw new AppError(message);
    }

}

app.storageQueue('checkresults', {
    queueName: 'results',
    connection: 'CONTROL_ACCOUNT_CONN_STRING',
    handler: checkresults
});
