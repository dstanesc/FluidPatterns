import React, { useState, useEffect } from 'react';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property }
  from "@fluid-experimental/property-properties";

import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import { SerializedChangeSet, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import diceSchema from "./dice-1.0.0";

import { Dice } from "./dice";

import { DiceBinding } from "./diceBinding";

import { DiceRenderer } from "./diceRenderer";

import _ from 'lodash';



export default function App() {

  const [diceValue, setDiceValue] = useState<number>(-1);

  const [remoteValue, setRemoteValue] = useState<number>(-1);

  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;


  useEffect(() => {

    async function initWorkspace() {

      // Register the template which is used to instantiate properties.
      registerSchema(diceSchema);

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

      configureRemoteBinding(myWorkspace);
    }

    initWorkspace();

  }, []);

  const configureRemoteBinding = (workspace: Workspace) => {
    // listen to changes
    workspace.on("changeSetModified", (cs) => {
      const tree: SharedPropertyTree = workspace.tree;
      const remoteTip: SerializedChangeSet = tree.remoteTipView;
      if (tree.root.getPendingChanges()._changes.modify) {
        // extract current remote value and display
        const remoteDiceValue = remoteTip.insert["hex:dice-1.0.0"].dice.Int32.diceValue.toString();
        setRemoteValue(remoteDiceValue);
      } else {
        resetRemoteValue();
      }
    });
  }

  const resetRemoteValue = () => {
    setRemoteValue(-1);
  }
  const roll = () => {
    const newValue = Math.floor(Math.random() * 1024) + 1;
    updateProperty(workspace, newValue);
  }

  const updateProperty = (workspace: Workspace, value: number) => {
    if (workspace) {
      const diceValueProperty: Int32Property = workspace.rootProperty.resolvePath("dice.diceValue")! as Int32Property;
      diceValueProperty.setValue(value);
    }
  }

  const commit = () => {
    workspace.commit();
    resetRemoteValue();
  }

  const merge = () => {
    const tree: SharedPropertyTree = workspace.tree;
    const remoteTip: SerializedChangeSet = tree.remoteTipView;
    const remoteValue = remoteTip.insert["hex:dice-1.0.0"].dice.Int32.diceValue.toString();
    updateProperty(workspace, remoteValue);
  }

  const displayRemoteValue = () => {
    return remoteValue === -1 ? "" : `(${remoteValue})*`
  }

  return (
    <div className="App">

      <div className="dice" onClick={() => roll()}>
        {diceValue}
      </div>

      <div id="dirty" className="dirty" onClick={() => merge()}>
        {displayRemoteValue()}
      </div>

      <div className="commit" onClick={() => commit()}>
        Commit
      </div>

    </div>
  );
}

function initializeTree(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {

  if (containerId === undefined) {

    rootProp.insert("dice", PropertyFactory.create("hex:dice-1.0.0", undefined, { "diceValue": "0" }));

    workspace.commit();
  }
}

function configureBinding(fluidBinder: DataBinder, workspace: Workspace, diceRenderer: DiceRenderer) {

  // Configure the Dice factories
  fluidBinder.defineRepresentation("view", "hex:dice-1.0.0", (property) => {
    return new Dice(0, diceRenderer);
  });

  // Define & Activate the DiceBinding
  fluidBinder.defineDataBinding("view", "hex:dice-1.0.0", DiceBinding, {
    upgradeType: UpgradeType.MINOR
  });

  fluidBinder.activateDataBinding("view");
}

