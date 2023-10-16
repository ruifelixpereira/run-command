// Azure authentication library
import { TokenCredential } from "@azure/identity";

// Log ingestion
import { LogsIngestionClient, isAggregateLogsUploadError } from "@azure/monitor-ingestion";


import { AppError, _getString } from "../common/apperror";


export class LogIngestionManager {

    private logIngestionClient: LogsIngestionClient;
    private dataCollectionRuleId: string;
    private streamName: string;

    constructor(logsIngestionEndpoint: string, dataCollectionRuleId: string, streamName: string, credential: TokenCredential) {
        this.logIngestionClient = new LogsIngestionClient(logsIngestionEndpoint, credential);
        this.dataCollectionRuleId = dataCollectionRuleId;
        this.streamName = streamName;
    }

    public async sendLogs(logs: Record<string, unknown>[]): Promise<string> {

        try {
            await this.logIngestionClient.upload(this.dataCollectionRuleId, this.streamName, logs);
            return `Logs sent successfully`;

        } catch (error) {
            const aggregateErrors = isAggregateLogsUploadError(error) ? error.errors : [];
            if (aggregateErrors.length > 0) {
                console.log("Some logs have failed to complete ingestion");
                for (const error of aggregateErrors) {
                    console.log(`Error - ${JSON.stringify(error.cause)}`);
                    console.log(`Log - ${JSON.stringify(error.failedLogs)}`);
                }
            } else {
                console.log(error);
            }

            const message = `Unable to send logs to stream '${this.streamName}' with error: ${_getString(error)}`;
            throw new AppError(message);
        }

    }

}