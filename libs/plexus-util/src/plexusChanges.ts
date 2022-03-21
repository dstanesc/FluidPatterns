import { Utils } from "@fluid-experimental/property-changeset";


export class PlexusModelChange {

    operationType: Utils.OperationType;
    
    key: string;
    
    id: string;

    text: string;
    
    constructor(operationType: Utils.OperationType, key: string, id: string, text: string) {
        this.operationType = operationType;
        this.key = key;
        this.id = id;
        this.text = text;
    }
}
