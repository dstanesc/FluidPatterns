import React, { useState, useEffect } from 'react';

import './App.css';



import { DataBinder } from "@fluid-experimental/property-binder";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import evolvableSchema from "./evolvable-1.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import { NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';



export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.
  registerSchema(evolvableSchema);


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




      const rootProp: NodeProperty = myWorkspace.rootProperty;


      initializeTree(containerId, rootProp, myWorkspace);

      // save workspace to react state
      setWorkspace(myWorkspace);
    }

    initWorkspace();

  }, []);


  const roll = () => {
    const newA = Math.floor(Math.random() * 1024) + 1;
    const newB = (Math.floor(Math.random() * 10000000) + 1).toString();    
   // const newC = (Math.floor(Math.random() * 10000000) + 1).toString();    
    const map = new Map<string, any>();
    map.set("numA",newA);
    map.set("strB",newB);
  //  map.set("strC",newB);
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
      <button>Create V1.0.0</button>
      <br></br> <br></br>
      <div >
        {renderLocalMap(localMap)}
      </div>
      <div className="commit" onClick={() => roll()}>
        Roll
      </div>
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
  return Array.from(mymap.keys()).map((key)=>
  (
    <tr style={{borderWidth:"2px", borderColor:"#aaaaaa", borderStyle:"solid"}}>
        <td>{key}</td><td>{mymap.get(key)}</td>
     </tr>
  ));
}

function renderProperty(property: any){
  const reactElem: any[] = [];
  reactElem.push((
    {property}
  ));
  return reactElem;
}


function initializeTree(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
  if (containerId === undefined) {
    rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": "0", "strB": "ABC" }));
    workspace.commit();
  }
}

function configureBinding(fluidBinder: DataBinder, workspace: Workspace, evolvableRenderer: EvolvableRenderer) {


  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(evolvableRenderer);
  });


  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding);
  fluidBinder.activateDataBinding("view");
}