import React, { useState, useEffect } from 'react';

import './App.css';



import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import evolvableSchema100 from "./evolvable-1.0.0";
import evolvableSchema101 from "./evolvable-1.0.1";
import evolvableSchema102 from "./evolvable-1.0.2";
import evolvableSchema103 from "./evolvable-1.0.3";
import evolvableSchema200 from "./evolvable-2.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import { ArrayProperty, NodeProperty, PropertyFactory, StringArrayProperty, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
import { IRemotePropertyTreeMessage, SharedPropertyTree } from '@fluid-experimental/property-dds';
import { ChangeSet } from '@fluid-experimental/property-changeset';
import { Console } from 'console';


function cloneChange(changeSet): ChangeSet {
  return new ChangeSet(JSON.parse(JSON.stringify(changeSet)));
}

export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

  const [workspace, setWorkspace] = useState<Workspace>();

  const [log, setLog] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.

  PropertyFactory.register(Object.values([evolvableSchema100,evolvableSchema101,evolvableSchema102,evolvableSchema103,evolvableSchema200]));



  useEffect(() => {

    async function initWorkspace() {





      // Initialize the workspace
      const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);
      const myWorkspace: Workspace = boundWorkspace.workspace;
      const myRoot = myWorkspace.tree.root;
      let logWorkspaceProp = myWorkspace.tree.root.resolvePath("logDDS");
      let logContainerId = logWorkspaceProp?(logWorkspaceProp as StringProperty).getValue():undefined;
      const boundLog: BoundWorkspace = await initializeBoundWorkspace(logContainerId);
      const myLogWorkspace: Workspace = boundLog.workspace;
      const myLogRoot = myLogWorkspace.tree.root;
      if(!logWorkspaceProp){
        logContainerId=myLogWorkspace.containerId;
        logWorkspaceProp =  PropertyFactory.create("String","single") as StringProperty;
        logWorkspaceProp.value = logContainerId;
        myRoot.insert("logDDS",logWorkspaceProp);  
        myWorkspace.commit();
      }
  


      const origPrune = (SharedPropertyTree as any).prune as any;


      const myPrune = (
        minimumSequenceNumber: number,
        remoteChanges: IRemotePropertyTreeMessage[],
        unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>,
    ) => {
        console.log("Miso MyPrune invoked");
        let isHistory =  false;
        remoteChanges.forEach((rch) => {
            const rchstr = JSON.stringify(rch);
            if(rchstr.includes("history_buffer")){
              isHistory=true;
            }
        });
        const origResult = origPrune(
            minimumSequenceNumber,
            remoteChanges,
            unrebasedRemoteChanges
        );
        if(isHistory){
          return origResult;
        }
        const prunedRemoteChanges = origResult.remoteChanges;
        const removedRemoteChanges = remoteChanges.slice(0,remoteChanges.length - prunedRemoteChanges.length);
        if(removedRemoteChanges.length>0){
          const firstChange = cloneChange(removedRemoteChanges[0].changeSet);
          for(let i=1;i<removedRemoteChanges.length;i++){
            const nextChange = cloneChange(removedRemoteChanges[i].changeSet);
            console.log(JSON.stringify(nextChange.getSerializedChangeSet()));
            
            firstChange.applyChangeSet(nextChange);
          }
          const mySerialized = JSON.stringify(firstChange.getSerializedChangeSet());
          let historyBufferProp = myLogRoot.resolvePath("history_buffer");
          if(historyBufferProp === undefined){
            historyBufferProp =  PropertyFactory.create("String","array");
            myLogRoot.insert("history_buffer",historyBufferProp);            
          }
          (historyBufferProp as StringArrayProperty).push(mySerialized);
          myLogWorkspace.commit();
        }        
        return origResult;
    };

    SharedPropertyTree.prune=myPrune;

      // Update location
      if (myWorkspace.containerId)
        window.location.hash = myWorkspace.containerId;

      const dataBinder: DataBinder = boundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setLocalMap);


      // save workspace to react state
      setWorkspace(myWorkspace);
      setLog(myLogWorkspace);
    }

    initWorkspace();

  }, []);


  const roll = () => {
    const map = new Map<string, any>();
    map.set("numA",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strB",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strC",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strD",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strE",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strF",(Math.floor(Math.random() * 10000000) + 1).toString());
    map.set("strG",(Math.floor(Math.random() * 10000000) + 1).toString());
    updateProperty(workspace,map);
  }


  const updateProperty = (workspace: Workspace, value: Map<string,any>) => {
    if (workspace) {
      value.forEach((value,key) => {
        const prop = workspace.rootProperty.resolvePath("evolvable." +  key);
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
    <h1>Evolution Example</h1>
    <h2>Init Schema</h2>
      <button onClick={() => {    
        const rootProp: NodeProperty = log.rootProperty;
        const hist = rootProp.resolvePath("history_buffer") as StringArrayProperty;
        const lastChangeSerialized = hist.get(hist.length-1);
        const lastChangeset = new ChangeSet(JSON.parse(lastChangeSerialized));
        lastChangeset.toInverseChangeSet();
        const changesOfLastChangeset = lastChangeset._changes;
        workspace.tree.root.applyChangeSet(changesOfLastChangeset);
      }      
      }>{"<"}</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = log.rootProperty;
        const hist = rootProp.resolvePath("history_buffer") as StringArrayProperty;
        for(let i=0;i < hist.length; i++){
          console.log("------------------------------------");
          console.log(i);
          console.log("------------------------------------");
          console.log(hist.get(i));
          console.log("------------------------------------");
        }
        
      }      
      }>{"Debug"}</button>


       <br></br><br></br>
 
      <h2>Init Schema</h2>
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize100(containerId, rootProp, workspace);}}>Create V1.0.0</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize101(containerId, rootProp, workspace);}}>Create V1.0.1</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize102(containerId, rootProp, workspace);}}>Create V1.0.2</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize103(containerId, rootProp, workspace);}}>Create V1.0.3</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize200(containerId, rootProp, workspace);}}>Create V2.0.0</button>

      <br></br><br></br>
      <h2>Evolve Schema</h2>      
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        to100(containerId, rootProp, workspace);}}>To V1.0.0</button>
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        to101(containerId, rootProp, workspace);}}>To V1.0.1</button>   
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        to102(containerId, rootProp, workspace);}}>To V1.0.2</button>
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        to103(containerId, rootProp, workspace);}}>To V1.0.3</button>       
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        to200(containerId, rootProp, workspace);}}>To V2.0.0</button>            
      <br></br> <br></br>
      <h2>Data Table</h2>    
      <div >
        {renderLocalMap(localMap)}
      </div>
      <br></br><br></br>
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
     <th>{"Attribute"}</th><th>{"Value"}</th>
  {renderRoot(mymap)}
  </table>
  ));
  return reactElem;
}


