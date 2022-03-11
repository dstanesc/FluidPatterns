import { DataBinderHandle } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { DiceController } from "./diceController";


export class DiceAdapter {

    _diceController: DiceController;

    constructor(diceArrayController: DiceController) {
        this._diceController = diceArrayController;
    }

    public diceInsert(context: ModificationContext) {
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            const relativePath = context.getRelativeTokenizedPath();
            console.log(`Relative path ${relativePath}`);
            console.log(JSON.stringify(changeSet, null, 2));
            // {
            //     "Int32": {
            //       "diceValue": 26
            //     },
            //     "typeid": "hex:dice-1.0.0"
            //   }
            
            const diceIndex: string = relativePath[0];
           
            if (changeSet.Int32) {
                const diceValue: number = changeSet.Int32.diceValue;
                this._diceController.insertValue(diceIndex, diceValue);
            }
        }
    }

    public diceModify(context: ModificationContext) {
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            const relativePath = context.getRelativeTokenizedPath();
            console.log(`Relative path ${relativePath}`);
            console.log(JSON.stringify(changeSet, null, 2));
            // {
            //     "Int32": {
            //       "diceValue": 26
            //     },
            //     "typeid": "hex:dice-1.0.0"
            //   }
            const diceIndex: string = relativePath[0];
            console.log(`Relative path ${relativePath}`);
            if (changeSet.Int32) {
                const diceValue: number = changeSet.Int32.diceValue;
                this._diceController.updateValue(diceIndex, diceValue);
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