
export interface VmInfo {
    name: string;
    subscriptionId: string;
    resourceGroup: string;
    location: string;
    OS: string;
    PowerState: string;
}


export interface RunCommandOutput {
    runCommandOutput: string;
}


export interface RunCommandResult {
    vmName: string;
    resourceGroup: string;
    subscriptionId: string;
    comandName: string;
    location: string;
}


export interface RunCommandConfig {
    os: string;
    cmd: string;
}

