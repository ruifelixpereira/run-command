/*
Copyright (c) Microsoft Corporation.
Licensed under the MIT license.

ModuleName: logger.ts
Purpose: System logger and ILogger
Contains: 
- ILogger
- SystemLogger

ChangeHistory:
Changed By          Changed On          Comments
----------          ----------          ---------



Author: Andrew Richardson (arnicha)
Date: 29 April 2021
*/
export { SystemLogger, ILogger };

interface ILogger {
    info: (message: string) => string;
    warn: (message: string) => string;
    error: (message: any) => any;
    debug: (message: string) => string;
}

class SystemLogger {
    private static logger: ILogger | undefined = undefined;

    static setLogger(logger: ILogger | undefined): void {
        SystemLogger.logger = logger;
    }

    static info(message: string): string {
        SystemLogger.logger?.info(message);
        return message;
    }

    static warn(message: string): string {
        SystemLogger.logger?.warn(message);
        return message;
    }

    static error(message: string): string {
        SystemLogger.logger?.error(message);
        return message;
    }

    static debug(message: string): string {
        SystemLogger.logger?.debug(message);
        return message;
    }
}

const logPrefix = 'LanguageWorkerConsoleLog';

export function systemLog(message?: any, ...optionalParams: any[]) {
    console.log(logPrefix + removeNewLines(message), ...optionalParams);
}

export function systemWarn(message?: any, ...optionalParams: any[]) {
    console.warn(logPrefix + '[warn] ' + removeNewLines(message), ...optionalParams);
}

export function systemError(message?: any, ...optionalParams: any[]) {
    console.error(logPrefix + '[error] ' + removeNewLines(message), ...optionalParams);
}

function removeNewLines(message?: any): string {
    if (message && typeof message === 'string') {
        message = message.replace(/(\r\n|\n|\r)/gm, ' ');
    }
    return message;
}
