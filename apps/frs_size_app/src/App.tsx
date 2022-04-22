import React, { useState, useEffect } from 'react';

import './App.css';



import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import evolvableSchema100 from "./evolvable-1.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import {  Int32Property, NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
import { createSimpleWorkspace, SimpleWorkspace} from "./tracking/workspaces";
import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from '@fluid-experimental/property-dds';





export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

  const [workspace, setWorkspace] = useState<SimpleWorkspace>();


  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.

  PropertyFactory.register(Object.values([evolvableSchema100]));



  useEffect(() => {

    async function initWorkspace() {
    window.sessionStorage.setItem("Fluid.ContainerRuntime.MaxOpSizeInBytes","-1");
     

      
      const myWorkspace = await createSimpleWorkspace(containerId);

      const oldPrune = SharedPropertyTree.prune;
      const myPrune = (minimumSequenceNumber: number,
        remoteChanges: IPropertyTreeMessage[],
        unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>) => {
        console.log("Pruning Started : " + remoteChanges.length);
        const result=oldPrune(minimumSequenceNumber,remoteChanges,unrebasedRemoteChanges);
        console.log("Pruning Ended : " + result.remoteChanges.length);
        return result;
      }
      SharedPropertyTree.prune=myPrune;
      

      // Update location
      if (myWorkspace.containerId)
        window.location.hash = myWorkspace.containerId;

      const dataBinder: DataBinder = myWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setLocalMap);


      // save workspace to react state
      setWorkspace(myWorkspace);
      initialize100(containerId,myWorkspace.rootProperty,myWorkspace);
    }
    initWorkspace();    

  }, []);


  return (

    

    <div className="App">
    <h1>Operation Size Example</h1>

    <button disabled={checkBigEnabled()} onClick={() => {

const myItem1=window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes")
console.log("miso 3");
console.log(myItem1);

        window.sessionStorage.setItem("Fluid.ContainerRuntime.MaxOpSizeInBytes","-1");
        const myItem2=window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes")
        console.log("miso 4");
        console.log(myItem2);


        roll(workspace);
     }
  }>{"Big ON"}</button>
    

    <button disabled={!checkBigEnabled()} onClick={() => {
        const myItem3=window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes")
        console.log("miso 1");
        console.log(myItem3);

       window.sessionStorage.removeItem("Fluid.ContainerRuntime.MaxOpSizeInBytes");

        const myItem4=window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes")
        console.log("miso 2");
        console.log(myItem4);
        roll(workspace);
     }
  }>{"Big OFF"}</button>

<br></br><br></br>
    

  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===768000} 
  onChange={()=>setCommitSizeCheckbox(workspace,768000)}></input>
  <b>768000B</b>

  
  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===768001} 
  onChange={()=>setCommitSizeCheckbox(workspace,768001)}></input>
  <b>768001B</b>

  
  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,oneMb)}></input>
<b>1MB</b>



<input type="checkbox" id="commitSizeCheckbox2" name="commitSize" checked={readCommitSize(workspace)===2*oneMb} 
    onChange={()=>setCommitSizeCheckbox(workspace,2*oneMb)}></input>
<b>2MB</b>

 
  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===10*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,10*oneMb)}></input>
 <b>10MB</b>


  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===20*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,20*oneMb)}></input>
<b>20MB</b>


  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===100*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,100*oneMb)}></input>
<b>100MB</b>



<br></br><br></br>
<input type="text" id="commitSize" name="commitSize" value={readCommitSize(workspace)} 
    onChange={()=>setCommitSize(workspace)}></input>



 <button onClick={() => {
   const myInput = document.getElementById("commitSize") as HTMLInputElement;
   genBig(workspace,parseInt(myInput.value));     }
  }>{"BigCommit"}</button>
       <br></br><br></br><br></br>
      <h2>Property Sizes</h2>
      <div >
        {renderPropSize(workspace)}
      </div>
    </div>
  );
}



// By default, we should reject any op larger than 768KB,
// in order to account for some extra overhead from serialization
// to not reach the 1MB limits in socket.io and Kafka.
const defaultMaxOpSizeInBytes = 768000;

const oneMb = 1024*1024;
const oneKb = 1024;


function checkBigEnabled(): boolean{
  const bigState = window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes");
  const isBig = bigState === "-1";
  return isBig;
}

