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
                const increment = { "id": modelChange.id, "text": modelChange.text };
                resultMap.set(modelChange.key, increment); 
                return {"operationType": modelChange.operationType, "result" :resultMap, "increment": increment}; 
            });
        } else if (modelChange.operationType === "insert") {
            this.listener(plexusModelMap => { 
                const resultMap = new Map(); 
                const increment = { "id": modelChange.id, "text": modelChange.text };
                resultMap.set(modelChange.key, increment); 
                return {"operationType": modelChange.operationType, "result" :resultMap, "increment": increment};
            });
        } else if (modelChange.operationType === "remove") {
            this.listener(plexusModelMap => { 
                const resultMap = new Map(plexusModelMap); 
                const increment = resultMap.get(modelChange.key);
                resultMap.delete(modelChange.key);
                return {"operationType": modelChange.operationType, "result" :resultMap, "increment": increment};
            });
        } else {
            throw new Error("Cannot handle " + modelChange.operationType);
        }
    }
}
