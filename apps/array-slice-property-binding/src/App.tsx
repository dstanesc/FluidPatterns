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

import { retrieveArrayProperty, retrieveValueProperty, createDiceProperty, initPropertyTree, configureBinding, activateSliceBinding, activateViewBinding } from "./diceArrayApi";


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
          props.cells.map((value: any, i: any) => <Cell key={i} value={value} onClick={() => props.onClick(i)} />)
        }
      </div>
    </div>
  );
}

interface Slice {

  start: number;

  end: number;
}

export default function App() {

  // UI Model, array of dice values
  const [diceValues, setDiceValues] = useState<number[]>([]);

  // Workspace reference, pseudo-immutable
  const [boundWorkspace, setBoundWorkspace] = useState<BoundWorkspace>();

  // Dice rolling state
  const [rollToggle, setRollToggle] = useState<boolean>(false);

  // Add button state
  const [addToggle, setAddToggle] = useState<boolean>(false);

  // Add button state
  const [sliceToggle, setSliceToggle] = useState<Slice | undefined>(undefined);

  const containerId = window.location.hash.substring(1) || undefined;


  useEffect(() => {

    async function initWorkspace() {

      // Register the templates used to instantiate properties.
      registerSchema(diceSchema);
      registerSchema(diceArraySchema);

      // Initialize the workspace
      const myBoundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

      const myWorkspace: Workspace = myBoundWorkspace.workspace;

      const dataBinder: DataBinder = myBoundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setDiceValues);

      //Initialize the property tree
      initPropertyTree(containerId, myWorkspace, setDiceValues);

      // Make workspace available
      setBoundWorkspace(myBoundWorkspace);

      // Everything good, update browser location with container identifier
      window.location.hash = myWorkspace.containerId;
    }

    initWorkspace();

  }, []); // [] to be executed only once

  useEffect(() => {
    if (rollToggle) {
      roll();
    }

  }, [diceValues, rollToggle]);

  const add = () => {
    const workspace: Workspace = boundWorkspace.workspace;
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    const diceProperty = createDiceProperty(0);
    diceArrayProperty?.push(diceProperty);
    workspace.commit();
  }

  const roll = () => {

    const workspace: Workspace = boundWorkspace.workspace;
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    for (let i = 0; i < diceArrayProperty.length; i++) {
      const diceValueProperty: Int32Property = retrieveValueProperty(diceArrayProperty, i);
      diceValueProperty.setValue(Math.floor(Math.random() * 99) + 1);
    }
    workspace.commit();
  }

  const remove = (i: number) => {
    const workspace: Workspace = boundWorkspace.workspace;
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    diceArrayProperty.remove(i);
    workspace.commit();
  }

  const toggleSlicing = (start: number, end: number) => {
    const dataBinder: DataBinder = boundWorkspace.dataBinder;
    if (sliceToggle) {
      setSliceToggle(undefined);
      activateViewBinding(dataBinder);
    } else {
      setSliceToggle({ start, end });
      activateSliceBinding(dataBinder, start, end);
    }
  }

  const toggleRolling = () => {
    setRollToggle(!rollToggle);
  }

  const sliceClass = () => {
    return sliceToggle ? "slice-active" : "slice-inactive";
  }

  const rollClass = () => {
    return rollToggle ? "roll-active" : "roll-inactive";
  }

  const toggleAdd = () => {
    setAddToggle(!addToggle);
  }

  const addClass = () => {
    return addToggle ? "add-active" : "add-inactive";
  }

  return (
    <div className="App">

      <div className="dices">
        <Row cells={diceValues} onClick={(i: any) => remove(i)}></Row>
      </div>

      <br /><br />

      <span className={addClass()} onClick={() => add()} onMouseDown={() => toggleAdd()} onMouseUp={() => toggleAdd()}>
        Add
      </span>

      <span className={rollClass()} onClick={() => toggleRolling()}>
        Roll
      </span>

      <span className={sliceClass()} onClick={() => toggleSlicing(0, 3)}>
        1..3
      </span>

    </div>
  );
}

