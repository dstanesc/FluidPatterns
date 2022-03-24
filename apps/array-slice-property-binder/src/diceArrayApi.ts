import { Workspace } from "@dstanesc/fluid-util";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, DataBinderHandle, UpgradeType } from "@fluid-experimental/property-binder";
import { DiceArrayDisplay } from "./diceArrayDisplay";
import { DiceArrayController } from "./diceArrayController";
import _ from "lodash";
import { DiceArrayBinderHandle, DiceArrayChangeAdapter, DiceArraySliceChangeAdapter } from "./diceArrayAdapters";
// {
//     typeid: "hex:diceArray-1.0.0",
//     inherits: "NamedNodeProperty",
//     properties: [
//         { id: "dices", typeid: "hex:dice-1.0.0", context: "array" },
//     ],
// };

// {
//     typeid: "hex:dice-1.0.0",
//     inherits: "NamedProperty",
//     properties: [
//         { id: "diceValue", typeid: "Int32" }
//     ],
// };



export function retrieveArrayProperty(workspace: Workspace): ArrayProperty {
    const diceArrayProperty: ArrayProperty = workspace.rootProperty.resolvePath("diceArray.dices")! as ArrayProperty
    return diceArrayProperty;
}

export function retrieveValueProperty(arrayProperty: ArrayProperty, index: number): Int32Property {
    const diceProperty = arrayProperty.get(index) as NamedProperty;
    const diceValueProperty: Int32Property = diceProperty.get("diceValue") as Int32Property;
    return diceValueProperty;
}

export function createDiceProperty(diceValue: number): NamedProperty {
    const diceProperty = PropertyFactory.create<NamedProperty>("hex:dice-1.0.0", undefined, { "diceValue": diceValue });
    return diceProperty;
}

export function createDiceArrayProperty(): NamedNodeProperty {
    const diceArrayProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:diceArray-1.0.0");
    return diceArrayProperty;
}

export function initPropertyTree(containerId: string | undefined, workspace: Workspace, diceArrayViewModel: DiceArrayDisplay) {
    if (containerId === undefined) {
        const diceArray: NamedNodeProperty = createDiceArrayProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert("diceArray", diceArray);
        workspace.commit();
    } else {
        const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
        for (let i = 0; i < diceArrayProperty.length; i++) {
            const diceValueProperty: Int32Property = retrieveValueProperty(diceArrayProperty, i);
            diceArrayViewModel(diceValues => [...diceValues, diceValueProperty.getValue()]);
        }
    }
}

export function activateSlice(dataBinder: DataBinder, diceArrayController: DiceArrayController, start: number, end: number): DiceArrayBinderHandle {
    const range: number[] = _.range(start, end, 1);
    const paths = range.map(pos => `diceArray.dices[${pos}]`);
    const adapter: DiceArraySliceChangeAdapter = new DiceArraySliceChangeAdapter(diceArrayController);
    const handles: DataBinderHandle[] = [];
    paths.forEach(path => { 
        const dataBinderHandle: DataBinderHandle = dataBinder.registerOnPath(path, ["modify"], adapter.diceModify.bind(adapter), { isDeferred: false }); 
        handles.push(dataBinderHandle); 
    });
    return new DiceArrayBinderHandle(handles);
}


export function activateView(dataBinder: DataBinder, diceArrayController: DiceArrayController) : DiceArrayBinderHandle {
    const adapter: DiceArrayChangeAdapter = new DiceArrayChangeAdapter(diceArrayController);
    const handles: DataBinderHandle[] = [];
    handles.push(dataBinder.registerOnPath("diceArray.dices", ["collectionInsert"], adapter.diceInsert.bind(adapter), { isDeferred: true }));
    handles.push(dataBinder.registerOnPath("diceArray.dices", ["collectionModify"], adapter.diceUpdate.bind(adapter), { isDeferred: true }));
    handles.push(dataBinder.registerOnPath("diceArray.dices", ["collectionRemove"], adapter.diceRemove.bind(adapter), { isDeferred: true }));
    return new DiceArrayBinderHandle(handles);
}

