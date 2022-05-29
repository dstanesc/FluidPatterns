import { ChangeSet, SerializedChangeSet } from '@fluid-experimental/property-changeset';

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree, SharedPropertyTreeOptions } from "@fluid-experimental/property-dds";
import { ArrayProperty, BoolProperty, ContainerProperty, Int32ArrayProperty, Int32Property, MapProperty, NodeProperty, PropertyFactory, StringArrayProperty, StringProperty } from "@fluid-experimental/property-properties";
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
    getBufferedAt(trackedId: string, offset: number): ChangeEntry;
    getSeqAt(offset: number): number
    length(): number;
    list(): ChangeEntry[];  
    count(): number; 
    listBuffered(trackedId: string): ChangeEntry[]; 
    countBuffered(trackedId: string); 
    setAutoPersist(isAutopersist: boolean): void;
// poll(consumerGroup);
}


export class TrackedPropertyTree extends SharedPropertyTree {

    
    private static _trackers: Map<string,Tracker[]>=new Map<string,Tracker[]>();
    
    public static readonly TRACKER_INFO_PROP_PATH = "Tracker_DDS"   
    public static readonly PERSIST_POINT_PROP_PATH = "Persist_Point"  
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

    public persistPoint(): void{
        let persistPointProp: Int32Property = this.root.resolvePath(TrackedPropertyTree.PERSIST_POINT_PROP_PATH);
        if(!persistPointProp){
            persistPointProp =  PropertyFactory.create("Int32","single") as Int32Property;
            persistPointProp.setValue(1);
          this.root.insert(TrackedPropertyTree.PERSIST_POINT_PROP_PATH,persistPointProp);
        }
        else {
            let val = persistPointProp.getValue();
            val = val===1?2:1;
            persistPointProp.setValue(val);
        }
        this.commit();        
    }


}


export class SquashedHistory extends SharedPropertyTree implements Tracker{

    public static readonly BUFFER_PROPERTY = "Buffer"
    public static readonly LOG_PROPERTY = "Log"
    public static readonly LAST_SEQUENCE_NR_PROPERTY = "LastSequenceNumber";
    public static readonly BUFFERED_CHANGES_PROPERTY = "BufferedChanges";
    public static readonly BUFFERED_CHANGES_SEQ_PROPERTY = "BufferedChangesSeq";    
    public static readonly TRACKED_ID_PROPERTY = "TrackedId"
    public static readonly SQUASHED_END_SEQ_PROPERTY = "SquashedEndSeq"
    public static readonly LOGGED_CHANGE_PROPERTY = "LoggedChange"
    public static readonly AUTO_PERSIST_PROPERTY = "AutoPersist"

    public constructor(
		id: string,
		runtime: IFluidDataStoreRuntime,
		attributes: IChannelAttributes,
	) {
		super(id, runtime, attributes, {});
	}


    public setAutoPersist(isAutopersist: boolean): void {
        
        const autoPersistProp = this.findOrCreateProp
            (this.root,SquashedHistory.AUTO_PERSIST_PROPERTY,"Bool","single") as BoolProperty;
        autoPersistProp.value=isAutopersist;
        this.commit();
    }

    public isAutoPersist(): boolean {
        let prop = this.root.resolvePath(SquashedHistory.AUTO_PERSIST_PROPERTY);
        if(!prop) return true;
        const autoPersistProp = this.findOrCreateProp
            (this.root,SquashedHistory.AUTO_PERSIST_PROPERTY,"Bool","single") as BoolProperty;
        return autoPersistProp.value;

    }


    public static override getFactory(): SquashedHistoryFactory {
		return new SquashedHistoryFactory();
	}


