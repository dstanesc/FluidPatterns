import { Utils } from "@fluid-experimental/property-changeset";


export class DiceArrayChange {

    operationType: Utils.OperationType;
    
    diceIndex: number;
    
    diceValue: number;
    
    constructor(operationType: Utils.OperationType, diceIndex: number, diceValue: number) {
        this.operationType = operationType;
        this.diceIndex = diceIndex;
        this.diceValue = diceValue;
    }
}
