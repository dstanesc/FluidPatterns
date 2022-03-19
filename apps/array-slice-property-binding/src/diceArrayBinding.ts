import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { RemovalContext } from "@fluid-experimental/property-binder/dist/data_binder/removalContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { DiceArrayController } from "./diceArrayController";
import { DiceArrayChange } from "./diceArrayChange";

export class DiceArrayBinding extends DataBinding {

    private diceInsert(key: string, context: ModificationContext) {
        this.performModificationInternal(key, context);
    }

    private diceUpdate(key: string, context: ModificationContext) {
        this.performModificationInternal(key, context);
    }

    private diceRemove(key: string, context: ModificationContext) {
        const diceArrayController: DiceArrayController | undefined = this.getRepresentation<DiceArrayController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        const diceIndex: number = parseInt(relativePath[1]);
        const change: DiceArrayChange = new DiceArrayChange(operationType, diceIndex, 0);
        diceArrayController.updateValue(change);
    }

    private performModificationInternal(key: string, context: ModificationContext) {
        const diceArrayController: DiceArrayController | undefined = this.getRepresentation<DiceArrayController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const diceIndex: number = parseInt(key);
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            // {
            //     "Int32": {
            //         "diceValue": 64
            //     },
            //     "String": {
            //         "guid": "d6fba631-a051-e9bd-68e4-eb84391e0039"
            //     },
            //     "typeid": "hex:dice-1.0.0"
            // }
            if (changeSet.Int32) {
                const diceValue: number = changeSet.Int32.diceValue;
                const change: DiceArrayChange = new DiceArrayChange(operationType, diceIndex, diceValue);
                diceArrayController.updateValue(change);
            }
        }
    }

    static initialize() {
        this.registerOnPath("dices", ["collectionInsert"], this.prototype.diceInsert, { isDeferred: true });
        this.registerOnPath("dices", ["collectionModify"], this.prototype.diceUpdate, { isDeferred: true });
        this.registerOnPath("dices", ["collectionRemove"], this.prototype.diceRemove, { isDeferred: true });
    }
}

DiceArrayBinding.initialize();