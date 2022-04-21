import { EventEmitter } from "events";
import { IFluidDataStoreContext, IFluidDataStoreFactory } from "@fluidframework/runtime-definitions";
import { IFluidHandle, IRequest, IResponse } from "@fluidframework/core-interfaces";
import { SharedPropertyTree, PropertyTreeFactory } from "@fluid-experimental/property-dds";
import { IDirectory, ISharedDirectory, IValueChanged, SharedDirectory } from "@fluidframework/map";

import { LazyLoadedDataObject, LazyLoadedDataObjectFactory } from "@fluidframework/data-object-base";
import { PropertyFactory, BaseProperty, NodeProperty } from "@fluid-experimental/property-properties";
import { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";

import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";

import { getDefaultObjectFromContainer } from "@fluidframework/aqueduct";
import { getTinyliciousContainer } from "@fluid-experimental/get-container";

import { DataBinder } from "@fluid-experimental/property-binder";

import { TinyliciousClient, TinyliciousContainerServices } from "@fluidframework/tinylicious-client";

import { IFluidContainer } from "@fluidframework/fluid-static";
import { ITelemetryLogger, ITelemetryBaseLogger, ITelemetryBaseEvent } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";



export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}


export interface SimpleWorkspace {

    containerId: string;

    tree: SharedPropertyTree;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;
}

export class ReadyLogger implements ITelemetryBaseLogger {

    send(event: ITelemetryBaseEvent) {
        console.log(`Custom telemetry object array: ${JSON.stringify(event, null, 2)}`);
    }
}


export async function createSimpleWorkspace(containerId: string | undefined, logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

    const createNew = containerId === undefined;

    const containerSchema = {
        initialObjects: { tree: SharedPropertyTree }
    };

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

    let containerAndServices;

    if (createNew) {
        containerAndServices = await client.createContainer(containerSchema);
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await client.getContainer(containerId, containerSchema);
        waitForFullyLoaded(containerAndServices.container);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tree": sharedTree, "dataBinder": dataBinder, "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } }
}


// function waitForFullyLoaded(userId: string, container: IFluidContainer) {
//     // Ensure container data available
//     const sharedTree = container.initialObjects.tree as SharedPropertyTree;
//     sharedTree.commit({ userId, timestamp: Date.now() }, true);
//     return new Promise((resolve) =>
//         container.once("saved", () => resolve(undefined))
//     );
// }


function waitForFullyLoaded(container: IFluidContainer) {
    if (container.connected) {
        return;
    }
    return new Promise((resolve) =>
        container.once("connected", () => resolve(undefined))
    );
}