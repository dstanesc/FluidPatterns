import React, { useState, useEffect } from 'react';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property, NamedProperty }
  from "@fluid-experimental/property-properties";

import { DataBinder, DataBinderHandle, UpgradeType } from "@fluid-experimental/property-binder";

import { SharedPropertyTree } from "@fluid-experimental/property-dds";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import diceSchema from "./dice-1.0.0";

import diceSchemaNext from "./dice-1.1.0";

import { Call, DEFAULT_CALL, DiceController } from "./diceController";

import { DiceBinding } from "./diceBinding";

import { PropCountRenderer, StatRenderer } from "./renderers";

import { DiceAdapter, DiceArrayBinderHandle } from './diceAdapter';



export default function App() {

  const [callStat, setCallStat] = useState<Call>(DEFAULT_CALL);

  const [workspace, setWorkspace] = useState<Workspace>();

  const [dataBinder, setDataBinder] = useState<DataBinder>();

  const [propCount, setPropCount] = useState<number>();

  //Binder handles
  const [binderHandle, setBinderHandle] = useState<DiceArrayBinderHandle>();

  const containerId = window.location.hash.substring(1) || undefined;

  const SLEEP_TIME = 0;

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

      setDataBinder(dataBinder);

      // Configure binding
      

      // save workspace to react state
      setWorkspace(myWorkspace);
    }

    initWorkspace();

  }, []);

  const bindPaths = () => {
    
    // configurePathBinding(dataBinder, workspace, new DiceController(setCallStat, setPropCount));

    configureTypeBinding(dataBinder, workspace, setCallStat, setPropCount);
  }

  const load = async (size: number) => {
    const rootProp: NodeProperty = workspace.rootProperty;
    
    for (let i = 0; i < size; i++) {
      await sleep(SLEEP_TIME);
      console.log(`Creating dice : ${i}`)
      rootProp.insert(i.toString(), PropertyFactory.create("hex:dice-1.1.0", undefined, { "diceValue": "0", "diceColor": "green" }));
      setPropCount(i+1);
      workspace.commit();
    }
  }

  const roll = async (times: number) => {
    if (workspace) {
      const rootProp: NodeProperty = workspace.rootProperty;
      const keys: string[] = rootProp.getDynamicIds();
      for (let i = 0; i < times; i++) {
        await sleep(SLEEP_TIME);
        keys.forEach(key => {
          const newValue = Math.floor(Math.random() * 1024) + 1;
          console.log(`Setting dyn dice value: ${key}`)
          const diceProperty = rootProp.get(key) as NamedProperty;
          const diceValueProperty: Int32Property = diceProperty.get("diceValue") as Int32Property;
          diceValueProperty.setValue(newValue);
          workspace.commit();
        });
      }
    }
  }

  const remove = () => {
    const rootProp: NodeProperty = workspace.rootProperty;
    const keys: string[] = rootProp.getDynamicIds();
    keys.forEach(key => {
      console.log(`Removing dyn key: ${key}`)
      rootProp.remove(key);
    });
    workspace.commit();
    setPropCount(0);
    setCallStat(DEFAULT_CALL);
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  return (
    <div className="App">

      <span className="dice">
        Property Count {propCount}
      </span>

      <div className="dice">
        Latency {callStat.latency - SLEEP_TIME}/{callStat.avg - SLEEP_TIME} / {callStat.history} ms <br />
        Invocation Count {callStat.count}
      </div>

      <br /><br />

      <span className="commit" onClick={() => load(10)}>
        Create
      </span>

      <span className="commit" onClick={() => bindPaths()}>
        Bind
      </span>

      <span className="commit" onClick={() => roll(10)}>
        Roll
      </span>

      <span className="commit" onClick={() => remove()}>
        Delete
      </span>

    </div>
  );
}

function configureTypeBinding(fluidBinder: DataBinder, workspace: Workspace, statRenderer: StatRenderer, propCountRenderer: PropCountRenderer) {

  // Configure the Dice factories
  fluidBinder.defineRepresentation("view", "hex:dice-1.1.0", (property) => {
    return new DiceController(statRenderer, propCountRenderer);
  });

  // Define & Activate the DiceBinding
  fluidBinder.defineDataBinding("view", "hex:dice-1.1.0", DiceBinding);

  fluidBinder.activateDataBinding("view");
}

function configurePathBinding(dataBinder: DataBinder, workspace: Workspace, diceController: DiceController) {
  const rootProp: NodeProperty = workspace.rootProperty;
  const adapter: DiceAdapter = new DiceAdapter(diceController);
  const handles: DataBinderHandle[] = [];
  const keys: string[] = rootProp.getDynamicIds();
  handles.push(dataBinder.registerOnPath("", ["collectionInsert"], adapter.diceModify.bind(adapter), { isDeferred: true }));
  keys.forEach(key => {
    const path = `${key}`;
    console.log(`registerOnPath: ${path}`)
    handles.push(dataBinder.registerOnPath(path, ["modify"], adapter.diceModify.bind(adapter), { isDeferred: true }));
  });
  return new DiceArrayBinderHandle(handles);
}