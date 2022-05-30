import { PropertyFactory, NodeProperty, BaseProperty } from "@fluid-experimental/property-properties";


import { DataBinder } from "@fluid-experimental/property-binder";

import { ITelemetryBaseLogger, ITelemetryBaseEvent } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";
import { SquashedHistory, TrackedPropertyTree, Tracker } from "./trackdds";
import { IRemotePropertyTreeMessage } from "@fluid-experimental/property-dds";
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



export interface TrackerWorkspace extends SimpleWorkspace {
    tracker: Tracker;
}

export interface TrackedWorkspace extends SimpleWorkspace {
    tree: TrackedPropertyTree;
    trackerInfo: string[] | undefined;
}

export enum HistoryArea {
    BEGIN_UNDEF = 1,
    SQUASHED = 2,
    REMOTE = 3,
    LOCAL = 4,
    END_UNDEF = 5,
};


export interface HistoryWorkspace {
    getTracked(): TrackedWorkspace;
    setAutoPersist(isAutoPersist: boolean);
    persistPoint();
    move(step: number);
    reset();
    commit();
}

function cloneChange(changeSet: ChangeSet): ChangeSet {
    return new ChangeSet(JSON.parse(JSON.stringify(changeSet._changes)));
}

class HistoryWorkspaceImpl implements HistoryWorkspace {

    constructor(private _dual: DualWorkspace) {
        this._currentOffset = -1;
        this._currentAreaOffset = -1;
        this._currentArea = undefined;
    }
    private _currentOffset;
    private _currentAreaOffset;
    private _currentArea;
    private _localChanges: ChangeSet = undefined;


    public getTracked() {
        return this._dual;
    }

    public move(step: number) {
        if (step > 0) {
            this.moveUp(step);
        }
        else if (step < 0) {
            this.moveDown(step);
        }
    }

    public reset() {

    }

    public commit() {
        return this._dual.commit();
    }

    public setAutoPersist(isAutoPersist: boolean) {
        this._dual.tracker.setAutoPersist(isAutoPersist);
    }

    public persistPoint() {
        this._dual.tree.persistPoint();
    }


    private offsetUp(): boolean {
        let areaCnt = this.countArea(this._currentArea);
        let isMove: boolean = false;
        let isTop: boolean = false;
        let myCurrentArea = this._currentArea;
        let myCurrentAreaOffset = this._currentAreaOffset;
        while ((myCurrentAreaOffset >= areaCnt)) {
            isTop = true;
            if (((myCurrentArea + 1) !== HistoryArea.END_UNDEF)) {
                myCurrentArea = myCurrentArea + 1;
                myCurrentAreaOffset = 0;
                areaCnt = this.countArea(myCurrentArea);
                if (myCurrentAreaOffset < areaCnt) {
                    isMove = true;
                    isTop = false;
                    break;
                }
            }
            else {
                break;
            }
        }
        if (!isTop) {
            myCurrentAreaOffset++;
            isMove = true;
        }
        if (isMove) {
            this._currentArea = myCurrentArea;
            this._currentAreaOffset = myCurrentAreaOffset;
            this._currentOffset++;

        }
        return isMove;
    }

    private offsetDown(): boolean {
        let isMove: boolean = false;
        let isBottom: boolean = false;
        let myCurrentArea = this._currentArea;
        let myCurrentAreaOffset = this._currentAreaOffset;
        while ((myCurrentAreaOffset <= 0)) {
            isBottom = true;
            if (((myCurrentArea) !== HistoryArea.BEGIN_UNDEF)) {
                myCurrentArea = myCurrentArea - 1;
                const areaCnt = this.countArea(myCurrentArea);
                myCurrentAreaOffset = areaCnt;
                if (myCurrentAreaOffset > 0) {
                    isBottom = false;
                    isMove = true;
                    break;
                }
            }
            else {
                break;
            }
        }
        if (!isBottom) {
            myCurrentAreaOffset--;
            isMove = true;
        }
        if (isMove) {
            this._currentArea = myCurrentArea;
            this._currentAreaOffset = myCurrentAreaOffset;
            this._currentOffset--;
        }
        return isMove;
    }


