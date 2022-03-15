import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { Int32Property, NamedProperty, StringProperty } from "@fluid-experimental/property-properties";
import { DiceController } from "./diceController";

export class DiceBinding extends DataBinding {

    private insertDice(diceProperty: NamedProperty) {
        console.log("DiceBinding#insertDice" + JSON.stringify(diceProperty.serialize(), null, 2));
        const controller = this.getRepresentation<DiceController>();
        const id = diceProperty.getId();
        const publishedAtProperty: StringProperty = diceProperty.get("publishedAt") as StringProperty;
        const publishedAt = parseInt(publishedAtProperty.getValue());
        const receivedAt = Date.now();
        controller?.insertValue(id, publishedAt, receivedAt);
        console.log(`DiceBinding#insertValue ${receivedAt-publishedAt}`);
    }

    private updateDice(diceProperty: NamedProperty) {
        console.log("DiceBinding#updateDice" + JSON.stringify(diceProperty.serialize(), null, 2));
        const controller = this.getRepresentation<DiceController>();
        const id = diceProperty.getId();
        const publishedAtProperty: StringProperty = diceProperty.get("publishedAt") as StringProperty;
        const publishedAt = parseInt(publishedAtProperty.getValue());
        const receivedAt = Date.now();
        controller?.updateValue(id, publishedAt, receivedAt);
        console.log(`DiceBinding#updateValue ${receivedAt-publishedAt}`);
    }



    static initialize() {
        this.registerOnProperty("", ["modify"], this.prototype.updateDice);
        this.registerOnProperty("", ["insert"], this.prototype.insertDice);

    }
}

DiceBinding.initialize();