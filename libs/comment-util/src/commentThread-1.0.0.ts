/* eslint-disable import/no-anonymous-default-export */
export const commentThreadSchema =  {
    typeid: "hex:commentThread-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "comments", typeid: "hex:comment-1.0.0", context: "array" },
    ],
};