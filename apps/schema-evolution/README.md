# Schema Evolution 

Investigates schema evolution patterns

# Getting Started

Needed dependencies
```
$ node --version
v16.13.1

$ npm --version
8.1.2
```

Using NVM for node version management
```sh
nvm use v16.13.1
```
## Build

```sh
cd FluidPatterns
npm run clean
npm install --legacy-peer-deps
npm run build
```


## Run

Terminal 1

```sh
npx tinylicious
```

Terminal 2

```sh
cd FluidPatterns/apps/schema-evolution
npm start
```

## Schema Versioning Example

```js
// evolvable-1.0.0.ts
export default  {
    typeid: "hex:evolvable-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "numA", typeid: "Int32" },
        { id: "strB", typeid: "String" },
    ],
};

// evolvable-1.0.1.ts
export default  {
    typeid: "hex:evolvable-1.0.1",
    inherits: "NamedProperty",
    properties: [
        { id: "numA", typeid: "Int32" },
        { id: "strB", typeid: "String" },
        { id: "strC", typeid: "String" },
    ],
};

// evolvable-1.0.2.ts 
// this is breaking the rule that for Minor change, 
// attributes should only be added
export default  {
    typeid: "hex:evolvable-1.0.2",
    inherits: "NamedProperty",
    properties: [
        { id: "numA", typeid: "Int32" },
        { id: "strC", typeid: "String" },
        { id: "strD", typeid: "String" },
    ],
};


// evolvable-2.0.0.ts
export default  {
    typeid: "hex:evolvable-2.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "numA", typeid: "Int32" },
        { id: "strB", typeid: "String" },
        { id: "strF", typeid: "String" },
        { id: "strG", typeid: "String" },
    ],
};
```

## Registration Example

```js
// application
import evolvableSchema100 from "./evolvable-1.0.0";
import evolvableSchema101 from "./evolvable-1.0.1";
import evolvableSchema102 from "./evolvable-1.0.2";
import evolvableSchema200 from "./evolvable-2.0.0";  
 ...

PropertyFactory.register(Object.values(
  [evolvableSchema100,evolvableSchema101,evolvableSchema102
  ,evolvableSchema103,evolvableSchema200]));
```


## Minor Versions Example

```js
  // configuration for hex:evolvable-1.0.0 and using UpgradeType.MINOR
  // applies configuration for all hex:evolvable-1.x.x
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");
```

## Partial Configurations Example

```js
fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", FirstEvolvableBinding,{upgradeType: UpgradeType.MINOR});
fluidBinder.defineDataBinding("view", "hex:evolvable-1.3.0", NextEvolvableBinding,{upgradeType: UpgradeType.MINOR});
```

## Schema Evolution

- Do not evolve data all data

- Evolve data, which need the attributes which came with the new version

   - Application should be backward compatible

   - It should not fail if the old version is loaded

- Evolution can only be done by rewriting the data

   - The old data of the old type versions are loaded to application

   - The instance of  new type is instantiated

   - The old attributes are copied to the new instance

   - The new attributes are filled as needed

   - The new instance replaces the old instance in the PropertyDDS

## Schema Evolution Example

```js
function to101(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let numA = (rootProp.resolvePath("evolvable.numA") as ValueProperty)?.getValue();
  if(!numA){
      numA = -1;
  }
  let strC = (rootProp.resolvePath("evolvable.strC") as ValueProperty)?.getValue();
  if(!strC){
    strC = "-";
  }
  let strB = (rootProp.resolvePath("evolvable.strB") as ValueProperty)?.getValue();
  if(!strB){
    strB = "-";
  }
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.1", undefined, 
      { "numA": numA, "strB": strB, "strC": strC }));
  workspace.commit();
}
```

## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
