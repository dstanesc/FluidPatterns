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
import { NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';



export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.
  registerSchema(evolvableSchema100);
  registerSchema(evolvableSchema101);
  registerSchema(evolvableSchema102);
  registerSchema(evolvableSchema103);
  registerSchema(evolvableSchema200);


  useEffect(() => {

    async function initWorkspace() {

      // Initialize the workspace
      const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

      const myWorkspace: Workspace = boundWorkspace.workspace;

      // Update location
      if (myWorkspace.containerId)
        window.location.hash = myWorkspace.containerId;

      const dataBinder: DataBinder = boundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setLocalMap);


      // save workspace to react state
      setWorkspace(myWorkspace);
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
            prop.setValue(value); 
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
      <h2>Data table</h2>    
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