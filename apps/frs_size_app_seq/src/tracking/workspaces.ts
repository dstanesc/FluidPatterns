
import { SharedMap } from "@fluidframework/map";


import { ITelemetryBaseLogger} from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";




export interface SimpleWorkspace {

    tree: SharedMap;
    containerId: string;
}



export async function createSimpleWorkspace( containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

    const containerSchema = {
            initialObjects: { tree: SharedMap }
        };

    const createNew = containerId === undefined;

    const clientTiny = new AzureClient({
        connection: {
            tenantId: LOCAL_MODE_TENANT_ID,
            tokenProvider: new InsecureTokenProvider("", {
                id: "root",
            }),
            orderer: "http://localhost:7070",
            storage: "http://localhost:7070",
        },
        logger,
    });


    const clientFrs = new AzureClient({
        connection: {
            tenantId: "a0d1cb71-8f95-4114-a8f4-19dfaf7343fd",
            tokenProvider: new InsecureTokenProvider("90ed9a479c023321051f7c521f7037fd", {
                id: "benchmark",
            }),
            orderer: "https://alfred.westus2.fluidrelay.azure.com",
            storage: " https://historian.westus2.fluidrelay.azure.com",
        },
        logger,
    });
    const client=clientFrs;

    let containerAndServices;

    if (createNew) {
        containerAndServices = await client.createContainer(containerSchema);
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await client.getContainer(containerId, containerSchema);
    }

    const sharedTree = await  containerAndServices.container.initialObjects.tree as SharedMap;

    return { "containerId": containerId, "tree": sharedTree } as SimpleWorkspace;
}




