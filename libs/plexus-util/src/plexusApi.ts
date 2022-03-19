import { Workspace } from "@dstanesc/fluid-util";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { PlexusListener, PlexusListeners, RegistryListener } from "./plexusListeners";
import { PlexusController } from "./plexusController";
import { PlexusBinding } from "./plexusBinding";
import { v4 as uuidv4 } from 'uuid';

export enum Topics {
    REGISTRY_LOG = "registryLog",
    OPERATION_LOG = "operationLog",
    QUERY_LOG = "queryLog",
    QUERY_RESULT_LOG = "queryResultLog",
}

export function retrieveArrayProperty(workspace: Workspace, topic: string): ArrayProperty {
    const topicArrayProperty: ArrayProperty = workspace.rootProperty.resolvePath(`${topic}.data`)! as ArrayProperty
    return topicArrayProperty;
}

export function retrieveNestedTextProperty(arrayProperty: ArrayProperty, index: number): StringProperty {
    const nestedProperty = arrayProperty.get(index) as NamedProperty;
    const nestedTextProperty: StringProperty = nestedProperty.get("text") as StringProperty;
    return nestedTextProperty;
}

export function dispatchNestedTextProperty(workspace: Workspace, topic: string, callback: PlexusListener) {
    if (callback) {
        const arrayProperty: ArrayProperty = retrieveArrayProperty(workspace, topic);
        for (let i = 0; i < arrayProperty.length; i++) {
            const textProperty: StringProperty = retrieveNestedTextProperty(arrayProperty, i);
            callback(textArray => [...textArray, textProperty.getValue()]);
        }
    }
}

export function createStringProperty(text: string): StringProperty {
    const stringProperty = PropertyFactory.create<StringProperty>("String", undefined, text);
    return stringProperty;
}

export function createQueryProperty(text: string): NamedProperty {
    const uid = uuidv4();
    const queryProperty = PropertyFactory.create<NamedProperty>("hex:query-1.0.0", undefined, { "id": uid, "text": text });
    return queryProperty;
}

export function createQueryResultProperty(text: string): NamedProperty {
    const uid = uuidv4();
    const queryResultProperty = PropertyFactory.create<NamedProperty>("hex:queryResult-1.0.0", undefined, { "id": uid, "text": text });
    return queryResultProperty;
}

export function createQueryArrayProperty(): NamedNodeProperty {
    const queryArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:queryArray-1.0.0");
    return queryArrayProperty;
}

export function createQueryResultArrayProperty(): NamedNodeProperty {
    const queryResultArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:queryResultArray-1.0.0");
    return queryResultArrayProperty;
}

export function createStringArrayProperty(): NamedNodeProperty {
    const stringArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:stringArray-1.0.0");
    return stringArrayProperty;
}

export function initPropertyTree(containerId: string | undefined, workspace: Workspace, plexusListeners: PlexusListeners) {
    if (containerId === undefined) {
        const registryArray: NamedNodeProperty = createStringArrayProperty();
        const operationArray: NamedNodeProperty = createStringArrayProperty();
        const queryArray: NamedNodeProperty = createQueryArrayProperty();
        const queryResultArray: NamedNodeProperty = createQueryResultArrayProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert(Topics.REGISTRY_LOG, registryArray);
        rootProp.insert(Topics.OPERATION_LOG, operationArray);
        rootProp.insert(Topics.QUERY_LOG, queryArray);
        rootProp.insert(Topics.QUERY_RESULT_LOG, queryResultArray);
        workspace.commit();
    } else {
        dispatchNestedTextProperty(workspace, Topics.REGISTRY_LOG, plexusListeners.registryListener);
        dispatchNestedTextProperty(workspace, Topics.OPERATION_LOG, plexusListeners.operationLogListener);
        dispatchNestedTextProperty(workspace, Topics.QUERY_LOG, plexusListeners.queryListener);
        dispatchNestedTextProperty(workspace, Topics.QUERY_RESULT_LOG, plexusListeners.queryResultListener);
    }
}

export function configureBinding(dataBinder: DataBinder, workspace: Workspace, listener: PlexusListener, arrayTypeId: string, bindingType: string) {
    dataBinder.defineRepresentation(bindingType, arrayTypeId, (property) => {
        return new PlexusController(listener);
    });
    dataBinder.defineDataBinding(bindingType, arrayTypeId, PlexusBinding, {
        upgradeType: UpgradeType.MINOR
    });
    dataBinder.activateDataBinding(bindingType);
}