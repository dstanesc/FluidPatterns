import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { RemovalContext } from "@fluid-experimental/property-binder/dist/data_binder/removalContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { PlexusMapController } from "./plexusController";
import { PlexusModelChange } from "./plexusChanges";
import { DataBindingParams } from "@fluid-experimental/property-binder/dist/data_binder/dataBinding";
import { v4 as uuidv4 } from 'uuid';

export class PlexusBinding extends DataBinding {

    bindingInstanceIdentifier: string;

    constructor(in_params: DataBindingParams){
        super(in_params);
        this.bindingInstanceIdentifier = uuidv4();
    }

    private elementInsert(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementInsert binding=${this.bindingInstanceIdentifier} ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private elementUpdate(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementUpdate binding=${this.bindingInstanceIdentifier} ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private elementRemove(key: string, context: ModificationContext) {
        console.log(`PlexusBinding#elementRemove  key=${key} relativePath=${context.getRelativeTokenizedPath()}`);
        const plexusController: PlexusMapController | undefined = this.getRepresentation<PlexusMapController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        //const commentIndex: number = parseInt(relativePath[1]);
        const change: PlexusModelChange = new PlexusModelChange(operationType, key, key, "");
        plexusController.updateValue(change);
    }

    private performModificationInternal(key: string, context: ModificationContext) {
        const plexusController: PlexusMapController | undefined = this.getRepresentation<PlexusMapController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        //const elementIndex: number = parseInt(key);
        console.log(`PlexusBinding#performModificationInternal key=${key} operation=${operationType}`);
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            if (changeSet.String) {
                const elementId: string = changeSet.String.id;
                const elementText: string = changeSet.String.text;
                const change: PlexusModelChange = new PlexusModelChange(operationType, key, elementId, elementText);
                plexusController.updateValue(change);
            }
            // if(changeSet._dataArrayRef){
            //     const elementText: string = changeSet._dataArrayRef;
            //     const change: TextArrayChange = new TextArrayChange(operationType, elementIndex, elementText);
            //     plexusController.updateValue(change);
            // }
        }
    }

    static initialize() {
        this.registerOnPath("data", ["collectionInsert"], this.prototype.elementInsert, { isDeferred: true });
        this.registerOnPath("data", ["collectionModify"], this.prototype.elementUpdate, { isDeferred: true });
        this.registerOnPath("data", ["collectionRemove"], this.prototype.elementRemove, { isDeferred: true });
    }
}

PlexusBinding.initialize();