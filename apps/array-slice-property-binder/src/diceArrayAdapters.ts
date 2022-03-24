import { DataBinderHandle } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { DiceArrayChange } from "./diceArrayChange";
import { DiceArrayController } from "./diceArrayController";

export class DiceArrayChangeAdapter {

    _diceArrayController: DiceArrayController;

    constructor(diceArrayController: DiceArrayController) {
        this._diceArrayController = diceArrayController;
    }

    public diceInsert(key: string, context: ModificationContext) {
        this.diceUpdate(key, context);
    }

    public diceRemove(key: string, context: ModificationContext) {
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        const diceIndex: number = parseInt(relativePath[2]);
        const change: DiceArrayChange = new DiceArrayChange(operationType, diceIndex, 0);
        this._diceArrayController.updateValue(change);
    }

    public diceUpdate(key: string, context: ModificationContext) {
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
                this._diceArrayController.updateValue(change);
            }
        }
    }
}


export class DiceArraySliceChangeAdapter {

    _diceArrayController: DiceArrayController;

    constructor(diceArrayController: DiceArrayController) {
        this._diceArrayController = diceArrayController;
    }

    public diceModify(context: ModificationContext) {
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
            const diceIndex: number = parseInt(relativePath[2]);
            if (changeSet.Int32) {
                const diceValue: number = changeSet.Int32.diceValue;
                const change: DiceArrayChange = new DiceArrayChange("modify", diceIndex, diceValue);
                this._diceArrayController.updateValue(change);
            }
        }
    }
}

export class DiceArrayBinderHandle {

     _dataBinderHandles: DataBinderHandle[];

     constructor(dataBinderHandles: DataBinderHandle[]) {
        this._dataBinderHandles = dataBinderHandles;
    }

    public destroy() {
        this._dataBinderHandles.forEach(handle=>handle.destroy());
    }
}