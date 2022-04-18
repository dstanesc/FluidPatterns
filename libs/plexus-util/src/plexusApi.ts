import { SimpleWorkspace } from "@dstanesc/fluid-util2";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty, MapProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { PlexusListener, PlexusListeners, PlexusModel, RegistryListener } from "./plexusListeners";
import { PlexusMapController } from "./plexusController";
import { PlexusBinding } from "./plexusBinding";
import { v4 as uuidv4 } from 'uuid';
import { SerializedChangeSet } from "@fluid-experimental/property-changeset";
import axios from "axios";


export interface QueryResult {
    index: number;
    score: number;
    containerId: string;
    commentId: string;
    sequenceNumber: number;
    commentText: string
    
}

export enum Topics {
    REGISTRY_LOG = "registryLog",
    QUERY_LOG = "queryLog",
    QUERY_RESULT_LOG = "queryResultLog",
}

export async function checkPlexusNameservice(plexusService: string){

    try {
      console.log(`Check plexus container available for ${plexusService}`);
      const resp = await axios.get(`http://localhost:3030/${plexusService}`);
      console.log(`${resp.data}`);
      return resp.data;
    } catch (err) {
      // Handle Error Here
      //console.error(err);
      console.log(`Plexus container NOT available`);
      return undefined;
    }
  }
  
  export async function updatePlexusNameservice(plexusService: string, containerId: string){
    try {
      const resp = await axios.put(`http://localhost:3030/${plexusService}/id/${containerId}`);
      console.log(`${resp.data}`);
      return resp.data;
    } catch (err) {
      // Handle Error Here
      console.error(err);
      return undefined;
    }
  }


export function retrieveMapProperty(workspace: SimpleWorkspace, topic: string): MapProperty {
    const topicMapProperty: MapProperty = workspace.rootProperty.resolvePath(`${topic}.data`)! as MapProperty
    return topicMapProperty;
}


export function retrieveMappedTextProperty(mapProperty: MapProperty, key: string): StringProperty {
    const nestedProperty = mapProperty.getValue(key) as NamedProperty;
    const nestedTextProperty: StringProperty = nestedProperty.get("text") as StringProperty;
    return nestedTextProperty;
}

export function retrieveMappedIdProperty(mapProperty: MapProperty, key: string): StringProperty {
    const nestedProperty = mapProperty.getValue(key) as NamedProperty;
    const nestedIdProperty: StringProperty = nestedProperty.get("id") as StringProperty;
    return nestedIdProperty;
}

export function dispatchNestedTextProperty(workspace: SimpleWorkspace, topic: string, callback: PlexusListener) {
    if (callback) {
        const mapProperty: MapProperty = retrieveMapProperty(workspace, topic);
        const keys: string[] = mapProperty.getIds();
        mapProperty.getIds().forEach(key => {
            const nestedProperty = mapProperty.get(key) as NamedProperty;
            const nestedTextProperty: StringProperty = nestedProperty.get("text") as StringProperty;
            const nestedIdProperty: StringProperty = nestedProperty.get("id") as StringProperty;
            const id = nestedIdProperty.getValue();
            const text = nestedTextProperty.getValue();
            const plexusModel = {"key":id, "id": id, "text": text };
            callback(plexusModelMap => { 
                const resultMap = new Map<string, PlexusModel>(plexusModelMap); 
                resultMap.set(id, plexusModel); 
                return {"operationType": "insert", "result" :resultMap, "increment": plexusModel};; 
            });
        });
    }
}

export function createInt32Property(value: number): Int32Property {
    const stringProperty = PropertyFactory.create<Int32Property>("Int32", undefined, value);
    return stringProperty;
}

export function createStringProperty(text: string): StringProperty {
    const stringProperty = PropertyFactory.create<StringProperty>("String", undefined, text);
    return stringProperty;
}

export function createContainerProperty(uid: String): NamedProperty {
    const containerProperty = PropertyFactory.create<NamedProperty>("hex:container-1.0.0", undefined, { "id": uid, "text": uid });
    return containerProperty;
}

export function createQueryProperty(text: string): NamedProperty {
    const uid = uuidv4();
    const queryProperty = PropertyFactory.create<NamedProperty>("hex:query-1.0.0", undefined, { "id": uid, "text": text });
    return queryProperty;
}

export function appendQueryProperty(text: string, queryLog: MapProperty): string {
    const uid = uuidv4();
    const queryProperty = PropertyFactory.create<NamedProperty>("hex:query-1.0.0", undefined, { "id": uid, "text": text });
    queryLog.set(uid, queryProperty);
    return uid;
}

export function createQueryResultProperty(uid: string, text: string): NamedProperty {
    const queryResultProperty = PropertyFactory.create<NamedProperty>("hex:queryResult-1.0.0", undefined, { "id": uid, "text": text });
    return queryResultProperty;
}

export function appendQueryResultProperty(queryId: string, text: string, queryResultLog: MapProperty): string {
    const uid = uuidv4();
    const queryResultProperty = PropertyFactory.create<NamedProperty>("hex:queryResult-1.0.0", undefined, { "id": queryId, "text": text });
    queryResultLog.set(uid, queryResultProperty);
    return uid;
}

export function createContainerMapProperty(): NamedNodeProperty {
    const containerArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:containerMap-1.0.0");
    return containerArrayProperty;
}


export function createQueryMapProperty(): NamedNodeProperty {
    const queryMapProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:queryMap-1.0.0");
    return queryMapProperty;
}

export function createQueryResultMapProperty(): NamedNodeProperty {
    const queryResultMapProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:queryResultMap-1.0.0");
    return queryResultMapProperty;
}

export function createStringArrayProperty(): NamedNodeProperty {
    const stringArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:stringArray-1.0.0");
    return stringArrayProperty;
}

export function createInt32ArrayProperty(): NamedNodeProperty {
    const offsetArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:int32Array-1.0.0");
    return offsetArrayProperty;
}

export function initPropertyTree(containerId: string | undefined, workspace: SimpleWorkspace, plexusListeners: PlexusListeners) {
    if (containerId === undefined) {
        const registryArray: NamedNodeProperty = createContainerMapProperty();
        const queryArray: NamedNodeProperty = createQueryMapProperty();
        const queryResultArray: NamedNodeProperty = createQueryResultMapProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert(Topics.REGISTRY_LOG, registryArray);
        rootProp.insert(Topics.QUERY_LOG, queryArray);
        rootProp.insert(Topics.QUERY_RESULT_LOG, queryResultArray);
        workspace.commit();
    } else {
        dispatchNestedTextProperty(workspace, Topics.REGISTRY_LOG, plexusListeners.registryListener);
        dispatchNestedTextProperty(workspace, Topics.QUERY_LOG, plexusListeners.queryListener);
        dispatchNestedTextProperty(workspace, Topics.QUERY_RESULT_LOG, plexusListeners.queryResultListener);
    }
}

export function configureBinding(dataBinder: DataBinder, workspace: SimpleWorkspace, listener: PlexusListener, arrayTypeId: string, bindingType: string) {
    dataBinder.defineRepresentation(bindingType, arrayTypeId, (property) => {
        return new PlexusMapController(listener);
    });
    dataBinder.defineDataBinding(bindingType, arrayTypeId, PlexusBinding, {
        upgradeType: UpgradeType.MINOR
    });
    dataBinder.activateDataBinding(bindingType);
}