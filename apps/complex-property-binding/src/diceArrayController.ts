import { DiceArrayChange } from "./diceArrayChange";
import { DiceArrayViewModel } from "./diceArrayViewModel";

export class DiceArrayController {

    diceArrayViewModel: DiceArrayViewModel;

    constructor(diceArrayRenderer: DiceArrayViewModel) {
        this.diceArrayViewModel = diceArrayRenderer;
    }

    public updateValue(arrayChange: DiceArrayChange) {
        if (arrayChange.operationType === "modify") {
            this.diceArrayViewModel(diceValues => diceValues.map((diceValue, index) =>
                index === arrayChange.diceIndex
                    ? arrayChange.diceValue
                    : diceValue))
        } else if (arrayChange.operationType === "insert") {
            this.diceArrayViewModel(diceValues => [...diceValues, arrayChange.diceValue]);
        } else if (arrayChange.operationType === "remove") {
            this.diceArrayViewModel(diceValues => diceValues.filter((diceValue, index) =>
                index === arrayChange.diceIndex ? false : true));
        } else {
            throw new Error("Cannot handle " + arrayChange.operationType);
        }
    }
}