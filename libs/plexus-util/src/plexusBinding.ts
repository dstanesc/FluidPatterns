import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { RemovalContext } from "@fluid-experimental/property-binder/dist/data_binder/removalContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { PlexusController } from "./plexusController";
import { TextArrayChange } from "./plexusChanges";

export class PlexusBinding extends DataBinding {

    private elementInsert(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementInsert ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private elementUpdate(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementUpdate ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private elementRemove(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementRemove ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        const plexusController: PlexusController | undefined = this.getRepresentation<PlexusController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        const commentIndex: number = parseInt(relativePath[1]);
        const change: TextArrayChange = new TextArrayChange(operationType, commentIndex, "");
        plexusController.updateValue(change);
    }

    private performModificationInternal(key: string, context: ModificationContext) {
        const plexusController: PlexusController | undefined = this.getRepresentation<PlexusController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const elementIndex: number = parseInt(key);
        console.log(`PlexusBinding#performModificationInternal index=${elementIndex} operation=${operationType}`);
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            // if (changeSet.String) {
            //     const elementText: string = changeSet.String.text;
            //     const change: TextArrayChange = new TextArrayChange(operationType, elementIndex, elementText);
            //     plexusController.updateValue(change);
            // }
            if(changeSet._dataArrayRef){
                const elementText: string = changeSet._dataArrayRef;
                const change: TextArrayChange = new TextArrayChange(operationType, elementIndex, elementText);
                plexusController.updateValue(change);
            }
        }
    }

    static initialize() {
        this.registerOnPath("data", ["collectionInsert"], this.prototype.elementInsert, { isDeferred: true });
        this.registerOnPath("data", ["collectionModify"], this.prototype.elementUpdate, { isDeferred: true });
        this.registerOnPath("data", ["collectionRemove"], this.prototype.elementRemove, { isDeferred: true });
    }
}

PlexusBinding.initialize();