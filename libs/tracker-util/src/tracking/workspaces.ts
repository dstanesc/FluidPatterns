import { PropertyFactory, NodeProperty, BaseProperty } from "@fluid-experimental/property-properties";
import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { DataBinder } from "@fluid-experimental/property-binder";

import { ITelemetryBaseLogger, ITelemetryBaseEvent } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";
import { ChangeEntry, SquashedHistory, TrackedPropertyTree, Tracker } from "./trackdds";
import { ChangeSet } from "@fluid-experimental/property-changeset";

export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}



export interface HistoryWorkspace {
    getTracked(): TrackedWorkspace;
    setAutoPersist(isAutoPersist: boolean);
    persistPoint();
    move(step: number);
    reset();
    commit();
}




export interface SimpleWorkspace {
    containerId: string;
    dataBinder: DataBinder;
    rootProperty: NodeProperty;
    commit(): void;
}



export async function moveAsync(hist: HistoryWorkspace, step: number) {
    await null;
    hist.move(step);
}

export interface TrackerWorkspace extends SimpleWorkspace {
    tracker: Tracker;
}

export interface TrackedWorkspace extends SimpleWorkspace {
    tree: TrackedPropertyTree;
    trackerInfo: string[] | undefined;
}






function cloneChange(changeSet: ChangeSet): ChangeSet {
    return new ChangeSet(JSON.parse(JSON.stringify(changeSet._changes)));
}

class HistoryWorkspaceImpl implements HistoryWorkspace {

    private _isInHistory = false;
    private _currentSeq: number = undefined;
    private _localChanges: ChangeEntry = undefined;
    private _changes: ChangeEntry[] = undefined;
    private _bufferedCache: ChangeEntry[] = [];
    private static readonly LOCAL_SEQ_START = Number.MAX_SAFE_INTEGER - 1024 * 1024;

    constructor(private _dual: DualWorkspace) {
    }

    public getTracked() {
        return this._dual;
    }

    public move(step: number): boolean {
        if (this._dual.tree.localChanges.length > 0) {
            console.warn("Local Changes Submitted but not Received. Move not executed.");
            return false;
        }
        this._changes = this.readChanges();
        if (step > 0) {
            this.moveUp(step);
        }
        else if (step < 0) {
            this.moveDown(step);
        }
        return true;
    }

    public reset() {
    }

    public commit() {
        this._localChanges = undefined;
        this._isInHistory = false;
        this._currentSeq = undefined;
        this._changes = undefined;
        this._dual.tree.commit();
    }

    public setAutoPersist(isAutoPersist: boolean) {
        this._dual.tracker.setAutoPersist(isAutoPersist);
    }

    public persistPoint() {
        this._dual.tree.persistPoint();
    }


    private moveUp(step: number) {
        if (this._changes.length < 1) return;
        if (!this._currentSeq) return;
        if (this._currentSeq === this._changes[this._changes.length - 1].lastSeq) return;
        const posInChanges = this.findChangePos(this._currentSeq + 1, this._changes);
        let fullChange: ChangeSet = undefined;
        let currentSeq: number = this._currentSeq;
        for (let i = 0; i < step; i++) {
            const currentPosInChanges = posInChanges + i;
            if (currentPosInChanges >= this._changes.length) break;
            const changeEntry: ChangeEntry = this._changes[currentPosInChanges];
            const change = cloneChange(changeEntry.changeset);
            if (!fullChange) {
                fullChange = change;
            }
            else {
                fullChange.applyChangeSet(change._changes);
            }
            currentSeq = changeEntry.lastSeq;
        }
        if (fullChange) {
            console.log("MISO1 Apply" + JSON.stringify(fullChange._changes));
            this._dual.tree.root.applyChangeSet(fullChange._changes);
            this._isInHistory = true;
            this._currentSeq = currentSeq;
        }
    }

    private moveDown(step: number) {
        if (this._changes.length < 1) return;
        if (!this._currentSeq) this._currentSeq = this._changes[this._changes.length - 1].lastSeq;
        if (this._currentSeq < 0) return;
        const posInChanges = this.findChangePos(this._currentSeq, this._changes);
        let fullChange: ChangeSet = undefined;
        let currentSeq: number = this._currentSeq;
        for (let i = 0; i > step; i--) {
            const currentPosInChanges = posInChanges + i;
            if (currentPosInChanges < 0) break;
            const changeEntry: ChangeEntry = this._changes[currentPosInChanges];
            if (!this._isInHistory) {
                if (changeEntry.lastSeq === HistoryWorkspaceImpl.LOCAL_SEQ_START) {
                    this._localChanges = changeEntry;
                }
            }
            const change = cloneChange(changeEntry.changeset);
            change.toInverseChangeSet();
            if (!fullChange) {
                fullChange = change;
            }
            else {
                fullChange.applyChangeSet(change._changes);
            }
            currentSeq = currentPosInChanges > 0 ? this._changes[currentPosInChanges - 1].lastSeq : -1;

        }
        if (fullChange) {
            console.log("MISO1 Apply" + JSON.stringify(fullChange._changes));
            this._dual.tree.root.applyChangeSet(fullChange._changes);
            this._isInHistory = true;
            this._currentSeq = currentSeq;
            this._dual.tree.allowRemoteReceive(false);
        }

    }

