import { Workspace } from "@dstanesc/fluid-util";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { DiceArrayViewModel } from "./diceArrayViewModel";
import { DiceArrayController } from "./diceArrayController";
import { DiceArrayBinding } from "./diceArrayBinding";

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

export function initPropertyTree(containerId: string | undefined, workspace: Workspace, diceArrayViewModel: DiceArrayViewModel) {
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

export function configureBinding(dataBinder: DataBinder, workspace: Workspace, diceArrayRenderer: DiceArrayViewModel) {
    dataBinder.defineRepresentation("view", "hex:diceArray-1.0.0", (property) => {
        return new DiceArrayController(diceArrayRenderer);
    });
    dataBinder.defineDataBinding("view", "hex:diceArray-1.0.0", DiceArrayBinding, {
        upgradeType: UpgradeType.MINOR
    });
    dataBinder.activateDataBinding("view");
}