    public processChanges(trackedTree: TrackedPropertyTree, prunedChanges: IPropertyTreeMessage[]){
        const trackedRemoteChanges = trackedTree.remoteChanges;
        trackedRemoteChanges.forEach((msg)=>console.log(JSON.stringify(msg)));             
        const trackedId = trackedTree.myId;
        const { bufferedChanges, bufferedChangesSeq, lastSeqProp}: 
            { bufferedChanges: StringArrayProperty; bufferedChangesSeq: Int32ArrayProperty; lastSeqProp: Int32Property} 
            = this.findOrCreateBufferProps(trackedId);
        const lastSeq = lastSeqProp.value;
        const newRemoteChanges: IRemotePropertyTreeMessage[] = trackedRemoteChanges
            .map((msg) => (msg as IRemotePropertyTreeMessage))
            .filter((msg) => lastSeq<msg.sequenceNumber);               
        if(newRemoteChanges.length>0) {
            newRemoteChanges.forEach((remoteChange)=>{
                const strChangeSet = JSON.stringify(remoteChange.changeSet);  
                bufferedChanges.push(strChangeSet);
                bufferedChangesSeq.push(remoteChange.sequenceNumber);
            });            
            let newLastSeq = newRemoteChanges[newRemoteChanges.length-1].sequenceNumber;
            lastSeqProp.value=newLastSeq;
            this.persistPoints(trackedId);
            this.commit();                
        }     
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
        if(!logProperty) return undefined;
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

    public count() {
        const logProperty = this.root.resolvePath(SquashedHistory.LOG_PROPERTY) as ArrayProperty;
        if(!logProperty) return undefined;
        return logProperty.length;
    }

    public getBufferedAt(trackedId: any, offset: number): ChangeEntry {
        const { bufferedChanges, bufferedChangesSeq }: 
            { bufferedChanges: StringArrayProperty; bufferedChangesSeq: Int32ArrayProperty;} =
        this.findOrCreateBufferProps(trackedId);
        const changeset = new ChangeSet(JSON.parse(bufferedChanges.get(offset)));
        const seq = bufferedChangesSeq.get(offset);
        return {"trackedContainerId": trackedId,"changeset": changeset, "lastSeq": seq};
    } 

    public countBuffered(trackedId: any) {
        const {bufferedChanges}: { bufferedChanges: StringArrayProperty;}  = this.findOrCreateBufferProps(trackedId);
        return bufferedChanges.getLength();
    }

    public listBuffered(trackedId: any) {
        const { bufferedChanges, bufferedChangesSeq }: 
            { bufferedChanges: StringArrayProperty; bufferedChangesSeq: Int32ArrayProperty;} =
        this.findOrCreateBufferProps(trackedId);
        let index: number = 0;
        return bufferedChanges.getValues().map((v)=>{
            const changeset = new ChangeSet(JSON.parse(v));
            const changeEntry: ChangeEntry = { "trackedContainerId": trackedId, 
            "changeset": changeset, 
            "lastSeq": bufferedChangesSeq.get(index) };
            index++;
            return changeEntry;
        });
    }

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
 
    private hasPersistFlag(msg:IRemotePropertyTreeMessage ): boolean {
        return false;
    }

    private findOrCreateLastSeqProp(entry: MapProperty) : Int32Property{
        let lastSeqProp = (entry.get(SquashedHistory.LAST_SEQUENCE_NR_PROPERTY) as Int32Property);
        if(!lastSeqProp){            
            lastSeqProp=this.findOrCreateProp(entry,SquashedHistory.LAST_SEQUENCE_NR_PROPERTY,"Int32","single") as Int32Property;
        }
        return lastSeqProp;
    }

    private isPersistPoint(strChangeSet: string, isLast: boolean): boolean{
        const changeSet: SerializedChangeSet = JSON.parse(strChangeSet);
        let op = changeSet.insert;
        if(!op){
            op = changeSet.modify;
        }
        if(op){
            if(op.Int32 && op.Int32[TrackedPropertyTree.PERSIST_POINT_PROP_PATH]){
                return true;
            }
        }
        if(isLast && this.isAutoPersist()){
            return true;
        }
        return false;
    }

    private persistPoints(trackedId): void {
        const { bufferedChanges, bufferedChangesSeq }: 
            { bufferedChanges: StringArrayProperty; bufferedChangesSeq: Int32ArrayProperty;} 
            = this.findOrCreateBufferProps(trackedId);
        let changesToSquash: string[] = [];
        let seqToSquash : number[] = [];
        for(let i=0;i<bufferedChanges.length;i++){
            const bufferedChange = bufferedChanges.get(i);
            changesToSquash.push(bufferedChange);
            seqToSquash.push(bufferedChangesSeq.get(i));
            if(this.isPersistPoint(bufferedChange,i===bufferedChanges.length-1)){
                const chageSets: ChangeSet[] = changesToSquash.map((strChange) => JSON.parse(strChange));
                const squashedChangeSet: ChangeSet = this.squashChanges(chageSets);
                const strChangeSet = JSON.stringify(squashedChangeSet.getSerializedChangeSet());            
                const logProperty: ArrayProperty=
                    this.findOrCreateProp(this.root,SquashedHistory.LOG_PROPERTY,"BaseProperty","array") as ArrayProperty;               
                const logEntry = PropertyFactory.create("BaseProperty","map") as MapProperty;
                logProperty.push(logEntry);            
                const squashedEndSeqProp = this.findOrCreateProp(logEntry,SquashedHistory.SQUASHED_END_SEQ_PROPERTY,"Int32","single");
                squashedEndSeqProp.value =bufferedChangesSeq.get(i) ;
                const trackedIdProp = this.findOrCreateProp(logEntry,SquashedHistory.TRACKED_ID_PROPERTY,"String","single");
                trackedIdProp.value = trackedId;
                const loggedChangeProp = this.findOrCreateProp(logEntry,SquashedHistory.LOGGED_CHANGE_PROPERTY,"String","single");
                loggedChangeProp.value=strChangeSet;
                changesToSquash=[];
                seqToSquash=[];
            }
        }
        if(changesToSquash.length<bufferedChanges.length){
            bufferedChanges.clear();
            changesToSquash.forEach((change)=>bufferedChanges.push(change));
            bufferedChangesSeq.clear();
            seqToSquash.forEach((seq)=>bufferedChangesSeq.push(seq));
        }

    }

    private findOrCreateBufferProps(trackedId: any) {
        const buffer: MapProperty = this.findOrCreateProp
            (this.root, SquashedHistory.BUFFER_PROPERTY, "BaseProperty", "map") as MapProperty;
        const entry: MapProperty = this.findOrCreateProp
            (buffer, trackedId, "BaseProperty", "map") as MapProperty;
        const bufferedChanges: StringArrayProperty = this.findOrCreateProp
            (entry, SquashedHistory.BUFFERED_CHANGES_PROPERTY, "String", "array") as StringArrayProperty;
        const bufferedChangesSeq: Int32ArrayProperty = this.findOrCreateProp
            (entry, SquashedHistory.BUFFERED_CHANGES_SEQ_PROPERTY, "Int32", "array") as Int32ArrayProperty;
        const  lastSeqProp = this.findOrCreateLastSeqProp(entry);
        return { bufferedChanges, bufferedChangesSeq, lastSeqProp, entry, buffer, };
    }


    private readLogEntry(offset: number) {
        const logProperty = this.root.resolvePath(SquashedHistory.LOG_PROPERTY) as ArrayProperty;   
        if(logProperty)   {
            const logEntry = logProperty.get(offset); 
            return logEntry as MapProperty;
        }   
        else {
            return undefined;
        }      
    }



    
}