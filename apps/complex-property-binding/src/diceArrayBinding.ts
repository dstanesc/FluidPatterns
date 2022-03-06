import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { DiceArrayController } from "./diceArrayController";
import { DiceArrayChange } from "./diceArrayChange";

export class DiceArrayBinding extends DataBinding {

    private updateDiceArray(key: string, context: ModificationContext) {

        const diceArrayController: DiceArrayController | undefined = this.getRepresentation<DiceArrayController>();

        if (context) {
            console.log(`Key is ${key}`);
            console.log("Relative path " + context.getRelativeTokenizedPath());
            console.log("Abs path " + context.getAbsolutePath());

            // Undefined in case of  remote modifications
            if (context.getNestedChangeSet()) {
                console.log("Nested changeset " + context.getNestedChangeSet());
                console.log(JSON.stringify(context.getNestedChangeSet(), null, 2));
                
                // {
                //     "Int32": {
                //         "diceValue": 64
                //     },
                //     "String": {
                //         "guid": "d6fba631-a051-e9bd-68e4-eb84391e0039"
                //     },
                //     "typeid": "hex:dice-1.0.0"
                // }
                const diceIndex: number = parseInt(key);
                const changeSet = context.getNestedChangeSet();
                if (changeSet.Int32) {
                    const diceValue: number = changeSet.Int32.diceValue;
                    const operationType: Utils.OperationType = context.getOperationType()!;
                    const change: DiceArrayChange = new DiceArrayChange(operationType, diceIndex, diceValue);
                    diceArrayController?.updateValue(change);
                }
            }
        }
    }

    static initialize() {
        this.registerOnPath("dices", ["collectionInsert"], this.prototype.updateDiceArray, {isDeferred: true});
        this.registerOnPath("dices", ["collectionModify"], this.prototype.updateDiceArray, {isDeferred: true});
    }
}

DiceArrayBinding.initialize();