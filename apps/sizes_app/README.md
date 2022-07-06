
# Sizes application

With this application we are able to send SharedPropertyTree message with the wished size.
The size can be entered in the text field beside the button 'Big Commit'.
Pressing the 'Big Commit' button sends the message to Fluid.


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
cd apps/sizes-app/
npm start

In browser, enter http://localhost:3000
