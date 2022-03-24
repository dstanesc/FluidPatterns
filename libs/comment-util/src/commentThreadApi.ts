import { Workspace } from "@dstanesc/fluid-util";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { CommentThreadDisplay } from "./commentThreadDisplay";
import { CommentThreadController } from "./commentThreadController";
import { CommentThreadBinding } from "./commentThreadBinding";



export function retrieveArrayProperty(workspace: Workspace): ArrayProperty {
    const commentArrayProperty: ArrayProperty = workspace.rootProperty.resolvePath("commentArray.comments")! as ArrayProperty
    return commentArrayProperty;
}

export function retrieveCommentTextProperty(arrayProperty: ArrayProperty, index: number): StringProperty {
    const commentProperty = arrayProperty.get(index) as NamedProperty;
    const commentTextProperty: StringProperty = commentProperty.get("text") as StringProperty;
    return commentTextProperty;
}

export function createCommentProperty(text: string): NamedProperty {
    const diceProperty = PropertyFactory.create<NamedProperty>("hex:comment-1.0.0", undefined, {"text": text});
    return diceProperty;
}

export function createCommentThreadProperty(): NamedNodeProperty {
    const commentThreadProperty: NamedNodeProperty = PropertyFactory.create<NamedNodeProperty>("hex:commentThread-1.0.0");
    return commentThreadProperty;
}

export function initPropertyTree(containerId: string | undefined, workspace: Workspace, commentThreadDisplay: CommentThreadDisplay) {
    if (containerId === undefined) {
        const commentArray: NamedNodeProperty = createCommentThreadProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert("commentArray", commentArray);
        workspace.commit();
    } else {
        const commentArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
        for (let i = 0; i < commentArrayProperty.length; i++) {
            const commentTextProperty: StringProperty = retrieveCommentTextProperty(commentArrayProperty, i);
            commentThreadDisplay(commentValues => [...commentValues, {"text":commentTextProperty.getValue()}]);
        }
    }
}

export function configureBinding(dataBinder: DataBinder, workspace: Workspace, diceArrayDisplay: CommentThreadDisplay) {
    dataBinder.defineRepresentation("view", "hex:commentThread-1.0.0", (property) => {
        return new CommentThreadController(diceArrayDisplay);
    });
    dataBinder.defineDataBinding("view", "hex:commentThread-1.0.0", CommentThreadBinding, {
        upgradeType: UpgradeType.MINOR
    });
    dataBinder.activateDataBinding("view");
}