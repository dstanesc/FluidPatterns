export const assemblyComponentSchema = {
    typeid: "hex:assemblyComponent-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "id", typeid: "String" },
        { id: "x", typeid: "Int32" },
        { id: "y", typeid: "Int32" },
        { id: "width", typeid: "Int32" },
        { id: "height", typeid: "Int32" },
        { id: "fill", typeid: "String" },
        { id: "annotation", typeid: "String"},
    ],
};