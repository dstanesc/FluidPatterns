import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { RemovalContext } from "@fluid-experimental/property-binder/dist/data_binder/removalContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { AssemblyController } from "./assemblyController";
import { AssemblyChange } from "./assemblyChange";
import { AssemblyComponent } from "./assemblyApi";

export class AssemblyBinding extends DataBinding {

    private componentInsert(key: string, context: ModificationContext) {
        //console.log(`AssemblyBinding#componentInsert ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private componentUpdate(key: string, context: ModificationContext) {
        //console.log(`AssemblyBinding#componentUpdate ${key} ${JSON.stringify(context.getNestedChangeSet(), null, 2)}`);
        this.performModificationInternal(key, context);
    }

    private componentRemove(key: string, context: ModificationContext) {
        //console.log(`AssemblyBinding#componentRemove  key=${key} relativePath=${context.getRelativeTokenizedPath()}`);
        const plexusController: AssemblyController | undefined = this.getRepresentation<AssemblyController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        //const commentIndex: number = parseInt(relativePath[1]);
        const change: AssemblyChange = new AssemblyChange(operationType, key, undefined);
        plexusController.updateValue(change);
    }

    private performModificationInternal(key: string, context: ModificationContext) {
        const assemblyController: AssemblyController | undefined = this.getRepresentation<AssemblyController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        //console.log(`AssemblyBinding#performModificationInternal key=${key} operation=${operationType}`);

        if (context.getNestedChangeSet()) {

            const changeSet = context.getNestedChangeSet();

            const id: string = key;

            const fill: string = (changeSet.String) ? changeSet.String.fill : undefined;
            const x: number = (changeSet.Int32) ? changeSet.Int32.x : undefined;
            const y: number = (changeSet.Int32) ? changeSet.Int32.y : undefined;
            const width: number = (changeSet.Int32) ? changeSet.Int32.width : undefined;
            const height: number = (changeSet.Int32) ? changeSet.Int32.height : undefined;
            const annotation: string = (changeSet.String) ? changeSet.String.annotation : undefined;

            const assemblyComponent: AssemblyComponent = { "id": id, "fill": fill, "x": x, "y": y, "width": width, "height": height, "annotation": annotation };

            const change: AssemblyChange = new AssemblyChange(operationType, id, assemblyComponent);

            assemblyController.updateValue(change);
        }
    }

    static initialize() {
        this.registerOnPath("components", ["collectionInsert"], this.prototype.componentInsert, { isDeferred: true });
        this.registerOnPath("components", ["collectionModify"], this.prototype.componentUpdate, { isDeferred: true });
        this.registerOnPath("components", ["collectionRemove"], this.prototype.componentRemove, { isDeferred: true });
    }
}

AssemblyBinding.initialize();