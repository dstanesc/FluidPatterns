import { PlexusModelChange } from "./plexusChanges";
import { PlexusListener, PlexusModel } from "./plexusListeners";
import { copy as deepCopy } from "fastest-json-copy";


export class PlexusMapController {

    listener: PlexusListener;

    constructor(listener: PlexusListener) {
        this.listener = listener;
    }

    public updateValue(modelChange: PlexusModelChange) {
        console.log(`PlexusController#updateValue ${modelChange.key} ${modelChange.operationType} ${modelChange.text}`);
        if (modelChange.operationType === "modify") {
            this.listener(plexusModelMap => { 
                const resultMap = new Map(plexusModelMap); 
                resultMap.set(modelChange.key, { "id": modelChange.id, "text": modelChange.text }); 
                return resultMap; 
            });
        } else if (modelChange.operationType === "insert") {
            this.listener(plexusModelMap => { 
                const resultMap = new Map(); 
                resultMap.set(modelChange.key, { "id": modelChange.id, "text": modelChange.text }); 
                return resultMap; 
            });
        } else if (modelChange.operationType === "remove") {
            this.listener(plexusModelMap => { 
                const resultMap = new Map(plexusModelMap); 
                resultMap.delete(modelChange.key);
                return resultMap; 
            });
        } else {
            throw new Error("Cannot handle " + modelChange.operationType);
        }
    }
}