    private readAndCacheBuffered(): ChangeEntry[] {
        const tracker: Tracker = this._dual.tracker;
        const trackedId = this._dual.containerId;
        let bufferedCacheSeq = -1;
        if (this._bufferedCache.length > 0) {
            bufferedCacheSeq = this._bufferedCache[this._bufferedCache.length - 1].lastSeq;
        }
        let allBuffered: ChangeEntry[] = tracker.listBuffered(trackedId);
        allBuffered = allBuffered ? allBuffered : [];
        this._bufferedCache = this._bufferedCache.concat(allBuffered.filter((b) => b.lastSeq > bufferedCacheSeq));
        return this._bufferedCache;
    }

    private mergeRemoteAndBuffered(remote: ChangeEntry[], buffered: ChangeEntry[]): ChangeEntry[] {
        let remoteInd = 0;
        let bufferedInd = 0;
        let result: ChangeEntry[] = [];
        while (true) {
            if (remoteInd > remote.length - 1) {
                for (let i = bufferedInd; i < buffered.length; i++) {
                    result.push(buffered[i])
                }
                break;
            }
            else if (bufferedInd > buffered.length - 1) {
                for (let i = remoteInd; i < remote.length; i++) {
                    result.push(remote[i])
                }
                break;
            }
            else if (remote[remoteInd].lastSeq < buffered[bufferedInd].lastSeq) {
                result.push(remote[remoteInd]);
                remoteInd++;
            }
            else if (remote[remoteInd].lastSeq > buffered[bufferedInd].lastSeq) {
                result.push(buffered[remoteInd]);
                bufferedInd++;
            }
            else {
                result.push(remote[remoteInd]);
                remoteInd++;
                bufferedInd++;
            }
        }
        return result;
    }

    private alignLiveWithSquashed(live: ChangeEntry[], squashed: ChangeEntry[]): ChangeEntry[] {
        if (!squashed) return live;
        if (squashed.length === 0) return live;
        let firstLiveSeq = live.length > 0 ? live[0].lastSeq : Number.MAX_SAFE_INTEGER;
        let index = 0
        for (; index < squashed.length; index++) {
            if (squashed[index].lastSeq > firstLiveSeq) {
                break;
            }
        }
        let result: ChangeEntry[] = [];
        for (let i = 0; i < index; i++) {
            result.push(squashed[i]);
        }
        let lastSquashedIndex = index > 0 ? squashed[index - 1].lastSeq : -1;
        live.filter((c) => c.lastSeq > lastSquashedIndex).forEach((c) => result.push(c));
        return result;
    }

    private readChanges(): ChangeEntry[] {
        const tracker: Tracker = this._dual.tracker;
        const tracked: TrackedPropertyTree = this._dual.tree;
        const trackedId = this._dual.containerId;
        let allBuffered: ChangeEntry[] = this.readAndCacheBuffered();
        const allRemoteMsgs = tracked.remoteChanges.map((msg) => (msg as IRemotePropertyTreeMessage));
        const allRemote: ChangeEntry[] = allRemoteMsgs.map((remoteMsg) => {
            return {
                "trackedContainerId": trackedId,
                "changeset": new ChangeSet(remoteMsg.changeSet),
                "lastSeq": remoteMsg.sequenceNumber
            }
        });
        let live = this.mergeRemoteAndBuffered(allRemote, allBuffered);
        const allSquashed: ChangeEntry[] = tracker.list();
        return this.alignLiveWithSquashed(live, allSquashed).concat(this.getLocalChanges());
    }

    private findChangePos(seq: number, changes: ChangeEntry[]): number | undefined {
        for (let i = 0; i < changes.length; i++) {
            if (changes[i].lastSeq >= seq) {
                return i;
            }
        }
        return undefined;
    }

    private getLocalChanges(): ChangeEntry[] {
        const trackedId = this._dual.containerId;
        if (this._localChanges) {
            return [this._localChanges];
        }
        else if (this._dual.tree._root.hasPendingChanges()) {
            const changes = this._dual.tree._root._serialize(true, false, BaseProperty.MODIFIED_STATE_FLAGS.PENDING_CHANGE);
            const changeset = new ChangeSet(changes);
            changeset._toReversibleChangeSet(this._dual.tree.tipView);
            return [{
                "trackedContainerId": trackedId,
                "changeset": new ChangeSet(changeset),
                "lastSeq": HistoryWorkspaceImpl.LOCAL_SEQ_START
            }];
        }
        else {
            return [];
        }
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



