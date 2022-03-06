import React, { useState, useEffect } from 'react';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty }
  from "@fluid-experimental/property-properties";

import { DataBinder } from "@fluid-experimental/property-binder";

import { SharedPropertyTree } from "@fluid-experimental/property-dds";

import { copy as deepClone } from "fastest-json-copy";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import diceSchema from "./dice-1.0.0";

import diceArraySchema from "./diceArray-1.0.0";

import { retrieveArrayProperty, retrieveValueProperty, createDiceProperty, initPropertyTree, configureBinding } from "./diceArrayUtil";


/*
 * Cell react component, the atomic dice view
 */

function Cell(props: any) {
  return (
    <button className="dice" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

/*
 * Row react component, a collection of cells
 */

function Row(props: any) {
  return (
    <div>
      <div className="board-row">
        {
          props.cells.map((value: any, i: any) => <Cell value={value} onClick={() => props.onClick(i)} />)
        }
      </div>
    </div>
  );
}

export default function App() {

  // UI Model, array of dice values
  const [diceValues, setDiceValues] = useState<number[]>([]);

  // Workspace reference, pseudo-immutable
  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;


  useEffect(() => {

    async function initWorkspace() {

      // Register the templates used to instantiate properties.
      registerSchema(diceSchema);
      registerSchema(diceArraySchema);

      // Initialize the workspace
      const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

      const myWorkspace: Workspace = boundWorkspace.workspace;

      const dataBinder: DataBinder = boundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setDiceValues);

      //Initialize the property tree
      initPropertyTree(containerId,  myWorkspace, setDiceValues);

      // Make workspace available
      setWorkspace(myWorkspace);

      // Everything good, update browser location with container identifier
      window.location.hash = myWorkspace.containerId;
    }

    initWorkspace();

  }, []); // [] to be executed only once


  const addDice = () => {
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    const diceProperty = createDiceProperty(0);
    diceArrayProperty?.push(diceProperty);
    workspace.commit();
  }

  const roll = () => {
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    for (let i = 0; i < diceArrayProperty.length; i++) {
      const diceValueProperty: Int32Property = retrieveValueProperty(diceArrayProperty, i);
      diceValueProperty.setValue(Math.floor(Math.random() * 99) + 1);
    }
    workspace.commit();
  }

  return (
    <div className="App">

      <div className="dices">
        <Row cells={diceValues}></Row>
      </div>

      <br/><br/>

      <span className="add" onClick={() => addDice()}>
        Add
      </span>

      <span className="add" onClick={() => roll()}>
        Roll
      </span>

    </div>
  );
}

