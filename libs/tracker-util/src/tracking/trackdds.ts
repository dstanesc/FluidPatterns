import { ChangeSet } from '@fluid-experimental/property-changeset';

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree, SharedPropertyTreeOptions } from "@fluid-experimental/property-dds";
import { ArrayProperty, ContainerProperty, Int32Property, MapProperty, NodeProperty, PropertyFactory, StringArrayProperty, StringProperty } from "@fluid-experimental/property-properties";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
} from "@fluidframework/datastore-definitions";
import { SquashedHistoryFactory, TrackedPropertyTreeFactory } from "./propFactory";


export interface ChangeEntry {
    trackedContainerId: string;
    changeset: ChangeSet;
    lastSeq: number;
}

export interface Tracker {
    processChanges(trackedTree: TrackedPropertyTree, prunedChanges: IPropertyTreeMessage[]);
    getChangeAt(offset: number): ChangeEntry;
    getSeqAt(offset: number): number
    length(): number;
    list();    
// poll(consumerGroup);
}


export class TrackedPropertyTree extends SharedPropertyTree {

    
    private static _trackers: Map<string,Tracker[]>=new Map<string,Tracker[]>();
    
    public static readonly TRACKER_INFO_PROP_PATH = "Tracker_DDS"    
    public static readonly MY_ID_PROP_PATH = "MyId"


	public constructor(
		id: string,
		runtime: IFluidDataStoreRuntime,
		attributes: IChannelAttributes,
	) {
		super(id, runtime, attributes, {});
	}


    public static override getFactory(): TrackedPropertyTreeFactory {
		return new TrackedPropertyTreeFactory();
	}

    public getTrackerInfo(): string[]|undefined {
        let trackerContainerProp = this.root.resolvePath(TrackedPropertyTree.TRACKER_INFO_PROP_PATH);
        let trackerContainerInfo = trackerContainerProp?
            (trackerContainerProp as StringArrayProperty):undefined;
         let ret:string[]=[];
         if(trackerContainerProp){
            let trackerContainerPropArray = (trackerContainerProp as StringArrayProperty);
            for(let i=0;i<trackerContainerPropArray.length;i++){
                ret.push(trackerContainerPropArray.get(i));
            }
         }
         else {
             return undefined;
         }
    }
    

    public get myId(){
        let myIdProp: StringProperty = this.root.resolvePath(TrackedPropertyTree.MY_ID_PROP_PATH);
        if(myIdProp){
            return myIdProp.value;
        }
        else{
            return undefined;
        }
    }


    public static registerTrackerMethod(containerId, tracker){
        let trackers=TrackedPropertyTree._trackers.get(containerId);
        if(trackers===undefined){
            trackers=[];
            TrackedPropertyTree._trackers.set(containerId,trackers);
        }
        trackers.push(tracker);
    }

    public saveTracking(onetrackerInfo: string, containerId: string){
        let trackerInfoProp: StringProperty = this.root.resolvePath(TrackedPropertyTree.TRACKER_INFO_PROP_PATH);
        if(!trackerInfoProp){
          trackerInfoProp =  PropertyFactory.create("String","single") as StringProperty;
          this.root.insert(TrackedPropertyTree.TRACKER_INFO_PROP_PATH,trackerInfoProp);
        }
        trackerInfoProp.value = onetrackerInfo;
        let myIdProp: StringProperty = this.root.resolvePath(TrackedPropertyTree.MY_ID_PROP_PATH);
        if(!myIdProp){
            myIdProp =  PropertyFactory.create("String","single") as StringProperty;
          this.root.insert(TrackedPropertyTree.MY_ID_PROP_PATH,myIdProp);
        }
        myIdProp.value = containerId;        
        this.commit();
    }



