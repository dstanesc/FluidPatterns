import React, { useState, useEffect } from 'react';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property, NamedProperty, StringProperty }
  from "@fluid-experimental/property-properties";

import { DataBinder, DataBinderHandle, UpgradeType } from "@fluid-experimental/property-binder";

import { SharedPropertyTree } from "@fluid-experimental/property-dds";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import schema from "./dice-1.0.0";

import { Operation, DEFAULT_CALL, DiceBindingController, DiceAdapterController } from "./diceController";

import { DiceBinding } from "./diceBinding";

import { PropCountRenderer, StatRenderer } from "./renderers";

import { DiceAdapter, DiceArrayBinderHandle } from './diceAdapter';

import { configureTypeBinding, unregisterTypeBinding, configurePathBinding, createDiceProperty, rollSingle, rollAll, removeAll, initWorkspace, initWorkspace2, sleep } from './diceApi';



export default function App() {

  const [opStat, setOpStat] = useState<Operation>(DEFAULT_CALL);

  const [workspace, setWorkspace] = useState<Workspace>();

  const [dataBinder, setDataBinder] = useState<DataBinder>();

  const [propCount, setPropCount] = useState<number>();

  //Binder handles
  const [binderHandle, setBinderHandle] = useState<DiceArrayBinderHandle>();

  const containerId = window.location.hash.substring(1) || undefined;

  const SLEEP_TIME = 0;

  useEffect(() => {

    initWorkspace(containerId, setDataBinder, setWorkspace, setLocationHash);

  }, []);

  const setLocationHash = (containerId: string) => {
    window.location.hash = containerId;
  }
  
  const load = async (size: number) => {
    for (let i = 0; i < size; i++) {
      await sleep(SLEEP_TIME);
      console.log(`Creating dice : ${i}`)
      createDiceProperty(i.toString(), workspace)
      setPropCount(i + 1);
    }
  }

  const roll = async (times: number) => {
    if (workspace) {
      for (let i = 0; i < times; i++) {
        await sleep(SLEEP_TIME);
        rollAll(i, workspace);
      }
    }
  }

  const remove = () => {
    removeAll(workspace);
    setPropCount(0);
    setOpStat(DEFAULT_CALL);
  }

  const bind = () => {

    configurePathBinding(dataBinder, workspace, new DiceAdapterController(setOpStat, setPropCount));

    //configureTypeBinding(dataBinder, workspace, setOpStat, setPropCount);
  }

  return (
    <div className="App">

      <span className="dice">
        Property Count {propCount}
      </span>

      <div className="dice">
        Latency {opStat.history} ms <br />
        Invocation Count {opStat.count}
      </div>

      <br /><br />


      <span className="commit" onClick={() => bind()}>
        Config
      </span>

      <span className="commit" onClick={() => load(10)}>
        Load
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

