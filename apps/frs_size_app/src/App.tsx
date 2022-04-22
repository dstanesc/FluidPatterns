import React, { useState, useEffect } from 'react';

import './App.css';



import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";

import evolvableSchema100 from "./evolvable-1.0.0";
import { EvolvableRenderer } from './evolvableRenderer';
import { Evolvable } from './evolvable';
import { EvolvableBinding } from './evolvableBinding';
import {  Int32Property, NodeProperty, PropertyFactory, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
import { createOneToOneTracking, TrackerWorkspace, TrackedWorkspace, SimpleWorkspace, DualWorkspace } from "./tracking/workspaces";
import { ChangeSet } from '@fluid-experimental/property-changeset';
import { IRemotePropertyTreeMessage } from '@fluid-experimental/property-dds';
import {loggerToMonitoringContext} from '@fluidframework/telemetry-utils'
import { ITelemetryBaseEvent, ITelemetryBaseLogger } from '@fluidframework/azure-client';


function cloneChange(changeSet): ChangeSet {
  return new ChangeSet(JSON.parse(JSON.stringify(changeSet)));
}

export default function App() {

  const [localMap, setLocalMap] = useState(new Map<string,any>()) ;

  const [workspace, setWorkspace] = useState<TrackedWorkspace>();

  const [log, setLog] = useState<TrackerWorkspace>();

  const [pos, setPos] = useState<number>(-1);

  const [intervalId, setIntervalId] = useState<any>();

  const [toRender, setToRender] = useState<number>(0);


  const containerId = window.location.hash.substring(1) || undefined;

  // Register the template which is used to instantiate properties.

  PropertyFactory.register(Object.values([evolvableSchema100]));



  useEffect(() => {

    async function initWorkspace() {
    window.sessionStorage.setItem("Fluid.ContainerRuntime.MaxOpSizeInBytes","-1");

      
      const trackedTracker = await createOneToOneTracking(containerId);
      const tracked = await trackedTracker.tracked;
      const tracker = await trackedTracker.tracker;

      // Update location
      if (tracked.containerId)
        window.location.hash = tracked.containerId;

      const dataBinder: DataBinder = tracked.dataBinder;

      // Configure binding
      configureBinding(dataBinder, tracked, setLocalMap);


      // save workspace to react state
      setWorkspace(tracked);
      setLog(tracker);
      initialize100(containerId,tracked.rootProperty,tracked);
    }
    initWorkspace();    

  }, []);


  const roll = () => {
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


  const updateProperty = (workspace: TrackedWorkspace, value: Map<string,any>) => {
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
    <h1>Squashing Example</h1>
    <br></br>
      <button onClick={() => {   
    

    const lastSquashedSeq=log.tracker.getSeqAt(log.tracker.length()-1);
    const remoteChanges = workspace.tree.remoteChanges;
    let firstUnsquashedRemoteIndex=-1;
    for(let i=0;i<remoteChanges.length;i++){
      const currentSeqNr = (remoteChanges[i] as IRemotePropertyTreeMessage).sequenceNumber;
      if(lastSquashedSeq<currentSeqNr){
        firstUnsquashedRemoteIndex=i;
        break;
      }
    }
    
    let myPos = pos;
        console.log("miso12 " + myPos);
        if(myPos===0){
        }
        else
        if(myPos===-1){
          if(firstUnsquashedRemoteIndex===-1){
            myPos=lastSquashedSeq;
          }
          else {
            const firstChange = cloneChange(remoteChanges[firstUnsquashedRemoteIndex].changeSet);
            for(let i=firstUnsquashedRemoteIndex+1;i<remoteChanges.length;i++){
              const nextChange = cloneChange(remoteChanges[i].changeSet);        
              firstChange.applyChangeSet(nextChange);
            }
            firstChange.toInverseChangeSet();
            const changes = firstChange._changes;
            workspace.tree.root.applyChangeSet(changes);
            setPos((remoteChanges[firstUnsquashedRemoteIndex] as IRemotePropertyTreeMessage).sequenceNumber);            
          }
        } 
        if(myPos!==-1 && myPos!==0) {
         
          for(let i=log.tracker.length()-1;i>=0;i--){
            const currentHistSeq=log.tracker.getSeqAt(i);
            if(myPos>=currentHistSeq){
              const inverse = log.tracker.getChangeAt(i).changeset;
              inverse.toInverseChangeSet();
              const changes = inverse._changes;
              workspace.tree.root.applyChangeSet(changes);
              const newPos = i===0?0:log.tracker.getSeqAt(i-1);
              console.log("miso13 newPos " + newPos);
              setPos(newPos);              
              break;
            }
          }
        }

      }      
      }>{"<"}</button>



<button onClick={() => {   
        const myPos = pos;
        console.log("miso14 " + myPos);
        if(pos===-1){
        } 
        else {
          const rootProp: NodeProperty = log.rootProperty;
          
          let isApplied = false;
          for(let i=0;i<log.tracker.length();i++){
            const currentHistSeq=log.tracker.getSeqAt(i);
            if(pos<currentHistSeq){
              const changeset =log.tracker.getChangeAt(i).changeset;
              const changes = changeset._changes;
              workspace.tree.root.applyChangeSet(changes);
              const newPos = log.tracker.getSeqAt(i);
              console.log("miso15 newPos " + newPos);
              setPos(newPos);    
              isApplied = true;          
              break;
            }
          }
          if(!isApplied){
            const lastSquashedSeq=log.tracker.getSeqAt(log.tracker.length()-1);
            const remoteChanges = workspace.tree.remoteChanges;
            let firstUnsquashedRemoteIndex=-1
            for(let i=0;i<remoteChanges.length;i++){
              const currentSeqNr = (remoteChanges[i] as IRemotePropertyTreeMessage).sequenceNumber;
              if(lastSquashedSeq<currentSeqNr){
                firstUnsquashedRemoteIndex=i;
                break;
              }
            }
            if(firstUnsquashedRemoteIndex===-1){
              setPos(-1);
            }
            else {
              const firstChange = cloneChange(remoteChanges[firstUnsquashedRemoteIndex].changeSet);
              for(let i=firstUnsquashedRemoteIndex+1;i<remoteChanges.length;i++){
                const nextChange = cloneChange(remoteChanges[i].changeSet);        
                firstChange.applyChangeSet(nextChange);
              }
              const changes = firstChange._changes;
              workspace.tree.root.applyChangeSet(changes);
              setPos(-1);
            }            
          }
        }

      }      
      }>{">"}</button>


<button onClick={() => {   
      const h=setInterval(()=>roll(),1);
      setIntervalId(h);
      }      
      }>{"Drive"}</button>

<button onClick={() => {   
      clearInterval(intervalId)
      }      
      }>{"Stop"}</button>

      <button onClick={() => {    
        const rootProp: NodeProperty = log.rootProperty;
        const hist = log.tracker.list();
        for(let i=0;i < hist.length; i++){
          console.log("--------SQUASHED--------------");
          console.log("------------------------------------");
          console.log(hist[i].lastSeq);
          console.log("------------------------------------");
          console.log(JSON.stringify(cloneChange(hist[i].changeset).getSerializedChangeSet()));
          console.log("------------------------------------");
        }
        const myRemoteChanges = workspace.tree.remoteChanges;
        for(let i=0;i < myRemoteChanges.length; i++){
          console.log("---------CURRENT-----------------");
          console.log((myRemoteChanges[i] as IRemotePropertyTreeMessage).sequenceNumber);
          console.log("------------------------------------");
          console.log(JSON.stringify(cloneChange(myRemoteChanges[i].changeSet).getSerializedChangeSet()));
          console.log("------------------------------------");
        }
        
      }      
      }>{"Debug"}</button>

<br></br>

<input type="text" id="commitSize" name="commitSize" value={readCommitSize(workspace)} 
    onChange={()=>setCommitSize(workspace,setToRender,toRender)}></input>



 <button onClick={() => {
   const myInput = document.getElementById("commitSize") as HTMLInputElement;
   genBig(workspace,parseInt(myInput.value));     }
  }>{"BigCommit"}</button>




       <br></br><br></br><br></br>
 
      <h2>Odometer</h2>
      <div >
        {renderLocalMap(localMap)}
      </div>
      <div >
        {propSize(workspace)}
      </div>
      <br></br><br></br><br></br>
      <button className="commit" onClick={() => roll()}>
        Roll
      </button>
    </div>
  );
}


function computePropSize(workspace: TrackedWorkspace){
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


function propSize(workspace: TrackedWorkspace){  
  const reactElem: any[] = [];
  if(!workspace) return reactElem;
  reactElem.push((
  <table className="evotable">
  <tr><td>Tree Size</td><td>{computePropSize(workspace)}</td></tr>  
  </table>
  ));
  return reactElem;
}

function readCommitSize(workspace){
  if(!workspace) return -1;
  const rootProp: NodeProperty = workspace.rootProperty;
  let commitSizeProp = rootProp.resolvePath("commitSize") as Int32Property;
  if(!commitSizeProp){
    commitSizeProp=PropertyFactory.create("Int32");
    rootProp.insert("commitSize",commitSizeProp);
    commitSizeProp.value=2000000;    
  }  
  console.log("read " + commitSizeProp.value);
  return commitSizeProp.value;  
}

function setCommitSize(workspace,setToRender,toRender){
  if(!workspace) return -1;
  const rootProp: NodeProperty = workspace.rootProperty;
  let commitSizeProp = rootProp.resolvePath("commitSize") as Int32Property;
  if(!commitSizeProp){
    commitSizeProp=PropertyFactory.create("Int32");
    rootProp.insert("commitSize",commitSizeProp);
       
  }  
  const myInput = document.getElementById("commitSize") as HTMLInputElement;
  commitSizeProp.value=myInput.value;
  workspace.commit();
  console.log("toRender " + toRender);
  setToRender((toRender+1)%1000);
  console.log("comitted " + commitSizeProp.value);
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
    workspace.commit();
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