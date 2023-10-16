import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { discoverVMs } from "../shared/control/vm.manager";

export async function discover(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    const res = await discoverVMs();

    const msg = `Discovered ${res.length} VMs for running commands.`
    context.log(msg);
    return { body: msg };
};

app.http('discover', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: discover
});
