import React, { useState, useEffect } from 'react';

import './App.css';
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import evolvableSchema100 from "./evolvable-1.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import { NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
import { createHistoryWorkspace, HistoryWorkspace, TrackedWorkspace } from "./interfaces";


const roll = (isCommit: boolean, myVar: string, workspace: HistoryWorkspace) => {
  const map = new Map<string, any>();
  const numA: number = parseInt(workspace.getTracked().tree.root.resolvePath("evolvable." + myVar).value);
  if (numA >= 999999) {
    map.set(myVar, "0");
  }
  else {
    map.set(myVar, (numA + 1).toString());
  }
  updateProperty(workspace, map);
  if (isCommit) {
    workspace.commit();
  }
}


const updateProperty = (workspace: HistoryWorkspace, value: Map<string, any>) => {
  if (workspace) {
    value.forEach((value, key) => {
      const prop = workspace.getTracked().rootProperty.resolvePath("evolvable." + key);
      if (prop !== undefined) {
        if (prop instanceof ValueProperty || prop instanceof StringProperty) {
          prop.value = value;
        }
      }
    });
  }
}


function renderOne(myVar: string, mymap: Map<string, any>, workspace: HistoryWorkspace, intervalId, setIntervalId) {
  const reactElem: any[] = [];
  const numA = mymap.get(myVar);
  const a0 = numA % 10;
  const a1 = (Math.floor(numA / 10)) % 10;
  const a2 = (Math.floor(numA / 100)) % 10;
  const a3 = (Math.floor(numA / 1000)) % 10;
  const a4 = (Math.floor(numA / 10000)) % 10;
  const a5 = (Math.floor(numA / 100000)) % 10;
  reactElem.push(
    <table className="evotable">
      <tr>
        <td className="typecell">{a5}</td>
        <td className="typecell">{a4}</td>
        <td className="typecell">{a3}</td>
        <td className="typecell">{a2}</td>
        <td className="typecell">{a1}</td>
        <td className="typecell">{a0}</td>
      </tr>
    </table>
  );

  reactElem.push(
    <button onClick={() => {
      const h = setInterval(() => roll(true, myVar, workspace), 1);
      setIntervalId(h);
    }
    }>{"Drive"}</button>
  );
  reactElem.push(
    <button onClick={() => {
      clearInterval(intervalId);
    }
    }>{"Stop"}</button>);
  reactElem.push(
    <button onClick={() => roll(false, myVar, workspace)}>
      Roll
    </button>
  );
  return reactElem;
}

function renderLocalMap(mymap: Map<string, any>, workspace: HistoryWorkspace, intervalId, setIntervalId) {
  const reactElem: any[] = [];
  reactElem.push((
    renderOne("numA", mymap, workspace, intervalId, setIntervalId)
  ));
  reactElem.push((<div><br></br><br></br></div>));
  reactElem.push((
    renderOne("numB", mymap, workspace, intervalId, setIntervalId)
  ));
  reactElem.push((<div><br></br><br></br></div>));
  reactElem.push((
    renderOne("numC", mymap, workspace, intervalId, setIntervalId)
  ));


  return reactElem;
}

function initialize100(containerId: string | undefined, rootProp: NodeProperty, workspace: TrackedWorkspace) {
  if (!rootProp.resolvePath("evolvable")) {
    rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": 0 }));
    workspace.commit();
  }
}

function configureBinding(fluidBinder: DataBinder, workspace: TrackedWorkspace, evolvableRenderer: EvolvableRenderer) {
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(), evolvableRenderer);
  }, { upgradeType: UpgradeType.MINOR });
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding, { upgradeType: UpgradeType.MINOR });
  fluidBinder.activateDataBinding("view");
}



export default function App() {
  const [localMap, setLocalMap] = useState(new Map<string, any>());

  const [workspace, setWorkspace] = useState<HistoryWorkspace>();

  const [intervalId, setIntervalId] = useState<any>();

  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.

  PropertyFactory.register(Object.values([evolvableSchema100]));



  useEffect(() => {

    async function initWorkspace() {

      const historyWorkspace = await createHistoryWorkspace(containerId);
      const tracked = await historyWorkspace.getTracked();
      historyWorkspace.setAutoPersist(false);

      // Update location
      if (tracked.containerId)
        window.location.hash = tracked.containerId;

      const dataBinder: DataBinder = tracked.dataBinder;

      // Configure binding
      configureBinding(dataBinder, tracked, setLocalMap);

      setWorkspace(historyWorkspace);
      initialize100(containerId, tracked.rootProperty, tracked);
    }
    initWorkspace();

  }, []);

  return (
    <div className="App">
      <h1>History Example</h1>
      <br></br>
      <button onClick={() => {
        workspace.move(-1);
        console.count("move down button end ");
      }
      }>{"<"}</button>
      <button onClick={() => {
        workspace.move(+1);
      }
      }>{">"}</button>

      <button onClick={() => {
        workspace.commit();
      }
      }>{"Commit"}</button>

      <button onClick={() => {
        workspace.persistPoint();
        workspace.commit();
      }
      }>{"Persist"}</button>

      <br></br><br></br><br></br>
      <div >
        {renderLocalMap(localMap, workspace, intervalId, setIntervalId)}
      </div>
      <br></br><br></br><br></br>

    </div>
  );
}

