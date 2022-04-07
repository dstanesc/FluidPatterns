import { DiceRenderer } from "./diceRenderer";

export class Dice {

    diceValue: number;

    diceRenderer: DiceRenderer;

    constructor(diceValue: number,  diceRenderer: DiceRenderer){
        this.diceValue = diceValue;
        this.diceRenderer = diceRenderer;
    }

    public updateValue(diceValue: number){
        this.diceValue = diceValue;
        this.diceRenderer(diceValue);
    }
}