    public static pruneAndSave(
        minimumSequenceNumber: number,
        remoteChanges: IPropertyTreeMessage[],
        unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>,
        prop:TrackedPropertyTree,
    ) {
    
        const origResult = TrackedPropertyTree.prune(
            minimumSequenceNumber,
            remoteChanges,
            unrebasedRemoteChanges
        ); 

        if(prop.myId){
            const trackers = TrackedPropertyTree._trackers.get(prop.myId);
            if(trackers){
                trackers.forEach((tracker)=>tracker.processChanges(prop,origResult.remoteChanges));
            }            
        }    
        return origResult;
    }

    public override pruneHistory() {
		const msn = this.runtime.deltaManager.minimumSequenceNumber;

		const { remoteChanges, unrebasedRemoteChanges } = TrackedPropertyTree.pruneAndSave(
			msn,
			this.remoteChanges,
			this.unrebasedRemoteChanges,
            this,
		);

		this.remoteChanges = remoteChanges;
		this.unrebasedRemoteChanges = unrebasedRemoteChanges;
	}
}


export class SquashedHistory extends SharedPropertyTree implements Tracker{

    public constructor(
		id: string,
		runtime: IFluidDataStoreRuntime,
		attributes: IChannelAttributes,
	) {
		super(id, runtime, attributes, {});
	}


    public static override getFactory(): SquashedHistoryFactory {
		return new SquashedHistoryFactory();
	}

    public static readonly BUFFER_PROPERTY = "Buffer"
    public static readonly LOG_PROPERTY = "Log"
    public static readonly LAST_SEQUENCE_NR_PROPERTY = "LastSequenceNumber";
    public static readonly TRACKED_ID_PROPERTY = "TrackedId"
    public static readonly SQUASHED_END_SEQ_PROPERTY = "SquashedEndSeq"
    public static readonly LOGGED_CHANGE_PROPERTY = "LoggedChange"



    private static cloneChangeset(changeSet): ChangeSet {
        return new ChangeSet(JSON.parse(JSON.stringify(changeSet)));
    }

    private squashChanges(changeSets: ChangeSet[]): ChangeSet{
        const firstChange = SquashedHistory.cloneChangeset(changeSets[0]);        
        for(let i=1;i<changeSets.length;i++){
          const nextChange = SquashedHistory.cloneChangeset(changeSets[i]);
          console.log(JSON.stringify(nextChange.getSerializedChangeSet()));            
          firstChange.applyChangeSet(nextChange);
        }
        return firstChange;
    }


    private findOrCreateProp(container: ContainerProperty, key: string, typeId: string, context: string){
        let prop = container.resolvePath(key);
        if(!prop){
            prop = PropertyFactory.create(typeId,context);
            if(container instanceof NodeProperty){
                (container as NodeProperty).insert(key,prop);  
            }
            else if (container instanceof MapProperty){
                (container as MapProperty).insert(key,prop);  
            }            
        }
        return prop;
    }
 

