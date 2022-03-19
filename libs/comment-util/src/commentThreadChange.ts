import { Utils } from "@fluid-experimental/property-changeset";


export class CommentThreadChange {

    operationType: Utils.OperationType;
    
    index: number;
    
    text: string;
    
    constructor(operationType: Utils.OperationType, index: number, text: string) {
        this.operationType = operationType;
        this.index = index;
        this.text = text;
    }
}
