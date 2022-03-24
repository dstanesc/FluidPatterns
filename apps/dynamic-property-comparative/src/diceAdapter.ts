import { DataBinderHandle } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { DiceBindingController } from "./diceController";


export class DiceAdapter {

    _diceController: DiceBindingController;

    _rolls: Map<string, number>;

    constructor(diceArrayController: DiceBindingController) {
        this._diceController = diceArrayController;
        this._rolls = new Map();
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
                this._diceController.insertValue(diceIndex, -1, publishedAt, receivedAt);
                console.log(`DiceAdapter#updateValue ${receivedAt-publishedAt}`);
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
                const rollIndex: number = this._rolls.get(diceIndex);
                this._diceController.updateValue(diceIndex, rollIndex, publishedAt, receivedAt);
            }

            if(changeSet.Int32){
                const rollIndex = changeSet.Int32.diceValue;
                this._rolls.set(diceIndex, rollIndex)
                this._diceController.updateValue(diceIndex, rollIndex, -1, -1);
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