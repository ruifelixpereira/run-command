// Azure authentication library
import { TokenCredential } from "@azure/identity";

// Storage queues
import { QueueServiceClient, QueueClient } from "@azure/storage-queue"

import { AppError, _getString } from "../common/apperror";


export class QueueManager {

    private queueServiceClient: QueueServiceClient;
    private queueClients: Map<string, QueueClient>;

    constructor(account: string, credential: TokenCredential) {
        this.queueServiceClient = new QueueServiceClient(
            `https://${account}.queue.core.windows.net`,
            credential
        );
        this.queueClients = new Map<string, QueueClient>();
    }

    public async sendTriggerToQueue(queueName: string, message: string): Promise<string> {

        try {
            const queueClient = await this.getQueueClient(queueName);
            const msg = Buffer.from(message, 'utf8').toString('base64');
            const enqueueQueueResponse = await queueClient.sendMessage(msg);
            
            //console.log(`Sent message successfully, service assigned message Id: ${enqueueQueueResponse.messageId}, service assigned request Id: ${enqueueQueueResponse.requestId}`);
            return `Message id ${enqueueQueueResponse.messageId} was sent to queue`;

        } catch (error) {
            const message = `Unable to send message to queue '${queueName}' with error: ${_getString(error)}`;
            throw new AppError(message);
        }

    }

    private async getQueueClient(queueName: string): Promise<QueueClient> {

        if (this.queueClients.has(queueName)) {
            return this.queueClients.get(queueName);
        }
        else {
            const queueClient = this.queueServiceClient.getQueueClient(queueName);
           
            // Ensure the queue is created
            await queueClient.create();

            this.queueClients.set(queueName, queueClient);
            return queueClient;
        }
    }

    /*
    public getQueueServiceClient(): QueueServiceClient {
        return this.queueServiceClient;
    }
    */
}