function readCommitSize(workspace){
  if(!workspace) return -1;
  const rootProp: NodeProperty = workspace.rootProperty;
  let commitSizeProp = rootProp.resolvePath("commitSize") as Int32Property;
  if(!commitSizeProp){
    commitSizeProp=PropertyFactory.create("Int32");
    rootProp.insert("commitSize",commitSizeProp);
    commitSizeProp.value=2*oneMb;    
  }  
  console.log("read " + commitSizeProp.value);
  const size = commitSizeProp.value;
  return commitSizeProp.value;  
}

function setCommitSize(workspace){
  if(!workspace) return -1;
  const rootProp: NodeProperty = workspace.rootProperty;
  let commitSizeProp = rootProp.resolvePath("commitSize") as Int32Property;
  if(!commitSizeProp){
    commitSizeProp=PropertyFactory.create("Int32");
    rootProp.insert("commitSize",commitSizeProp);
       
  }  
  const myInput = document.getElementById("commitSize") as HTMLInputElement;
  commitSizeProp.value=myInput.value;
  roll(workspace);
}

function setCommitSizeCheckbox(workspace, size:number){
  if(!workspace) return -1;
  const rootProp: NodeProperty = workspace.rootProperty;
  let commitSizeProp = rootProp.resolvePath("commitSize") as Int32Property;
  if(!commitSizeProp){
    commitSizeProp=PropertyFactory.create("Int32");
    rootProp.insert("commitSize",commitSizeProp);
       
  }  
  commitSizeProp.value=size.toString();
  roll(workspace);
}




const roll = (workspace) => {
  const map = new Map<string, any>();
  const numA: number = parseInt(workspace.tree.root.resolvePath("evolvable.numA").value);
  if(numA>=999999){
    map.set("numA","0");
  }
  else {
    map.set("numA",(numA + 1).toString());
  }    
  updateProperty(workspace,map);
}


const updateProperty = (workspace: SimpleWorkspace, value: Map<string,any>) => {
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

function computePropSize(workspace: SimpleWorkspace){
  const bigProp = workspace.tree.root.resolvePath("big") as NodeProperty;
  if(bigProp){
    let size = 0;
    const dynamicIds = bigProp.getDynamicIds()
    dynamicIds.forEach((propId)=>{
      const strprop = bigProp.resolvePath(propId) as StringProperty;
      size += strprop.value.length;
    })
    return size;
  }
  else {
    return -1;
  }
}


function renderPropSizeTableContent(workspace: SimpleWorkspace){
  const reactElem: any[] = [];
  const bigProp = workspace.tree.root.resolvePath("big") as NodeProperty;
  if(bigProp){
    let size = 0;
    const dynamicIds = bigProp.getDynamicIds()
    dynamicIds.forEach((propId)=>{
      const strprop = bigProp.resolvePath(propId) as StringProperty;
      reactElem.push(
        <tr><td className="propcell">{propId}</td><td className="sizecell">{strprop.value.length}</td></tr>
      )
    })
  }
  return reactElem
}


function renderPropSize(workspace: SimpleWorkspace){  
  const reactElem: any[] = [];
  if(!workspace) return reactElem;

  reactElem.push((
    <table className="evotable">
    <tr><th>Property</th><th>Size</th></tr>  
    { renderPropSizeTableContent(workspace)}
    <tr><td className="totalpropcell">Total</td><td className="totalsizecell">{computePropSize(workspace)}</td></tr>  
    </table>
  ));
  return reactElem;
}






function genBig(workspace, size: number){
  const rootProp: NodeProperty = workspace.rootProperty;
    let bigProp = rootProp.resolvePath("big") as NodeProperty;
    if(!bigProp){
      bigProp=PropertyFactory.create("NodeProperty");
      rootProp.insert("big",bigProp);
    }
    const bigStrProp=PropertyFactory.create("String");
    const propName = "big_" + Math.floor(200000000*Math.random()).toString();
    bigProp.insert(propName,bigStrProp);
    let str="";
    for(let i=0;i<size;i++){
      str+=Math.floor(10*Math.random()).toString();
    }
    bigStrProp.value=str;
    roll(workspace);
}



function initialize100(containerId: string | undefined, rootProp: NodeProperty, workspace: SimpleWorkspace) {
    if(!rootProp.resolvePath("evolvable")){
      rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": 0}));
      workspace.commit();  
    }
}



function configureBinding(fluidBinder: DataBinder, workspace: SimpleWorkspace, evolvableRenderer: EvolvableRenderer) {
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");



}