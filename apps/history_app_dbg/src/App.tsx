import React, { useState, useEffect } from 'react';

import './App.css';



import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import evolvableSchema100 from "./evolvable-1.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import {  NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
import { createHistoryWorkspace, HistoryWorkspace, TrackedWorkspace } from "./interfaces";
import { ChangeSet } from '@fluid-experimental/property-changeset';
import { IRemotePropertyTreeMessage } from '@fluid-experimental/property-dds';


function cloneChange(changeSet): ChangeSet {
  return new ChangeSet(JSON.parse(JSON.stringify(changeSet)));
}

export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

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
      initialize100(containerId,tracked.rootProperty,tracked);
    }
    initWorkspace();    

  }, []);


  const roll = () => {
    const map = new Map<string, any>();
    const numA: number = parseInt(workspace.getTracked().tree.root.resolvePath("evolvable.numA").value);
    if(numA>=999999){
      map.set("numA","0");
    }
    else {
      map.set("numA",(numA + 1).toString());
    }    
    updateProperty(workspace,map);
  }


  const updateProperty = (workspace: HistoryWorkspace, value: Map<string,any>) => {
    if (workspace) {
      value.forEach((value,key) => {
        const prop = workspace.getTracked().rootProperty.resolvePath("evolvable." +  key);
        if(prop !== undefined){
          if(prop instanceof ValueProperty || prop instanceof StringProperty){
            prop.value = value; 
          }
        }
      });
      workspace.commit();
    }
  }

  return (

    

    <div className="App">
    <h1>Squashing Example</h1>
    <br></br>
      <button onClick={() => {   
          workspace.move(-1);
      }      
      }>{"<"}</button>



<button onClick={() => {
      workspace.move(+1);
      }      
      }>{">"}</button>


<button onClick={() => {   
      const h=setInterval(()=>roll(),1);
      setIntervalId(h);
      }      
      }>{"Drive"}</button>

<button onClick={() => {   
      clearInterval(intervalId);
      workspace.getTracked().tree.commit();
      }      
      }>{"Stop"}</button>


<button onClick={() => {   
      workspace.persistPoint();
      workspace.commit();
      }      
      }>{"Persist"}</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = (workspace as any)._dual.tracker.rootProperty;
        const hist = (workspace as any)._dual.tracker.tracker.list();
        for(let i=0;i < hist.length; i++){
          console.log("--------SQUASHED--------------");
          console.log("------------------------------------");
          console.log(hist[i].lastSeq);
          console.log("------------------------------------");
          console.log(JSON.stringify(cloneChange(hist[i].changeset).getSerializedChangeSet()));
          console.log("------------------------------------");
        }
        const myRemoteChanges = workspace.getTracked().tree.remoteChanges;
        for(let i=0;i < myRemoteChanges.length; i++){
          console.log("---------CURRENT-----------------");
          console.log((myRemoteChanges[i] as IRemotePropertyTreeMessage).sequenceNumber);
          console.log("------------------------------------");
          console.log(JSON.stringify(cloneChange(myRemoteChanges[i].changeSet).getSerializedChangeSet()));
          console.log("------------------------------------");
        }
        
      }      
      }>{"Debug"}</button>


       <br></br><br></br><br></br>
 
      <h2>Odometer</h2>
      <div >
        {renderLocalMap(localMap)}
      </div>
      <br></br><br></br><br></br>
      <button className="commit" onClick={() => roll()}>
        Roll
      </button>
    </div>
  );
}




function renderLocalMap(mymap: Map<string,any>){
  const reactElem: any[] = [];
  reactElem.push((
  <table className="evotable">
  {renderRoot(mymap)}
  </table>
  ));
  return reactElem;
}


function renderRoot(mymap: Map<string,any>){
  const reactElem: any[] = [];
  
  const numA=mymap.get("numA");
  const a0 = numA%10;
  const a1 = (Math.floor(numA/10))%10;
  const a2 = (Math.floor(numA/100))%10;
  const a3 = (Math.floor(numA/1000))%10;
  const a4 = (Math.floor(numA/10000))%10;
  const a5 = (Math.floor(numA/100000))%10;
  reactElem.push(
      <tr>
          <td className="typecell">{a5}</td>
          <td className="typecell">{a4}</td>
          <td className="typecell">{a3}</td>
          <td className="typecell">{a2}</td>
          <td className="typecell">{a1}</td>
          <td className="typecell">{a0}</td>
       </tr>
    );
  return reactElem;
}






function initialize100(containerId: string | undefined, rootProp: NodeProperty, workspace: TrackedWorkspace) {
    if(!rootProp.resolvePath("evolvable")){
      rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": 0}));
      workspace.commit();  
    }
}



function configureBinding(fluidBinder: DataBinder, workspace: TrackedWorkspace, evolvableRenderer: EvolvableRenderer) {
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");



}