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

    containerId: string;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;
}



export interface TrackerWorkspace extends SimpleWorkspace{
    tracker: Tracker;
}

export interface TrackedWorkspace extends SimpleWorkspace{
    tree: TrackedPropertyTree;
    trackerInfo: string[] | undefined;
}

export interface DualWorkspace extends TrackedWorkspace{
    tracker: Tracker;
}

export class ReadyLogger implements ITelemetryBaseLogger {

    send(event: ITelemetryBaseEvent) {
        console.log(`Custom telemetry object array: ${JSON.stringify(event, null, 2)}`);
    }
}

/*
export async function createOneToOneTracking(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined){
        const tracked = createTrackedWorkspace(containerId,logger);
        const trackerInfo = (await tracked).trackerInfo;
        let tracker = undefined;
        if(trackerInfo){
            if(trackerInfo.length>0){
                tracker = createTrackerWorkspace(trackerInfo[0],logger);
            }
        }
        if(!tracker){
            tracker = createTrackerWorkspace(undefined,logger);
            saveTracking((await tracked),(await tracker));      
        }
        track((await tracked),(await tracker));
        return {"tracked":tracked, "tracker":tracker};
    }
*/

export async function createOneToOneTracking(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined){
    const dual = await createDualWorkspace(containerId,logger);
    return {"tracked": dual, "tracker":dual};
}

export async function createTrackedWorkspace(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<TrackedWorkspace> {
    const containerSchema = {
        initialObjects: { tree: TrackedPropertyTree }
    };
    const tracked = await (createSimpleWorkspace(containerSchema,containerId,logger) as Promise<TrackedWorkspace>);
    const trackerInfo = tracked.tree.getTrackerInfo();
    tracked.trackerInfo = trackerInfo;
    return tracked;
}


export async function createTrackerWorkspace(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<TrackerWorkspace> {
        const containerSchema = {
            initialObjects: { tracker: SquashedHistory }
        };
    const tracker = createSimpleWorkspace(containerSchema,containerId,logger) as Promise<TrackerWorkspace>;
    return tracker;
}

export async function createDualWorkspace(containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<DualWorkspace> {
        const containerSchema = {
            initialObjects: { tree: TrackedPropertyTree, tracker: SquashedHistory }
        };
    const dual = await (createSimpleWorkspace(containerSchema,containerId,logger) as Promise<DualWorkspace>);
    if(!containerId){
        dual.tree.saveTracking( dual.containerId,dual.containerId);
    }
    TrackedPropertyTree.registerTrackerMethod(dual.containerId,dual.tracker);    
    const trackerInfo = dual.tree.getTrackerInfo();
    dual.trackerInfo = trackerInfo;
    return dual;
}


export function saveTracking(tracked: TrackedWorkspace, tracker: TrackerWorkspace){
    tracked.tree.saveTracking(tracker.containerId,tracked.containerId);
}

export function track(tracked: TrackedWorkspace, tracker: TrackerWorkspace){
    TrackedPropertyTree.registerTrackerMethod(tracked.containerId,tracker.tracker);
}

async function createSimpleWorkspace(containerSchema, containerId: string | undefined, 
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

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
        waitForFullyLoaded("root", containerAndServices.container);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const tracker = containerAndServices.container.initialObjects.tracker as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tracker": tracker, "tree": sharedTree, "dataBinder": dataBinder
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

