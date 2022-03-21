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

export const containerSchema = {
    typeid: "hex:container-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "id", typeid: "String" },
        { id: "text", typeid: "String" },
    ],
};

export const operationSchema = {
    typeid: "hex:operation-1.0.0",
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

export const int32ArraySchema =  {
    typeid: "hex:int32Array-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "Int32", context: "array" },
    ],
};

export const queryMapSchema =  {
    typeid: "hex:queryMap-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:query-1.0.0", context: "map" },
    ],
};

export const queryResultMapSchema =  {
    typeid: "hex:queryResultMap-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:queryResult-1.0.0", context: "map" },
    ],
};

export const containerMapSchema =  {
    typeid: "hex:containerMap-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:container-1.0.0", context: "map" },
    ],
};

export const operationMapSchema =  {
    typeid: "hex:operationMap-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "data", typeid: "hex:operation-1.0.0", context: "map" },
    ],
};