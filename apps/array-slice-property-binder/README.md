# Array Slice Property Data Binding 

__Work In Progress ...__

This exercise investigates using the PropertyDDS DataBinder directly for dynamic path registration.
The code complexity is comparable to the [Data Binding](../array-property-binding/) solution.

> Note: While algorithms are similar, listener registration paths are absolute (compared to the relative paths in the Data Binding exercise)

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
cd FluidPatterns/apps/array-slice-property-binder
npm install -g serve
serve -s build
```
or

```sh
cd FluidPatterns/apps/array-slice-property-binder
npm start
```

## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
