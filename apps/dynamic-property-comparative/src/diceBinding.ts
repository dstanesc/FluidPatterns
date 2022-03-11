import { DataBinding } from "@fluid-experimental/property-binder";
import { Int32Property, NamedProperty } from "@fluid-experimental/property-properties";
import { DiceController } from "./diceController";

export class DiceBinding extends DataBinding {

    private insertDice(diceProperty: NamedProperty) {
            const controller = this.getRepresentation<DiceController>();
        const id = diceProperty.getId();
        const diceValueProperty: Int32Property = diceProperty.get("diceValue") as Int32Property;
        const value = diceValueProperty.getValue();
        controller?.insertValue(id, value);
    }

    private updateDice(diceProperty: NamedProperty) {
        const controller = this.getRepresentation<DiceController>();
        const id = diceProperty.getId();
        const diceValueProperty: Int32Property = diceProperty.get("diceValue") as Int32Property;
        const value = diceValueProperty.getValue();
        controller?.updateValue(id, value);
    }

    static initialize() {
        this.registerOnProperty("", ["modify"], this.prototype.updateDice);
        this.registerOnProperty("", ["insert"], this.prototype.insertDice);
    }
}

DiceBinding.initialize();