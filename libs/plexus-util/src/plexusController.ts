import { TextArrayChange } from "./plexusChanges";
import { PlexusListener } from "./plexusListeners";

export class PlexusController {

    listener: PlexusListener;

    constructor(listener: PlexusListener) {
        this.listener = listener;
    }

    public updateValue(arrayChange: TextArrayChange) {
        console.log(`PlexusController#updateValue ${arrayChange.index} ${arrayChange.operationType} ${arrayChange.text}`);
        if (arrayChange.operationType === "modify") {
            this.listener(textArray => textArray.map((text, index) =>
                index === arrayChange.index
                    ? arrayChange.text
                    : text))
        } else if (arrayChange.operationType === "insert") {
            this.listener(textArray => [...textArray, arrayChange.text]);
        } else if (arrayChange.operationType === "remove") {
            this.listener(textArray => textArray.filter((comment, index) =>
                index === arrayChange.index ? false : true));
        } else {
            throw new Error("Cannot handle " + arrayChange.operationType);
        }
    }
}