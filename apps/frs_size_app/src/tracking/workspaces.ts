import { SharedPropertyTree } from "@fluid-experimental/property-dds";
import { PropertyFactory, NodeProperty } from "@fluid-experimental/property-properties";


import { DataBinder } from "@fluid-experimental/property-binder";

import { IFluidContainer } from "@fluidframework/fluid-static";
import { ITelemetryBaseLogger, ITelemetryBaseEvent } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";
import { SquashedHistory, TrackedPropertyTree, Tracker } from "./trackdds";



export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}


export interface SimpleWorkspace {

    tree: SharedPropertyTree;

    containerId: string;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;
}



export async function createSimpleWorkspace( containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

    const containerSchema = {
            initialObjects: { tree: SharedPropertyTree }
        };

    const createNew = containerId === undefined;
/*
    const client = new AzureClient({
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
    */

    const client = new AzureClient({
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
 

    let containerAndServices;

    if (createNew) {
        containerAndServices = await client.createContainer(containerSchema);
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await client.getContainer(containerId, containerSchema);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tree": sharedTree, "dataBinder": dataBinder
    , "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } } as SimpleWorkspace;
}