    private moveUp(step: number) {
        if (this._currentArea) {
            let fullChange: ChangeSet = undefined;
            for (let i = 0; i < step; i++) {
                const startingCurrentArea = this._currentArea;
                let startingAreaOffset = this._currentAreaOffset;
                const isMove = this.offsetUp();
                if (startingCurrentArea !== this._currentArea) {
                    startingAreaOffset = 0;
                }
                if (isMove) {
                    const currentChange: ChangeSet = cloneChange(this.getChangeFromArea(this._currentArea, startingAreaOffset));
                    if (!fullChange) {
                        fullChange = currentChange;
                    }
                    else {
                        fullChange.applyChangeSet(currentChange._changes);
                    }
                }
                else {
                    break;
                }
            }
            if (fullChange) {
                this._dual.tree.root.applyChangeSet(fullChange._changes);
            }
            const allCnt = this.countAll();
            
            if(this._currentOffset===allCnt-1){
                this._currentArea = undefined;
                this._currentAreaOffset = undefined;
                this._currentOffset = undefined;
            }
        }
    }


    private moveDown(step: number) {
        let isFromLocal = false;
        if (!this._currentArea) {
            if (this.countAll() < 1) {
                return;
            }
            else {
                this._currentArea = HistoryArea.LOCAL;
                this._currentAreaOffset = this.countArea(HistoryArea.LOCAL);
                this._currentOffset = this.countAll();
                isFromLocal = true;
            }
        }
        let fullChange: ChangeSet = undefined;
        for (let i = 0; i > step; i--) {
            const isMove: boolean = this.offsetDown();
            if (isMove) {
                const currentChange: ChangeSet = cloneChange(this.getChangeFromArea(this._currentArea, this._currentAreaOffset));
                if (isFromLocal) {
                    this._localChanges = cloneChange(currentChange);
                }
                currentChange.toInverseChangeSet();
                if (!fullChange) {
                    fullChange = currentChange;
                }
                else {
                    fullChange.applyChangeSet(currentChange._changes);
                }
            }
        }
        if (fullChange) {
            this._dual.tree.root.applyChangeSet(fullChange._changes);
        }
    }



