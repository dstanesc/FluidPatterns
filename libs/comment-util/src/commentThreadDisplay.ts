import { UserComment } from "./comment";

export type CommentThreadDisplay = {

    (fn: (comments: UserComment[]) => UserComment[]): void;
}
