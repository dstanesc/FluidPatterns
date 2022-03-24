import { DataBinding } from "@fluid-experimental/property-binder";
import { Dice } from "./dice";

export class DiceBinding extends DataBinding {

    private updateDice(value: number) {
        const dice = this.getRepresentation<Dice>();
        dice.updateValue(value);
    }
    static initialize() {
        this.registerOnValues("diceValue", ["modify"], this.prototype.updateDice);
        this.registerOnValues("diceValue", ["insert"], this.prototype.updateDice);
    }
}

DiceBinding.initialize();