function renderRoot(mymap: Map<string,any>){
  const reactElem: any[] = [];
  reactElem.push(
    Array.from(mymap.keys()).filter((key)=>key=="typeId").map((key)=>
    (
      <tr>
          <td className="typecell">{key}</td><td className="typecell">{mymap.get(key)}</td>
       </tr>
    )));
  reactElem.push(
  Array.from(mymap.keys()).filter((key)=>key!=="typeId").sort().map((key)=>
  (
    <tr>
        <td className="attrcell">{key}</td><td className="attrcell">{mymap.get(key)}</td>
     </tr>
  )));
  return reactElem;
}

function removeEvolvable(rootProp: NodeProperty){
  if(rootProp.resolvePath("evolvable")){
    rootProp.remove("evolvable");
  }
}


function to100(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let numA = (rootProp.resolvePath("evolvable.numA") as ValueProperty)?.getValue();
  if(!numA){
      numA = -1;
  }
  let strB = (rootProp.resolvePath("evolvable.strB") as ValueProperty)?.getValue();
  if(!strB){
    strB = "-";
  }
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": numA, "strB": strB }));
  workspace.commit();  
}

function to101(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let numA = (rootProp.resolvePath("evolvable.numA") as ValueProperty)?.getValue();
  if(!numA){
      numA = -1;
  }
  let strC = (rootProp.resolvePath("evolvable.strC") as ValueProperty)?.getValue();
  if(!strC){
    strC = "-";
  }
  let strB = (rootProp.resolvePath("evolvable.strB") as ValueProperty)?.getValue();
  if(!strB){
    strB = "-";
  }
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.1", undefined, 
      { "numA": numA, "strB": strB, "strC": strC }));
  workspace.commit();
}

function to102(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let numA = (rootProp.resolvePath("evolvable.numA") as ValueProperty)?.getValue();
  if(!numA){
      numA = -1;
  }
  let strC = (rootProp.resolvePath("evolvable.strC") as ValueProperty)?.getValue();
  if(!strC){
    strC = "-";
  }
  let strD = (rootProp.resolvePath("evolvable.strD") as ValueProperty)?.getValue();
  if(!strD){
    strD = "-";
  }
  removeEvolvable(rootProp);
   rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.2", undefined, 
      { "numA": numA, "strD": strD, "strC": strC }));
  workspace.commit();
}


function to103(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let strE = (rootProp.resolvePath("evolvable.strE") as ValueProperty)?.getValue();
  if(!strE){
    strE = "-";
  }
  removeEvolvable(rootProp);
   rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.3", undefined, 
      {"strE": strE}));
  workspace.commit();
}


function to200(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {  
  let numA = (rootProp.resolvePath("evolvable.numA") as ValueProperty)?.getValue();
  if(!numA){
      numA = -1;
  }
  let strB = (rootProp.resolvePath("evolvable.strB") as ValueProperty)?.getValue();
  if(!strB){
    strB = "-";
  }
  let strF = (rootProp.resolvePath("evolvable.strF") as ValueProperty)?.getValue();
  if(!strF){
    strF = "-";
  }
  let strG = (rootProp.resolvePath("evolvable.strF") as ValueProperty)?.getValue();
  if(!strG){
    strG = "-";
  }
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-2.0.0", undefined, { "numA": numA, "strB": strB
  , "strF": strF, "strG": strG }));
  workspace.commit();  
}

function initialize100(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
    removeEvolvable(rootProp);
    rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": -1, "strB": "-" }));
    workspace.commit();
}

function initialize101(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.1", undefined, 
      { "numA": -1, "strB": "-", "strC": "-" }));
  workspace.commit();
}


function initialize102(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.2", undefined, 
      { "numA": -1, "strD": "-", "strC": "-" }));
  workspace.commit();
}

function initialize103(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.3", undefined, 
      { "strE": "-" }));
  workspace.commit();
}

function initialize200(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
  removeEvolvable(rootProp);
  rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-2.0.0", undefined, { "numA": -1, "strB": "-", "strF": "-", "strG": "-", }));
  workspace.commit();
}

function configureBinding(fluidBinder: DataBinder, workspace: Workspace, evolvableRenderer: EvolvableRenderer) {
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");

  fluidBinder.defineRepresentation("view", "hex:evolvable-2.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-2.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");

}