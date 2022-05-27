import { PropertyFactory, NodeProperty } from "@fluid-experimental/property-properties";


import { DataBinder } from "@fluid-experimental/property-binder";

import { ITelemetryBaseLogger, ITelemetryBaseEvent } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";
import { SquashedHistory, TrackedPropertyTree, Tracker } from "./trackdds";
import { type } from "os";
import { IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";
import { ChangeSet } from "@fluid-experimental/property-changeset";



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

export enum HistoryArea  {
    BEGIN_UNDEF = 1,
    SQUASHED = 2,
    REMOTE = 3,
    LOCAL = 4,
    END_UNDEF = 5,
 };


export interface HistoryWorkspace {
    currentOffset(): number;
    currentAreaOffset(): number;
    currentArea(): HistoryArea;
    getTracked(): SharedPropertyTree;       
    move(step: number);
    reset();
    commit();
}


class HistoryWorkspaceImpl implements HistoryWorkspace{
    
    constructor (private _dual: DualWorkspace){
        this._currentOffset = -1;
        this._currentAreaOffset = -1;
        this._currentArea = undefined;
    }
    private _currentOffset;
    private _currentAreaOffset;
    private _currentArea;

    public currentOffset(){
        return this._currentOffset;
    }

    public currentAreaOffset(){
        return this._currentOffset;
    }

    public currentArea(){
        return this._currentArea;
    }

    public move(step: number){
        if(step>0){
            this.moveFwd(step);
        }
        else if(step<0){
            this.moveBack(step);
        }
    }

    private countCurrentArea(){
        switch(this._currentArea){
            case HistoryArea.LOCAL: {
                return this.countLocal();
            }
            case HistoryArea.REMOTE: {
                return this.countRemote();
            }
            case HistoryArea.SQUASHED: {
                return this.countSquashed();
            }
            default: return undefined;
        }
    }

    private readChangeFromArea(area: HistoryArea, offset: number){

    }

    private moveFwd(step: number) {
        if(this._currentArea){
            let areaCnt = this.countCurrentArea();
            let isMove = false;
            for(let i=0;i<step;i++){
                const startingCurrentArea = this._currentArea;
                const startingAreaOffset = this._currentAreaOffset;
                if((this._currentAreaOffset + i)>=areaCnt){
                    if((this._currentArea+1)!== HistoryArea.END_UNDEF){
                        this._currentArea=this._currentArea+1;
                        this._currentAreaOffset=0;     
                        this._currentOffset++;     
                        isMove = true;              
                    }                                        
                }
                else {
                    this._currentAreaOffset++;
                    this._currentOffset++;  
                    isMove = true;                  
                }
                if(isMove){
                    
                }
            }
        }
    }

    private moveBack(step: number) {

    }

    private countAll(): number {
        return this.countSquashed() + this.countRemote() + this.countLocal();
    }
    
    private countSquashed(): number{
        return this._dual.tracker.count();
    }

    private countRemote(): number{
        const {tracked, bufferedLastSeq, bufferedCount } = this.readVars();
        const remoteCount = bufferedCount + tracked.remoteChanges.map((c)=>c as IRemotePropertyTreeMessage)
            .filter((c)=>c.sequenceNumber>bufferedLastSeq).length;
            return remoteCount;
    }


    private listRemote(): ChangeSet[]{
        const { tracker, trackedId, tracked, bufferedLastSeq } = this.readVars();
        const remote = tracker.listBuffered(trackedId);
        remote.push(...tracked.remoteChanges.map((c)=>c as IRemotePropertyTreeMessage)
            .filter((c)=>c.sequenceNumber>bufferedLastSeq).map((c)=>c.changeSet));
        return remote;
    }

    private getRemoteChangeAt(offset: number): ChangeSet[]{
        const { tracker, trackedId, tracked, bufferedLastSeq } = this.readVars();
        const bufferedCount = tracker.countBuffered(trackedId);
        let remote: ChangeSet;
        if(offset>=bufferedCount){
    
        }
        else {

        }

    }

    private listLocal(): ChangeSet[]{
        const tracked = this._dual.tree;        
        return tracked.localChanges.map((c)=>c.changeSet);
    }


    private readVars() {
        const tracker = this._dual.tracker;
        const tracked = this._dual.tree;
        const trackedId = this._dual.containerId;
        const bufferedCount = this._dual.tracker.countBuffered(trackedId);
        const bufferedLastSeq = tracker.getBufferedAt(trackedId, bufferedCount - 1).lastSeq;
        return { tracker, trackedId, tracked, bufferedLastSeq, bufferedCount };
    }

    private countLocal(): number{
        return this._dual.tree.localChanges.length;
    }


    public currentSeq(): number {
        return this._dual.tracker.getSeqAt(this._currentOffset);
    }

}


export interface DualWorkspace extends TrackedWorkspace{
    tracker: Tracker;
}

export class ReadyLogger implements ITelemetryBaseLogger {

    send(event: ITelemetryBaseEvent) {
        console.log(`Custom telemetry object array: ${JSON.stringify(event, null, 2)}`);
    }
}


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
    }

    const sharedTree = containerAndServices.container.initialObjects.tree;

    const tracker = containerAndServices.container.initialObjects.tracker;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tracker": tracker, "tree": sharedTree, "dataBinder": dataBinder
    , "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } } as SimpleWorkspace;
}



