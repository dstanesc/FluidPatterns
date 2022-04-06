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
import { ArrayProperty, Int32ArrayProperty, NodeProperty, PropertyFactory, StringArrayProperty, StringProperty, ValueProperty } from '@fluid-experimental/property-properties';
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

  const [pos, setPos] = useState<number>(-1);

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
        const removedRemoteChanges = remoteChanges.slice(0,remoteChanges.length - origResult.remoteChanges.length);
        if(removedRemoteChanges.length>0){
          const firstChange = cloneChange(removedRemoteChanges[0].changeSet);
          let seq = removedRemoteChanges[removedRemoteChanges.length-1].sequenceNumber;
          for(let i=1;i<removedRemoteChanges.length;i++){
            const nextChange = cloneChange(removedRemoteChanges[i].changeSet);
            console.log(JSON.stringify(nextChange.getSerializedChangeSet()));            
            firstChange.applyChangeSet(nextChange);
          }
          const mySerialized = JSON.stringify(firstChange.getSerializedChangeSet());
          let historyBufferProp = myLogRoot.resolvePath("history_buffer");
          let historyBufferSeq = myLogRoot.resolvePath("history_buffer_seq");
          if(historyBufferProp === undefined){
            historyBufferProp =  PropertyFactory.create("String","array");
            myLogRoot.insert("history_buffer",historyBufferProp);    
            historyBufferSeq =  PropertyFactory.create("Int32","array");
            myLogRoot.insert("history_buffer_seq",historyBufferSeq);
          }
          (historyBufferProp as StringArrayProperty).push(mySerialized);
          (historyBufferSeq as Int32ArrayProperty).push(seq);
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
      initialize100(containerId,myWorkspace.rootProperty,myWorkspace);
    }
    initWorkspace();    

  }, []);


  const roll = () => {
    const map = new Map<string, any>();
    const numA: number = parseInt(localMap.get("numA"));
    if(numA>=999999){
      map.set("numA","0");
    }
    else {
      map.set("numA",(numA + 1).toString());
    }    
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
        const myPos = pos;
        console.log("miso12 " + myPos);
        if(pos===0){
        }
        else
        if(pos===-1){
          const remoteChanges = workspace.tree.remoteChanges;
          const firstChange = cloneChange(remoteChanges[0].changeSet);
          for(let i=1;i<remoteChanges.length;i++){
            const nextChange = cloneChange(remoteChanges[i].changeSet);        
            firstChange.applyChangeSet(nextChange);
          }
          firstChange.toInverseChangeSet();
          const changes = firstChange._changes;
          workspace.tree.root.applyChangeSet(changes);
          setPos((remoteChanges[0] as IRemotePropertyTreeMessage).sequenceNumber);
        } 
        else {
          const rootProp: NodeProperty = log.rootProperty;
          const seqHist = rootProp.resolvePath("history_buffer_seq") as Int32ArrayProperty;
          for(let i=seqHist.length-1;i>=0;i--){
            const currentHistSeq=seqHist.get(i);
            if(pos>=currentHistSeq){
              const hist = rootProp.resolvePath("history_buffer") as StringArrayProperty;
              const changesetToApply = hist.get(i);
              const inverse = new ChangeSet(JSON.parse(changesetToApply));
              inverse.toInverseChangeSet();
              const changes = inverse._changes;
              workspace.tree.root.applyChangeSet(changes);
              const newPos = i===0?0:seqHist.get(i-1)+1;
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
          const seqHist = rootProp.resolvePath("history_buffer_seq") as Int32ArrayProperty;
          let isApplied = false;
          for(let i=0;i<seqHist.length;i++){
            const currentHistSeq=seqHist.get(i);
            if(pos<currentHistSeq){
              const hist = rootProp.resolvePath("history_buffer") as StringArrayProperty;
              const changesetToApply = hist.get(i);
              const changeset = new ChangeSet(JSON.parse(changesetToApply));
              const changes = changeset._changes;
              workspace.tree.root.applyChangeSet(changes);
              const newPos = seqHist.get(i);
              console.log("miso15 newPos " + newPos);
              setPos(newPos);    
              isApplied = true;          
              break;
            }
          }
          if(!isApplied){
            const remoteChanges = workspace.tree.remoteChanges;
            const firstChange = cloneChange(remoteChanges[0].changeSet);
            for(let i=1;i<remoteChanges.length;i++){
              const nextChange = cloneChange(remoteChanges[i].changeSet);        
              firstChange.applyChangeSet(nextChange);
            }
            const changes = firstChange._changes;
            workspace.tree.root.applyChangeSet(changes);
            setPos(-1);
          }
        }

      }      
      }>{">"}</button>






      <button onClick={() => {    
        const rootProp: NodeProperty = log.rootProperty;
        const hist = rootProp.resolvePath("history_buffer") as StringArrayProperty;
        const histSeq = rootProp.resolvePath("history_buffer_seq") as Int32ArrayProperty;
        for(let i=0;i < hist.length; i++){
          console.log("--------SQUASHED--------------");
          console.log("------------------------------------");
          console.log(histSeq.get(i));
          console.log("------------------------------------");
          console.log(hist.get(i));
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


       <br></br><br></br>
 
      <h2>Init Schema</h2>
      <button onClick={() => {    
        const rootProp: NodeProperty = workspace.rootProperty;
        initialize100(containerId, rootProp, workspace);}}>Create V1.0.0</button>
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






function initialize100(containerId: string | undefined, rootProp: NodeProperty, workspace: Workspace) {
    if(!rootProp.resolvePath("evolvable")){
      rootProp.insert("evolvable", PropertyFactory.create("hex:evolvable-1.0.0", undefined, { "numA": 0, "strB": "-" }));
      workspace.commit();  
    }
}



function configureBinding(fluidBinder: DataBinder, workspace: Workspace, evolvableRenderer: EvolvableRenderer) {
  fluidBinder.defineRepresentation("view", "hex:evolvable-1.0.0", (property) => {
    return new Evolvable(property.getTypeid(),evolvableRenderer);
  },{upgradeType: UpgradeType.MINOR});
  fluidBinder.defineDataBinding("view", "hex:evolvable-1.0.0", EvolvableBinding,{upgradeType: UpgradeType.MINOR});
  fluidBinder.activateDataBinding("view");



}