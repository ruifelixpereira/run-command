// Azure authentication library
import { TokenCredential } from "@azure/identity";

// Storage queues
import { BlobServiceClient } from "@azure/storage-blob"
import { RunCommandConfig } from "../common/interfaces";
import { AppError, _getString } from "../common/apperror";


export class BlobManager {

    private blobServiceClient : BlobServiceClient;

    constructor(account: string, credential: TokenCredential) {
        this.blobServiceClient = new BlobServiceClient(
            `https://${account}.blob.core.windows.net`,
            credential
        );
        //this.containerClients = new Map<string, ContainerClient>();
    }

    public async loadConfigFromBlob(containerName: string, blobName: string): Promise<Array<RunCommandConfig>> {

        try {
            // create container client
            const containerClient = await this.blobServiceClient.getContainerClient(containerName);

            // create blob client
            const blobClient = await containerClient.getBlockBlobClient(blobName);

            // download config blob
            const configBuffer = await blobClient.downloadToBuffer();

            //console.log(`${containerName}/${blobName} blob downloaded ${configBuffer}`);
            
            /*
            // download file
            const downloadResult = await blobClient.downloadToFile(fileName);

            if (downloadResult.errorCode) throw Error(downloadResult.errorCode);

            console.log(
                `${fileName} downloaded ${downloadResult.contentType}, isCurrentVersion: ${downloadResult.isCurrentVersion}`
            );
            */

            return JSON.parse(configBuffer.toString());

        } catch (error) {
            const message = `Unable to read config from container '${containerName}' and blob '${blobName}' with error: ${_getString(error)}`;
            throw new AppError(message);
        }

    }

}