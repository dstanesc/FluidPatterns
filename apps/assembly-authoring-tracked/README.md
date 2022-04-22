# Multi-Session Search Enabled Assembly Authoring

Investigate the ability to externalize PropertyDDS domain data in materialized views to serve rich queries. Drawing from the  Event Driven Architecture techings, the materialized views (projections) are eventually consistent, synchronized via a PropertyDDS based, ChangeSet Log - [the Tracker](../../libs/tracker-util). The proposed design is symmetric and highly auditable. The queries and results are based on a dedicated, PropertyDDS based, log and notification infrastructure - [Plexus](../../libs/plexus-util/). 

>Note: This is POC level software, productive instantiations will have to solve additional robustness and scalability aspects.

## Getting Started

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

Add elastic, elasticvue entries to `/etc/hosts`

```sh
127.0.0.1       localhost
127.0.1.1       elastic elasticvue
```

## Run

> Note: Starting order is relevant.

1. Start Tinylicious

```sh
npx tinylicious
```

2. Start _Elastic Search Database_ 

```sh
cd FluidPatterns/apps/assembly-search-agent
docker-compose up
```

3. Start _Plexus Nameservice_

```sh
cd FluidPatterns/apps/plexus-nameservice-agent
npm start
```

4. Start _Assembly Indexing/Search Service_

```sh
cd FluidPatterns/apps/assembly-search-agent
npm start
```

5. Start _Assembly Authoring Application_

```sh
cd FluidPatterns/apps/assembly-authoring-tracked
npm start
```

6. Start _Assembly Search Application_

```sh
cd FluidPatterns/apps/assembly-search
npm start
```

## Authoring Workflow

![Authoring](./img/author.svg)

Edit above [diagram](https://sequencediagram.org/index.html#initialData=C4S2BsFMAIEEFdgAsD2AnEA7A5tA6ugNYBm4KA7gFCUAOAhmqAMYj2bDZorw3QCy8cKBpRoAYXAhI7aAGVIAZwUgUmBZTpNg6OJKaRaDZqzoyEydFlzylKzIcYgWbYHCWQAtgCNwATwAi-rKU0gAm1PSOzqauAApQAB7wCtAAcnQeipBoAG5OBpHGLtAAKmiahNmBwYVOJjLxkEkpAJKYoU1WcNjSwA5FMdCNzdWUoXTAdF50CjAAouAzzNTDydBtHQldsD3sALQAfABUqwrVAFyUmCjAMCg52UOJyRcA9CjExLPACgA6mK8AI7wbK+AAyKGw-yBILQvgASopBMAIdhKKd1u1Ojhur1DkcyhUqkFLujnq0sVscTtegAeQ4Y9KZWa5fLnNCQbAgBS3NCvHrAU5iVSTLDZFrhMlNNYbbG4GnsekHRkZLKs-Tsznc3n8yDAQlMSpoYXsOhitAS6jmVAYHE2ZSqekq5nZPIagUGo0m0WYcXha2WO2KB2YfGwdzePwXSgB23WYN2Q7h2aRgIkjlcnlVCZ0ABCWFCVhjekgScQNq69rs5zo5fQMbrcbkCdUSYjPjTsnOHhQheIvhj7ajQTLFibVdU52uoH7-hzYiQph66k43F4AGIAEzETeQADsXmgZBQG-ISDABmTng71TbKZvJIU8A8HgYIAAXpBhRzB-fh7I72vf9zhoNB4F9AAJbV0AHK9U1vA5PWJLsFGBGYkAXJdFGgAAyaAaHgHxuSQEJ2ilZpMU2bZdmAJ1yQuAUxHgNAOXYAB5T5vkoVceGgLcd33Q9j1Pc9bnImVKWovFEPKQ1kJAlBwHAAAKD4vj1ABKcSKSo6kaIZclKLlXF2BAhhZkwnBIHkPptKMql5X0g4FiWJxziwFlgFeHs+wHHjeBAYhoCfJh9CUOzZQckzgAM6UzkfPUmJY3oOPUvowlI0JoEoIA)

## Search Workflow

![Searching](./img/search.svg)

Edit above [diagram](https://sequencediagram.org/index.html#initialData=C4S2BsFMAIGVIIYCcDGALaB1A9kg1gGbjYDuAUGQisLtAILggqRkAOyoKI7AdsHIlQYAwo0h8K7JJ24I+0AApQAHgFcAztAByCALaR1kJADcmLKTN78lkNZvjJ09AObjgbDk1nybdgCJ+sGQAJgjACABGCIbQAKLg0ZwUvhoCjhh0rnwAtAB8AFQp6gGwAFwUPNjAMNjGRooqGiWlAPTYBASGwOoAOjwtAI6qRgCeADLYzn2Dw0gjAEoGquDAE87JjfaCTpluADx5Rdp6BkamzKVIkM4g6tVILa7ARcLYfAggPEYAksEbtqkHEIXPtDptjvpDCYzJdrrd7o9IMAACpIKh4Iyvd6fH5-MhHIE7LLAMEA4qBWE3O5GACKsxGACFPsEjBRCSIxHwDkcdJCzjCni83uEcUhfmR2dBRCA3KT-BSrlT7nTRot1MtgEyeCykGQGGY8pLpW5SoZ0hLthyZTlckVmoZtSq5v95bA5YDLSC+KVKqACCMnSN8eDJbsbQTPWHgKUpIZA8GyWlgVGDrl4okmDGjARcLp4xH0l6SbbNvbxMFA2qNeoE67DZ7jd7fSB-ZWlisa0bOcX9RcruqO0A)


# Visual Paradigm - Session 1

Collaborative authoring session outcome is continously persisted. 

![Session 1](./img/session-1.png)

# Visual Paradigm - Session n

![Session n](./img/session-2.png)

# Search Langauge

Search is possible when sessions are active (interactive search) and also long after their completion (analytics, forensics, etc. - assembly / compoenet versioning is for sure the next important ingidient but out of scope for current investigation).  For simplicity and expressiveness our demo offers however a mini search language allowing:

__Range filters__ for  `x, y, width, height`, eg.:

```
width:100-200
```

__Exact matches__ for `fill, id`, eg.:

```
id:rect1
```

__Full text__ search for `annotation` field, eg.:

```
green beam
```

__Combined syntax__, eg.:

```
width:100-110 height:400-500 beam
```

# Visual Paradigm - Search

![Search Results](./img/search-results.png)

# Visual Paradigm - Search Result Detail 1

From the search results list the user can rehydrate the full session context (assembly) of the selected component. 

![Search Result Detail](./img/result-1.png)

# Visual Paradigm - Search Result Detail 2

![Search Result Detail](./img/result-3.png)


## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.

