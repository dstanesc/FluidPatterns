export const assemblySchema =  {
    typeid: "hex:assembly-1.0.0",
    inherits: "NamedNodeProperty",
    properties: [
        { id: "components", typeid: "hex:assemblyComponent-1.0.0", context: "map" },
    ],
};