# Search Enabled Assembly Authoring

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

## Configure

Add elastic, kibana entries to `/etc/hosts`

```sh
127.0.0.1       localhost
127.0.1.1       elastic elasticvue
```

# Run

> Note: Starting order is relevant.

1. Start _Plexus Fulltext Indexing Service_ 

```sh
cd FluidPatterns
docker-compose up
```

2. Start _Plexus Nameservice_

```sh
cd FluidPatterns/apps/plexus-nameservice-agent
npm start
```

3. Start _Plexus Service_

```sh
cd FluidPatterns/apps/plexus-service-agent
npm start
```

4. Start _Assembly Authoring Application_

```sh
cd FluidPatterns/apps/assembly-authoring-tracked
npm start
```

5. Start _Assembly Search Application_

```sh
cd FluidPatterns/apps/comment-search
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

