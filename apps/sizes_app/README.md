
# Sizes application

With this application we are able to send SharedPropertyTree message with the required size.
The size can be entered in the text field beside the button 'Big Commit'.
Pressing the 'Big Commit' button sends the message to Fluid.

The default configuration points to the tinylicious client on the localhost. In order to change
the fluid server, the file

``` 

apps/sizes_app/src/fluidAccess.ts
```
must be edited before the build to fabricate the proper AzureClient.

Example of the AzureClient pointing to FRS server:

```
import { AzureClient } from "@fluidframework/azure-client";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";

export const fluidClient = new AzureClient({
    connection: {
        tenantId: "<tenantId>",
        tokenProvider: new InsecureTokenProvider("<token>", {
            id: "benchmark",
        }),
        orderer: "https://alfred.westus2.fluidrelay.azure.com",
        storage: " https://historian.westus2.fluidrelay.azure.com",
    },
});
```

# Getting Started

Needed dependencies

```
$ node --version
v16.13.1

$ npm --version
8.1.2
```
or higher.

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

```

cd apps/sizes-app/
npm start
```
In browser, enter http://localhost:3000


