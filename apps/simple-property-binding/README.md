# Simple Property Data Binding 

Investigates the binding API for a simple scenario

# Binding Upgrade

In addition current code investigates the upgrade capability exposed by the binding API. 

The app recognizes 2 dice schemas

__hex:dice-1.0.0__
```js
{
    typeid: "hex:dice-1.0.0",
    inherits: "NamedProperty",
    properties: [
        { id: "diceValue", typeid: "Int32" }
    ],
}
```
__hex:dice-1.1.0__ with minor version revised
```js
{
    typeid: "hex:dice-1.1.0",
    inherits: "NamedProperty",
    properties: [
        { id: "diceValue", typeid: "Int32" },
        { id: "diceColor", typeid: "String" },
    ],
}
```

The data binding is associated with __hex:dice-1.0.0__, but with the `UpgradeType.MINOR` option

```ts
  // Define the DiceBinding
  fluidBinder.defineDataBinding("view", "hex:dice-1.0.0", DiceBinding, {
    upgradeType: UpgradeType.MINOR
  });
```

The dice, inserted as __hex:dice-1.1.0__ instance, properly triggers the `DiceBinding` callbacks.

```ts
rootProp.insert("dice", PropertyFactory.create("hex:dice-1.1.0", undefined, { "diceValue": "0", "diceColor": "green" }));
``

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
cd FluidPatterns/apps/simple-property-binding
npm install -g serve
serve -s build
```
or 

```sh
cd FluidPatterns
npm run simple-binding
```

## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
