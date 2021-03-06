import { DataBinder, DataBinderHandle } from "@fluid-experimental/property-binder";
import { Int32Property, NamedProperty, NodeProperty, PropertyFactory, StringProperty } from "@fluid-experimental/property-properties";
import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import { DiceAdapter, DiceArrayBinderHandle } from "./diceAdapter";
import { DiceBinding } from "./diceBinding";
import { DiceAdapterController, DiceBindingController } from "./diceController";
import { StatRenderer, PropCountRenderer } from "./renderers";

import schema from "./dice-1.0.0";

export async function initWorkspace2(containerId: string, binderSetter: Function, workspaceSetter: Function, locationSetter: Function): Promise<BoundWorkspace> {

    // Register the templates
    registerSchema(schema);

    const boundWorkspacePromise = initializeBoundWorkspace(containerId);
    // Initialize the workspace
    return boundWorkspacePromise.then(

        boundWorkspace => {
            const myWorkspace: Workspace = boundWorkspace.workspace;

            // Update location
            if (myWorkspace.containerId)
                locationSetter(myWorkspace.containerId);

            const dataBinder: DataBinder = boundWorkspace.dataBinder;

            binderSetter(dataBinder);

            // save workspace to react state
            workspaceSetter(myWorkspace);

            return boundWorkspace
        }
    );
}


export async function initWorkspace(containerId: string, binderSetter: Function, workspaceSetter: Function, locationSetter: Function): Promise<Workspace> {

    // Register the templates
    registerSchema(schema);


    // Initialize the workspace
    const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

    const myWorkspace: Workspace = boundWorkspace.workspace;

    // Update location
    if (myWorkspace.containerId)
        locationSetter(myWorkspace.containerId);

    const dataBinder: DataBinder = boundWorkspace.dataBinder;

    binderSetter(dataBinder);

    // save workspace to react state
    workspaceSetter(myWorkspace);

    return new Promise<Workspace>((resolve, reject) => {
        resolve(myWorkspace);
    });
}

export function removeAll(workspace: Workspace) {
    const rootProp: NodeProperty = workspace.rootProperty;
    const keys: string[] = rootProp.getDynamicIds();
    removeMany(keys, workspace);
}

export function removeMany(keys: string[], workspace: Workspace) {
    keys.forEach(key => removeSingle(key, workspace));
}

export function removeSingle(key: string, workspace: Workspace) {
    console.log(`Removing dyn key: ${key}`)
    const rootProp: NodeProperty = workspace.rootProperty;
    rootProp.remove(key);
    workspace.commit();
}

export function rollManyTimes(times: number, workspace: Workspace) {
    for (let i = 0; i < times; i++) {
        rollAll(i, workspace);
    }
}

export function rollAll(rollIndex: number, workspace: Workspace) {
    const rootProp: NodeProperty = workspace.rootProperty;
    const keys: string[] = rootProp.getDynamicIds();
    rollMany(rollIndex, keys, workspace);
}

export function rollMany(rollIndex: number, keys: string[], workspace: Workspace) {
    keys.forEach(key => rollSingle(rollIndex, key, workspace));
}

export function rollSingle(rollIndex: number, key: string, workspace: Workspace) {
    const rootProp: NodeProperty = workspace.rootProperty;
    const newValue = Math.floor(Math.random() * 1024) + 1;
    const diceProperty = rootProp.get(key) as NamedProperty;
    // Setting values one by one
    // const diceValueProperty: Int32Property = diceProperty.get("diceValue") as Int32Property;
    // diceValueProperty.setValue(newValue);
    // const diceTimestampProperty: StringProperty = diceProperty.get("publishedAt") as StringProperty;
    // const publishedAt = Date.now().toString();
    // diceTimestampProperty.setValue(publishedAt);
    const publishedAt = Date.now().toString();
    console.log(`Publishing new dice value: ${key} : ${newValue}, publishedAt: ${publishedAt}`)
    // Setting all values at once would avoid binding updates for each individual .setValue
    diceProperty.setValues({ "diceValue": rollIndex, "publishedAt": publishedAt });
    workspace.commit();
}


export function createDicePropertiesSynch(propCount: number, workspace: Workspace){
    const diceProperties: NamedProperty[] = [];
    for (let i = 0; i < propCount; i++) {
        console.log(`Creating dice : ${i}`)
        const diceProperty: NamedProperty = createDiceProperty(i.toString(), workspace)
        diceProperties.push(diceProperty);
    }
}

export async function createDiceProperties(propCount: number, workspace: Workspace): Promise<NamedProperty[]> {
    const diceProperties: NamedProperty[] = [];
    for (let i = 0; i < propCount; i++) {
        console.log(`Creating dice : ${i}`)
        const diceProperty: NamedProperty = createDiceProperty(i.toString(), workspace)
        diceProperties.push(diceProperty);
    }
    return new Promise<NamedProperty[]>((resolve, reject) => {
        resolve(diceProperties);
    });
}


export function createDiceProperty(key: string, workspace: Workspace): NamedProperty {
    const rootProp: NodeProperty = workspace.rootProperty;
    const diceProperty: NamedProperty = PropertyFactory.create("hex:dice-1.0.0", undefined, { "diceValue": "0", "publishedAt": "0"});
    rootProp.insert(key, diceProperty);
    workspace.commit();
    return diceProperty;
}

export function unregisterTypeBinding(dataBinder: DataBinder) {

    dataBinder.unregisterDataBindings("view", true);
}

export function configureTypeBinding(fluidBinder: DataBinder, workspace: Workspace, statRenderer: StatRenderer, propCountRenderer: PropCountRenderer) {

    fluidBinder.defineRepresentation("view", "hex:dice-1.0.0", (property) => {
        return new DiceAdapterController(statRenderer, propCountRenderer);
    });

    fluidBinder.defineDataBinding("view", "hex:dice-1.0.0", DiceBinding);

    fluidBinder.activateDataBinding("view");
}

export function configurePathBinding(dataBinder: DataBinder, workspace: Workspace, diceController: DiceAdapterController) {
    const rootProp: NodeProperty = workspace.rootProperty;
    const adapter: DiceAdapter = new DiceAdapter(diceController);
    const handles: DataBinderHandle[] = [];
    const keys: string[] = rootProp.getDynamicIds();
    handles.push(dataBinder.registerOnPath("", ["collectionInsert"], adapter.diceModify.bind(adapter), { isDeferred: true }));
    keys.forEach(key => {
        const path = `${key}`;
        //console.log(`registerOnPath: ${path}`)
        handles.push(dataBinder.registerOnPath(path, ["modify"], adapter.diceModify.bind(adapter), { isDeferred: true }));
    });
    return new DiceArrayBinderHandle(handles);
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}