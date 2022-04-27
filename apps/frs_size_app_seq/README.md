# Fluid Communication Size Limits

Investigates fluid communication size limits

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



Terminal 1

```sh
cd FluidPatterns/apps/frs_size_app_seq
npm start
```


Usage:

* Url localhost:<port> will disable big operations, operations bigger than 750000B are refused (the limit is 768000 
but we need to count with some reserve for administrative values). JS console will show exception (use F12 in Chrome)
* Url localhost:<port>/?big=true will enable big operations, operations of all sizes are processed
* We can choose the size of the operation by check-boxes
* To post the operation, the button 'Big Commit' is to be pressed
* We can see the status of Big Operations availability (red point if not available, green point if available)
* The info about the number of summarizations is available
* If we cross about 30MB, the summary will fail. JS console will show exception (use F12 in Chrome). The exception will come some time after the summarization done message


## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
