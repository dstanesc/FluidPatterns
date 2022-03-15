import { DataBinding } from "@fluid-experimental/property-binder";
import { DataBindingParams } from "@fluid-experimental/property-binder/dist/data_binder/dataBinding";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { Int32Property, NamedProperty, StringProperty } from "@fluid-experimental/property-properties";
import { DiceAdapterController, DiceBindingController } from "./diceController";

export class DiceBinding extends DataBinding {

    // private insertDice(diceProperty: NamedProperty) {
    //     console.log("DiceBinding#insertDice" + JSON.stringify(diceProperty.serialize(), null, 2));
    //     const controller = this.getRepresentation<DiceBindingController>();
    //     const id = diceProperty.getId();
    //     const rollIndexProperty: StringProperty = diceProperty.get("diceValue") as StringProperty;
    //     const rollIndex = parseInt(rollIndexProperty.getValue());
    //     const publishedAtProperty: StringProperty = diceProperty.get("publishedAt") as StringProperty;
    //     const publishedAt = parseInt(publishedAtProperty.getValue());
    //     const receivedAt = Date.now();
    //     controller?.insertValue(id, rollIndex, publishedAt, receivedAt);
    //     console.log(`DiceBinding#insertValue ${receivedAt-publishedAt}`);
    // }

    // private updateDice(diceProperty: NamedProperty) {
    //     console.log("DiceBinding#updateDice" + JSON.stringify(diceProperty.serialize(), null, 2));
    //     const controller = this.getRepresentation<DiceBindingController>();
    //     const id = diceProperty.getId();
    //     const rollIndexProperty: StringProperty = diceProperty.get("diceValue") as StringProperty;
    //     const rollIndex = parseInt(rollIndexProperty.getValue());
    //     const publishedAtProperty: StringProperty = diceProperty.get("publishedAt") as StringProperty;
    //     const publishedAt = parseInt(publishedAtProperty.getValue());
    //     const receivedAt = Date.now();
    //     controller?.updateValue(id, rollIndex, publishedAt, receivedAt);
    //     console.log(`DiceBinding#updateValue ${receivedAt-publishedAt}`);
    // }

    _rolls: Map<string, number>;

    constructor(in_params: DataBindingParams){
        super(in_params);
        this._rolls = new Map();
    }

    public insertDice(context: ModificationContext) {
        if (context.getNestedChangeSet()) {
            const controller = this.getRepresentation<DiceAdapterController>();
            const changeSet = context.getNestedChangeSet();
            const relativePath = context.getRelativeTokenizedPath();
            const absolutePath = context.getAbsolutePath();
            console.log(`Abs path ${absolutePath}`);
            console.log(`Relative path ${relativePath}`);
            console.log(JSON.stringify(changeSet, null, 2));
            const diceIndex: string = absolutePath.substring(1);
            if (changeSet.String) {
                const publishedAt: number = parseInt(changeSet.String.publishedAt);
                const receivedAt: number = Date.now();
                controller.insertValue(diceIndex, -1, publishedAt, receivedAt);
                console.log(`DiceBinding#insertDice ${receivedAt-publishedAt}`);
            }

            
        }
    }

    public updateDice(context: ModificationContext) {
        if (context.getNestedChangeSet()) {
            const controller = this.getRepresentation<DiceAdapterController>();
            const changeSet = context.getNestedChangeSet();
            const absolutePath = context.getAbsolutePath();
            const relativePath = context.getRelativeTokenizedPath();
            console.log(`Abs path ${absolutePath}`);
            console.log(`Relative path ${relativePath}`);
            console.log(JSON.stringify(changeSet, null, 2));
            const diceIndex: string = absolutePath.substring(1);
            if (changeSet.String) {
                const publishedAt: number = parseInt(changeSet.String.publishedAt);
                const receivedAt: number = Date.now();
                const rollIndex: number = this._rolls.get(diceIndex);
                controller.updateValue(diceIndex, rollIndex, publishedAt, receivedAt);
               console.log(`DiceBinding#insertDice ${receivedAt-publishedAt}`);
            }

            if(changeSet.Int32){
                const rollIndex = changeSet.Int32.diceValue;
                this._rolls.set(diceIndex, rollIndex)
                controller.updateValue(diceIndex, rollIndex, -1, -1);
            }
        }
    }

    static initialize() {
        this.registerOnPath("", ["modify"], this.prototype.updateDice);
        this.registerOnPath("", ["insert"], this.prototype.insertDice);

    }
}

DiceBinding.initialize();