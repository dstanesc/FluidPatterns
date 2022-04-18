import { Utils } from "@fluid-experimental/property-changeset";
import { AssemblyComponent } from "./assemblyApi";


export class AssemblyChange {

    operationType: Utils.OperationType;
    
    id: string;
    
    component: AssemblyComponent;
    
    constructor(operationType: Utils.OperationType, id: string, component: AssemblyComponent) {
        this.operationType = operationType;
        this.id = id;
        this.component = component;
    }
}