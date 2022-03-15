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
            const diceIndex: string = relativePath[0];
            if (changeSet.String) {
                const publishedAt: number = parseInt(changeSet.String.publishedAt);
                const receivedAt: number = Date.now();
                this._diceController.insertValue(diceIndex, publishedAt, receivedAt);
            }
        }
    }

    public diceModify(context: ModificationContext) {
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            const relativePath = context.getRelativeTokenizedPath();
            console.log(`Relative path ${relativePath}`);
            console.log(JSON.stringify(changeSet, null, 2));
            const diceIndex: string = relativePath[0];
            if (changeSet.String) {
                const publishedAt: number = parseInt(changeSet.String.publishedAt);
                const receivedAt: number = Date.now();
                this._diceController.updateValue(diceIndex, publishedAt, receivedAt);
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