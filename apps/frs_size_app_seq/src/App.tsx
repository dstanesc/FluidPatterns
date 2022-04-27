import React, { useState, useEffect } from 'react';

import './App.css';



import { createSimpleWorkspace, SimpleWorkspace} from "./tracking/workspaces";
import { SharedMap } from "@fluidframework/map";




export default function App() {

  function getColor(value: number): string {
    const modulo = value % 10;
    switch(modulo) {
        case 0: {return "grey"; break;}
        case 1:{return "blue"; break;}
        case 2:{return "red"; break;}
        case 3:{return "yellow"; break;}
        case 4:{return "darkcyan"; break;}
        case 5:{return "firebrick"; break;}
        case 6:{return "orange"; break;}
        case 7:{return "purple"; break;}
        case 8:{return "magenta"; break;}
        case 9:{return "cyan"; break;}
        default:{return "black"; break;}
    }
  }

  const doRender = () => {
    let nextToRender = Math.floor(200000000*Math.random());
    setToRender(nextToRender);
  }
  
  const defaultMaxOpSizeInBytes = 768000;

  const oneMb = 1024*1024;
  const oneKb = 1024;

  const [workspace, setWorkspace] = useState<SimpleWorkspace>();
  const [toRender,setToRender] = useState<number>(0);
  const [sumNr,setSumNr] = useState({nr:0});

  const containerId = window.location.hash.substring(1) || undefined;




  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const bigValue = urlParams.get('big');
    if(bigValue){
      window.sessionStorage.setItem("Fluid.ContainerRuntime.MaxOpSizeInBytes","-1");
    }
    else {
      window.sessionStorage.removeItem("Fluid.ContainerRuntime.MaxOpSizeInBytes");
    }


    async function initWorkspace() {      
      const myWorkspace = await createSimpleWorkspace(containerId);
      if (myWorkspace.containerId)
        window.location.hash = myWorkspace.containerId;
      setWorkspace(myWorkspace);     
      const myMap = myWorkspace.tree; 
      const oldSummarize = SharedMap.prototype.summarize.bind(myWorkspace.tree);    

      SharedMap.prototype.summarize = (fullTree: boolean = false, trackState: boolean = false) => {
        sumNr.nr=sumNr.nr+1;
        doRender();
        console.log("before summarize");
        const result = oldSummarize(fullTree,trackState);
        console.log("after summarize");
        return result;
      }


      myWorkspace.tree.on("valueChanged", doRender);
    }
    initWorkspace();   
    

  }, []);

  return (

    

    <div className="App">
    <h1>Operation Size Example: SharedMap</h1>
    

    <br></br><br></br>

    <b className='bigop'>BIG OPERATIONS: </b> 
    {
      renderBigEnabled()
    }

    <br></br><br></br><br></br><br></br>

    <b style={{borderWidth:"8px", borderColor:getColor(sumNr.nr), borderStyle:"solid", fontSize:"20px"}}>NUMBER OF SUMMARIZATIONS: {sumNr.nr} </b> 
    <br></br><br></br><br></br><br></br>


    <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===500000} 
  onChange={()=>setCommitSizeCheckbox(workspace,500000)}></input>
  <b className="defSizes">500000B</b>    

  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===750000} 
  onChange={()=>setCommitSizeCheckbox(workspace,750000)}></input>
  <b className="defSizes">750000B</b>

  
  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===768001} 
  onChange={()=>setCommitSizeCheckbox(workspace,768001)}></input>
  <b className="defSizes">768001B</b>


  
  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,oneMb)}></input>
<b className="defSizes">1MB</b>



<input type="checkbox" id="commitSizeCheckbox2" name="commitSize" checked={readCommitSize(workspace)===2*oneMb} 
    onChange={()=>setCommitSizeCheckbox(workspace,2*oneMb)}></input>
<b className="defSizes">2MB</b>


<input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===5000000} 
  onChange={()=>setCommitSizeCheckbox(workspace,5000000)}></input>
  <b className="defSizes">5000000B</b>    


  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===10*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,10*oneMb)}></input>
 <b className="defSizes">10MB</b>


  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===20*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,20*oneMb)}></input>
<b className="defSizes">20MB</b>


  <input type="checkbox" id="commitSizeCheckbox1" name="commitSize" checked={readCommitSize(workspace)===100*oneMb} 
  onChange={()=>setCommitSizeCheckbox(workspace,100*oneMb)}></input>
<b className="defSizes">100MB</b>



<br></br><br></br>
<input className="commitsize" type="text" id="commitSize" name="commitSize" value={readCommitSize(workspace)} 
    onChange={()=>setCommitSize(workspace)}></input>



 <button className="bigcommit" onClick={() => {
   const myInput = document.getElementById("commitSize") as HTMLInputElement;
   genBig(workspace,parseInt(myInput.value));     }
  }>{"Big Commit"}</button>
       <br></br><br></br><br></br>
      <h2>Property Sizes</h2>
      <div >
        {renderPropSize(workspace)}
      </div>
    </div>

    
  );







function checkBigEnabled(): boolean{
  const bigState = window.sessionStorage.getItem("Fluid.ContainerRuntime.MaxOpSizeInBytes");
  const isBig = bigState === "-1";
  return isBig;
}

function renderBigEnabled(){
  const reactElem: any[] = [];
  if(checkBigEnabled()){
    reactElem.push(<div id="greencircle"></div>);
  }
  else {
    reactElem.push(<div id="redcircle"></div>);
  }
  return reactElem;
}

function readCommitSize(workspace: SimpleWorkspace){
  if(!workspace) return -1;
  const map = workspace.tree;
  let commitSize = map.get("commitSize");
  if(!commitSize){
      return -1;
  }  
  else {
    return commitSize;
  }
}

function setCommitSize(workspace: SimpleWorkspace){
  if(!workspace) return -1;
  const myInput = document.getElementById("commitSize") as HTMLInputElement;
  workspace.tree.set("commitSize",myInput.value);
}

function setCommitSizeCheckbox(workspace: SimpleWorkspace, size:number){
  if(!workspace) return -1;
  workspace.tree.set("commitSize",size);
}




function computePropSize(workspace: SimpleWorkspace){
    let size = 0;
    const dynamicIds = Array.from(workspace.tree.keys()).filter((id)=>id.startsWith("big"));
    dynamicIds.forEach((prop)=>{
      size += workspace.tree.get(prop).length;
    })
    return size;
}


function renderPropSizeTableContent(workspace: SimpleWorkspace){
  const reactElem: any[] = [];
    let size = 0;
    const dynamicIds =Array.from(workspace.tree.keys()).filter((id)=>id.startsWith("big"));
    dynamicIds.forEach((prop)=>{
      const value = workspace.tree.get(prop);
      reactElem.push(
        <tr><td className="propcell">{prop}</td><td className="sizecell">{value.length}</td></tr>
      )
    })
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
    const propName = "big_" + Math.floor(200000000*Math.random()).toString();    
    let str="";
    for(let i=0;i<size;i++){
      str+=Math.floor(10*Math.random()).toString();
    }
    workspace.tree.set(propName,str);
}




}








