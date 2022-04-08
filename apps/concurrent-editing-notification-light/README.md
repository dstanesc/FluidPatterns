# Investigates concurrent editing notification, lightweight implementation

Lightweight solution for the concurrent editing problem described at large in the _concurrent editing notification_ [sibling project](../concurrent-editing-notification/)

Although highly efficient, current approach is impractical for complex applications as lacks good encapsulation. 

The solution leverages undocumented and possibly evolving _PropertyDDS_:
- internal API. 
- serialization format.
- internal state transitions

For the same reason the solution lacks portability.

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
cd FluidPatterns/apps/concurrent-editing-notification-light
npm start
```

## Preview

![Blue Dot](./img/blue-dot.png)

## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
