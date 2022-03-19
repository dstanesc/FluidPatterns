export const querySchema = {
    typeid: "hex:query-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "id", typeid: "String" },
        { id: "text", typeid: "String" },
    ],
};

export const queryResultSchema = {
    typeid: "hex:queryResult-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "id", typeid: "String" },
        { id: "text", typeid: "String" },
    ],
};


export const stringArraySchema =  {
    typeid: "hex:stringArray-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "String", context: "array" },
    ],
};

export const queryArraySchema =  {
    typeid: "hex:queryArray-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:query-1.0.0", context: "array" },
    ],
};

export const queryResultArraySchema =  {
    typeid: "hex:queryResultArray-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:queryResult-1.0.0", context: "array" },
    ],
};

