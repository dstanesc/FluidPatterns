import { DataBinding } from "@fluid-experimental/property-binder";
import { ModificationContext } from "@fluid-experimental/property-binder/dist/data_binder/modificationContext";
import { RemovalContext } from "@fluid-experimental/property-binder/dist/data_binder/removalContext";
import { Utils } from "@fluid-experimental/property-changeset";
import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { CommentThreadController } from "./commentThreadController";
import { CommentThreadChange } from "./commentThreadChange";

export class CommentThreadBinding extends DataBinding {

    private commentInsert(key: string, context: ModificationContext) {
        this.performModificationInternal(key, context);
    }

    private commentUpdate(key: string, context: ModificationContext) {
        this.performModificationInternal(key, context);
    }

    private commentRemove(key: string, context: ModificationContext) {
        const commentThreadController: CommentThreadController | undefined = this.getRepresentation<CommentThreadController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const relativePath = context.getRelativeTokenizedPath();
        const commentIndex: number = parseInt(relativePath[1]);
        const change: CommentThreadChange = new CommentThreadChange(operationType, commentIndex, "");
        commentThreadController.updateValue(change);
    }

    private performModificationInternal(key: string, context: ModificationContext) {
        const diceArrayController: CommentThreadController | undefined = this.getRepresentation<CommentThreadController>();
        const operationType: Utils.OperationType = context.getOperationType()!;
        const commentIndex: number = parseInt(key);
        if (context.getNestedChangeSet()) {
            const changeSet = context.getNestedChangeSet();
            if (changeSet.String) {
                const commentText: string = changeSet.String.text;
                const change: CommentThreadChange = new CommentThreadChange(operationType, commentIndex, commentText);
                diceArrayController.updateValue(change);
            }
        }
    }

    static initialize() {
        this.registerOnPath("comments", ["collectionInsert"], this.prototype.commentInsert, { isDeferred: true });
        this.registerOnPath("comments", ["collectionModify"], this.prototype.commentUpdate, { isDeferred: true });
        this.registerOnPath("comments", ["collectionRemove"], this.prototype.commentRemove, { isDeferred: true });
    }
}

CommentThreadBinding.initialize();