    public processChanges(trackedTree: TrackedPropertyTree, prunedChanges: IPropertyTreeMessage[]){
        console.log("miso 1 processChanges start");
        //const trackedRemoteChanges = trackedTree.remoteChanges.slice(0,trackedTree.remoteChanges.length - prunedChanges.length);
        const trackedRemoteChanges = trackedTree.remoteChanges;


        trackedRemoteChanges.forEach((msg)=>console.log(JSON.stringify(msg)));     
        
        const trackedId = trackedTree.myId;
        const buffer: MapProperty = 
            this.findOrCreateProp(this.root,SquashedHistory.BUFFER_PROPERTY,"BaseProperty","map") as MapProperty;
        const entry: MapProperty = this.findOrCreateProp(buffer,trackedId,"BaseProperty","map") as MapProperty;
        let lastSeqProp = (entry.get(SquashedHistory.LAST_SEQUENCE_NR_PROPERTY) as Int32Property);
        let lastSeq;
        if(lastSeqProp){            
            lastSeq=lastSeqProp.value;
        }
        else {
            lastSeqProp=this.findOrCreateProp(entry,SquashedHistory.LAST_SEQUENCE_NR_PROPERTY,"Int32","single") as Int32Property;
            lastSeq=-1;
        }        
        const newRemoteChanges: IRemotePropertyTreeMessage[] = trackedRemoteChanges
            .map((msg) => (msg as IRemotePropertyTreeMessage))
            .filter((msg) => lastSeq<msg.sequenceNumber);       
        if(newRemoteChanges.length>0) {
            const newChangeSets: ChangeSet[] = newRemoteChanges.map((change)=>change.changeSet);
            const squashedChangeSet = this.squashChanges(newChangeSets);
            const strChangeSet = JSON.stringify(squashedChangeSet.getSerializedChangeSet());            
            const logProperty: ArrayProperty=
                this.findOrCreateProp(this.root,SquashedHistory.LOG_PROPERTY,"BaseProperty","array") as ArrayProperty;               
            const logEntry = PropertyFactory.create("BaseProperty","map") as MapProperty;
            logProperty.push(logEntry);            
            const squashedEndSeqProp = this.findOrCreateProp(logEntry,SquashedHistory.SQUASHED_END_SEQ_PROPERTY,"Int32","single");
            squashedEndSeqProp.value = newRemoteChanges[newRemoteChanges.length-1].sequenceNumber;
            const trackedIdProp = this.findOrCreateProp(logEntry,SquashedHistory.TRACKED_ID_PROPERTY,"String","single");
            trackedIdProp.value = trackedId;
            const loggedChangeProp = this.findOrCreateProp(logEntry,SquashedHistory.LOGGED_CHANGE_PROPERTY,"String","single");
            loggedChangeProp.value=strChangeSet;
            let newLastSeq = newRemoteChanges[newRemoteChanges.length-1].sequenceNumber;
            lastSeqProp.value=newLastSeq;
            this.commit();                
        }     
        console.log("miso 1 processChanges end");  
    }

    private readLogEntry(offset: number) {
        const logProperty = this.root.resolvePath(SquashedHistory.LOG_PROPERTY) as ArrayProperty;               
        const logEntry = logProperty.get(offset); 
        return logEntry as MapProperty;
    }


    public getChangeAt(offset: number): ChangeEntry {
        const logEntry = this.readLogEntry(offset);
        if(!logEntry){
            return undefined;
        }
        const trackedId: string = logEntry.get(SquashedHistory.TRACKED_ID_PROPERTY).value;
        const serializedChange = logEntry.get(SquashedHistory.LOGGED_CHANGE_PROPERTY).value;
        const changeset = new ChangeSet(JSON.parse(serializedChange));
        const lastSeq: number = logEntry.get(SquashedHistory.SQUASHED_END_SEQ_PROPERTY).value;
        return {"trackedContainerId": trackedId,"changeset": changeset, "lastSeq": lastSeq};
    }
    

    public getSeqAt(offset: number): number {
        const logEntry = this.readLogEntry(offset);
        if(!logEntry){
            return undefined;
        }
        return logEntry.get(SquashedHistory.SQUASHED_END_SEQ_PROPERTY).value;

    }

    public length(): number {
        const logProperty = this.root.resolvePath(SquashedHistory.LOG_PROPERTY) as ArrayProperty;
        if(logProperty){
            return logProperty.length
        }
        else {
            return undefined;
        }
    }

    public list() {
        const logProperty = this.root.resolvePath(SquashedHistory.LOG_PROPERTY) as ArrayProperty;
        const ret = [];
        for (let i=0;i<logProperty.length;i++){
            const logEntry =logProperty.get(i) as MapProperty;
            const trackedId: string = logEntry.get(SquashedHistory.TRACKED_ID_PROPERTY).value;
            const serializedChange = logEntry.get(SquashedHistory.LOGGED_CHANGE_PROPERTY).value;
            const lastSeq: number = logEntry.get(SquashedHistory.SQUASHED_END_SEQ_PROPERTY).value;
            const changeset = new ChangeSet(JSON.parse(serializedChange));
            ret.push({"trackedContainerId": trackedId,"changeset": changeset, "lastSeq": lastSeq});
        }
        return ret;
    }
    
}