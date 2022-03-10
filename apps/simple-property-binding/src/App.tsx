import React, { useState, useEffect } from 'react';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property }
  from "@fluid-experimental/property-properties";

import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import { SharedPropertyTree } from "@fluid-experimental/property-dds";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import diceSchema from "./dice-1.0.0";

import diceSchemaNext from "./dice-1.1.0";

import { Dice } from "./dice";

import { DiceBinding } from "./diceBinding";

import { DiceRenderer } from "./diceRenderer";




export default function App() {

  const [diceValue, setDiceValue] = useState<number>(0);

  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;


  useEffect(() => {

    async function initWorkspace() {

      // Register the template which is used to instantiate properties.
      registerSchema(diceSchema);
      registerSchema(diceSchemaNext);

      // Initialize the workspace
      const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

      const myWorkspace: Workspace = boundWorkspace.workspace;

      // Update location
      if (myWorkspace.containerId)
        window.location.hash = myWorkspace.containerId;

      const dataBinder: DataBinder = boundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setDiceValue);

      const rootProp: NodeProperty = myWorkspace.rootProperty;

      //Initialize the tree with start dice value
      initializeTree(containerId, rootProp, myWorkspace);

      // save workspace to react state
      setWorkspace(myWorkspace);
    }

    initWorkspace();

  }, []);


  const roll = () => {
    const newValue = Math.floor(Math.random() * 1024) + 1;
    updateProperty(workspace, newValue);
  }

  const updateProperty = (workspace: Workspace, value: number) => {
    if (workspace) {
      const diceValueProperty: Int32Property = workspace.rootProperty.resolvePath("dice.diceValue")! as Int32Property;
      diceValueProperty.setValue(value);
      workspace.commit();
    }
  }

  return (
    <div className="App">

      <div className="dice">
        {diceValue}
      </div>

      <div className="commit" onClick={() => roll()}>
        Roll
      </div>

    </div>
  );
}

function initializeTree(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {

  if (containerId === undefined) {

    rootProp.insert("dice", PropertyFactory.create("hex:dice-1.1.0", undefined, { "diceValue": "0", "diceColor": "green" }));

    workspace.commit();
  }
}

function configureBinding(fluidBinder: DataBinder, workspace: Workspace, diceRenderer: DiceRenderer) {

  // Configure the Dice factories
  fluidBinder.defineRepresentation("view", "hex:dice-1.0.0", (property) => {
    return new Dice(0, diceRenderer);
  });

  fluidBinder.defineRepresentation("view", "hex:dice-1.1.0", (property) => {
    return new Dice(0, diceRenderer);
  });

  // Define & Activate the DiceBinding
  fluidBinder.defineDataBinding("view", "hex:dice-1.0.0", DiceBinding, {
    upgradeType: UpgradeType.MINOR
  });

  fluidBinder.activateDataBinding("view");
}