import { AssemblyChange } from "./assemblyChange";
import { AssemblyListener, AssemblyComponent } from "./assemblyListener";
import { copy as deepCopy } from "fastest-json-copy";
import { enrich } from "./assemblyApi";


export class AssemblyController {

    listener: AssemblyListener;

    constructor(listener: AssemblyListener) {
        this.listener = listener;
    }

    public updateValue(assemblyChange: AssemblyChange) {
        console.log(`AssemblyController#updateValue ${assemblyChange.id} ${assemblyChange.operationType} ${assemblyChange.component}`);
        if (assemblyChange.operationType === "modify") {
            this.listener(assembly => {
                return assembly.map((component, index) => component.id === assemblyChange.id
                    ? updateFields(component, assemblyChange.component)
                    : component
                )
            });
        } else if (assemblyChange.operationType === "insert") {
            this.listener(assembly =>
                [...assembly, enrich(assemblyChange.component)]
            );
        } else if (assemblyChange.operationType === "remove") {
            this.listener(assembly =>
                assembly.filter(component => component.id === assemblyChange.id ? false : true)
            );
        } else {
            throw new Error("Cannot handle " + assemblyChange.operationType);
        }
    }
}


function updateFields(original: AssemblyComponent, change: AssemblyComponent): AssemblyComponent {
    const originalCopy = deepCopy(original);
    Object.entries(change).forEach(([key, value]) => {
        console.log(`Received assembly change ${key} ${value}`);
        if (value) {
            originalCopy[key] = value;
            console.log( `Updating ${key} to ${value}`);
        }
    });
    console.log( `Updating object to ${JSON.stringify(originalCopy, null, 2)}`);
    return originalCopy;
}