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
import { SquashedHistory, TrackedPropertyTree } from "./trackdds";



export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}


export interface SimpleWorkspace {

    containerId: string;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;
}



export interface SquashedHistoryWorkspace extends SimpleWorkspace{
    tree: SquashedHistory;
}

export interface TrackedWorkspace extends SimpleWorkspace{
    tree: TrackedPropertyTree;
    trackerInfo: string | undefined;
}

export class ReadyLogger implements ITelemetryBaseLogger {

    send(event: ITelemetryBaseEvent) {
        console.log(`Custom telemetry object array: ${JSON.stringify(event, null, 2)}`);
    }
}

export async function createOneToOneTracking(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined){
        const tracked = createTrackedWorkspace(containerId,logger);
        const trackerInfo = (await tracked).trackerInfo;
        const tracker = createTrackerWorkspace(trackerInfo,logger);
        if(!trackerInfo){
            saveTracking((await tracked),(await tracker));            
        }
        track((await tracked),(await tracker));
        return {"tracked":tracked, "tracker":tracker};
    }


export async function createTrackedWorkspace(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<TrackedWorkspace> {
    const containerSchema = {
        initialObjects: { tree: TrackedPropertyTree }
    };
    const tracked = createSimpleWorkspace(containerSchema,containerId,logger) as Promise<TrackedWorkspace>;
    const trackerInfo = (await tracked).tree.getTrackerInfo();
    (await tracked).trackerInfo = trackerInfo;
    return tracked;
}


export async function createTrackerWorkspace(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SquashedHistoryWorkspace> {
        const containerSchema = {
            initialObjects: { tree: SquashedHistory }
        };
    const tracker = createSimpleWorkspace(containerSchema,containerId,logger) as Promise<SquashedHistoryWorkspace>;
    return tracker;
}

export function saveTracking(tracked: TrackedWorkspace, tracker: SquashedHistoryWorkspace){
    tracked.tree.init(tracker.containerId,tracked.containerId);
}

export function track(tracked: TrackedWorkspace, tracker: SquashedHistoryWorkspace){
    TrackedPropertyTree.registerTrackerMethod(tracked.containerId,tracker.tree);
}

async function createSimpleWorkspace(containerSchema, containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

    const createNew = containerId === undefined;

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
        waitForFullyLoaded("root", containerAndServices.container);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tree": sharedTree, "dataBinder": dataBinder
    , "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } } as SimpleWorkspace;
}


function waitForFullyLoaded(userId: string, container: IFluidContainer) {
    // Ensure container data available
    /*
    const sharedTree = container.initialObjects.tree as SharedPropertyTree;
    sharedTree.commit({ userId, timestamp: Date.now() }, true);
    return new Promise((resolve) =>
        container.once("saved", () => resolve(undefined))
    );
    */
}

