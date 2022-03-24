import { DiceArrayChange } from "./diceArrayChange";
import { DiceArrayDisplay } from "./diceArrayDisplay";

export class DiceArrayController {

    diceArrayDisplay: DiceArrayDisplay;

    constructor(diceArrayRenderer: DiceArrayDisplay) {
        this.diceArrayDisplay = diceArrayRenderer;
    }

    public updateValue(arrayChange: DiceArrayChange) {
        if (arrayChange.operationType === "modify") {
            this.diceArrayDisplay(diceValues => diceValues.map((diceValue, index) =>
                index === arrayChange.diceIndex
                    ? arrayChange.diceValue
                    : diceValue))
        } else if (arrayChange.operationType === "insert") {
            this.diceArrayDisplay(diceValues => [...diceValues, arrayChange.diceValue]);
        } else if (arrayChange.operationType === "remove") {
            this.diceArrayDisplay(diceValues => diceValues.filter((diceValue, index) =>
                index === arrayChange.diceIndex ? false : true));
        } else {
            throw new Error("Cannot handle " + arrayChange.operationType);
        }
    }
}