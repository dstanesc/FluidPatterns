import { DataBinding } from "@fluid-experimental/property-binder";
import { DiceArrayController } from "./diceArrayController";
import { DiceArrayChange } from "./diceArrayChange";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { Utils } from "@fluid-experimental/property-changeset";
import _ from "lodash";

export class DiceArraySliceBinding extends DataBinding {

    private diceUpdate(context: ModificationContext) {
        this.performModificationInternal(context);
    }

    private performModificationInternal(context: ModificationContext) {
        const diceArrayController: DiceArrayController | undefined = this.getRepresentation<DiceArrayController>();
        //const operationType: Utils.OperationType = context.getOperationType()!;
       // const diceIndex: number = parseInt(key);
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            console.log(JSON.stringify(changeSet, null, 2));
            // {
            //     "Int32": {
            //       "diceValue": 26
            //     },
            //     "typeid": "hex:dice-1.0.0"
            //   }
            const relativePath = context.getRelativeTokenizedPath();
            const diceIndex: number = parseInt(relativePath[1]);
            if (changeSet.Int32) {
                const diceValue: number = changeSet.Int32.diceValue;
                const change: DiceArrayChange = new DiceArrayChange("modify", diceIndex, diceValue);
                diceArrayController?.updateValue(change);
            }
        }
    }

    /*
     * This is were we probably the experiment stretches the 
     * design intent by registering dynamic paths the static way.
     */
    static initialize(start: number, end: number) {
        const range: number[] = _.range(start, end, 1);
        const paths = range.map(pos => `dices[${pos}]`);
        paths.forEach(path => this.registerOnPath(path, ["modify"], this.prototype.diceUpdate, { isDeferred: false }))
    }
}