import { CommentThreadChange } from "./commentThreadChange";
import { CommentThreadDisplay } from "./commentThreadDisplay";

export class CommentThreadController {

    commentThreadDisplay: CommentThreadDisplay;

    constructor(commentThreadDisplay: CommentThreadDisplay) {
        this.commentThreadDisplay = commentThreadDisplay;
    }

    public updateValue(arrayChange: CommentThreadChange) {
        if (arrayChange.operationType === "modify") {
            this.commentThreadDisplay(comments => comments.map((comment, index) =>
                index === arrayChange.index
                    ? {"text": arrayChange.text}
                    : comment))
        } else if (arrayChange.operationType === "insert") {
            this.commentThreadDisplay(comments => [...comments,{"text": arrayChange.text}]);
        } else if (arrayChange.operationType === "remove") {
            this.commentThreadDisplay(comments => comments.filter((comment, index) =>
                index === arrayChange.index ? false : true));
        } else {
            throw new Error("Cannot handle " + arrayChange.operationType);
        }
    }
}