    private countArea(currentArea: HistoryArea) {
        switch (currentArea) {
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

    private getChangeFromArea(area: HistoryArea, offset: number): ChangeSet {
        switch (this._currentArea) {
            case HistoryArea.LOCAL: {
                return this.getLocalChangeAt(offset);
            }
            case HistoryArea.REMOTE: {
                return this.getRemoteChangeAt(offset);
            }
            case HistoryArea.SQUASHED: {
                return this.getSquashedChangeAt(offset);
            }
            default: return undefined;
        }
    }



    private countAll(): number {
        return this.countSquashed() + this.countRemote() + this.countLocal();
    }

    private countSquashed(): number {
        return this._dual.tracker.count();
    }

    private countRemote(): number {
        const { tracked, bufferedLastSeq, bufferedCount } = this.readVars();
        const remoteCount = bufferedCount + tracked.remoteChanges.map((c) => c as IRemotePropertyTreeMessage)
            .filter((c) => c.sequenceNumber > bufferedLastSeq).length;
        return remoteCount;
    }


    private getRemoteChangeAt(offset: number): ChangeSet {
        const { tracker, trackedId, tracked } = this.readVars();
        const bufferedCount = tracker.countBuffered(trackedId);
        if (offset >= bufferedCount) {
            return new ChangeSet(JSON.parse(tracked.remoteChanges[offset - bufferedCount]?.changeSet));
        }
        else {
            return tracker.getBufferedAt(trackedId, offset)?.changeset;
        }
    }

    private getSquashedChangeAt(offset: number): ChangeSet {
        const { tracker } = this.readVars();
        return tracker.getChangeAt(offset).changeset;
    }

    private getLocalChangeAt(offset: number): ChangeSet {
        if (this._localChanges) {
            return this._localChanges;
        }
        const changes = this._dual.tree._root._serialize(true, false, BaseProperty.MODIFIED_STATE_FLAGS.PENDING_CHANGE);
        const changeset = new ChangeSet(changes);
        changeset._toReversibleChangeSet(this._dual.tree.tipView);
        return changeset;
    }



    private readVars() {
        const tracker = this._dual.tracker;
        const tracked = this._dual.tree;
        const trackedId = this._dual.containerId;
        const bufferedCount = this._dual.tracker.countBuffered(trackedId);

        const bufferedLastSeq = bufferedCount > 0 ? tracker.getBufferedAt(trackedId, bufferedCount - 1).lastSeq : undefined;
        return { tracker, trackedId, tracked, bufferedLastSeq, bufferedCount };
    }

    private countLocal(): number {
        const cnt = this._dual.tree._root.hasPendingChanges() ? 1 : 0;
        return cnt;
        //const changes = this._dual.tree._root._serialize(true, false, BaseProperty.MODIFIED_STATE_FLAGS.PENDING_CHANGE);
        //return changes.length;
    }


    public currentSeq(): number {
        return this._dual.tracker.getSeqAt(this._currentOffset);
    }

}


export interface DualWorkspace extends TrackedWorkspace {
    tracker: Tracker;
}

export class ReadyLogger implements ITelemetryBaseLogger {

    send(event: ITelemetryBaseEvent) {
        console.log(`Custom telemetry object array: ${JSON.stringify(event, null, 2)}`);
    }
}


export async function createHistoryWorkspace(containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined): Promise<HistoryWorkspace> {
    const dual = await createDualWorkspace(containerId, logger);
    return new HistoryWorkspaceImpl(dual);
}

export async function createOneToOneTracking(containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined) {
    const dual = await createDualWorkspace(containerId, logger);
    return { "tracked": dual, "tracker": dual };
}

export async function createTrackedWorkspace(containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined): Promise<TrackedWorkspace> {
    const containerSchema = {
        initialObjects: { tree: TrackedPropertyTree }
    };
    const tracked = await (createSimpleWorkspace(containerSchema, containerId, logger) as Promise<TrackedWorkspace>);
    const trackerInfo = tracked.tree.getTrackerInfo();
    tracked.trackerInfo = trackerInfo;
    return tracked;
}


export async function createTrackerWorkspace(containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined): Promise<TrackerWorkspace> {
    const containerSchema = {
        initialObjects: { tracker: SquashedHistory }
    };
    const tracker = createSimpleWorkspace(containerSchema, containerId, logger) as Promise<TrackerWorkspace>;
    return tracker;
}

export async function createDualWorkspace(containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined): Promise<DualWorkspace> {
    const containerSchema = {
        initialObjects: { tree: TrackedPropertyTree, tracker: SquashedHistory }
    };
    const dual = await (createSimpleWorkspace(containerSchema, containerId, logger) as Promise<DualWorkspace>);
    if (!containerId) {
        dual.tree.saveTracking(dual.containerId, dual.containerId);
    }
    TrackedPropertyTree.registerTrackerMethod(dual.containerId, dual.tracker);
    const trackerInfo = dual.tree.getTrackerInfo();
    dual.trackerInfo = trackerInfo;
    return dual;
}


export function saveTracking(tracked: TrackedWorkspace, tracker: TrackerWorkspace) {
    tracked.tree.saveTracking(tracker.containerId, tracked.containerId);
}

export function track(tracked: TrackedWorkspace, tracker: TrackerWorkspace) {
    TrackedPropertyTree.registerTrackerMethod(tracked.containerId, tracker.tracker);
}

async function createSimpleWorkspace(containerSchema, containerId: string | undefined,
    logger: ITelemetryBaseLogger | undefined = undefined): Promise<SimpleWorkspace> {

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

    return {
        "containerId": containerId, "tracker": tracker, "tree": sharedTree, "dataBinder": dataBinder
        , "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() }
    } as SimpleWorkspace;
}



