import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty, MapProperty }
  from "@fluid-experimental/property-properties";

import { DataBinder } from "@fluid-experimental/property-binder";

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { copy as deepClone } from "fastest-json-copy";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import {
  retrieveMapProperty,
  createContainerProperty,
  containerMapSchema,
  containerSchema,
  operationMapSchema,
  operationSchema,
  queryMapSchema,
  queryResultMapSchema,
  queryResultSchema,
  querySchema,
  Topics,
  appendQueryProperty,
  configureBinding as configurePlexusBinding,
  checkPlexusNameservice,
  PlexusModel,
  PlexusListenerResult
} from "@dstanesc/plexus-util";

import { commentSchema } from "@dstanesc/comment-util";

import { commentThreadSchema } from "@dstanesc/comment-util";

import {
  retrieveArrayProperty as retrieveCommentArrayProperty,
  retrieveCommentTextProperty,
  createCommentProperty,
  initPropertyTree,
  configureBinding as configureCommentBinding
} from "@dstanesc/comment-util";

import { UserComment } from '@dstanesc/comment-util';


const plexusServiceName: string = "local-plexus-service"



function Result(comment: any) {
  return (
    <button className="comment">
      {comment.text}
    </button>
  );
}


function ResultList(comments: any) {
  return (
    <div>
      <div className="board-row">
        {
          comments.map((comment: any, i: any) => <Result key={comment.id} comment={comment} />)
        }
      </div>
    </div>
  );
}



export default function App() {

  const [searchText, setSearchText] = useState("");

  // Plexus workspace 
  let plexusWorkspace = useRef<Workspace>(null);

  const [searchShow, setSearchShow] = useState(false);

  let queryResultLog: Map<string, PlexusModel> = new Map<string, PlexusModel>();

  useEffect(() => {
    initPlexusWorkspace();
  }, []); // [] to be executed only once

  async function initPlexusWorkspace() {

    registerSchema(operationSchema);
    registerSchema(operationMapSchema);
    registerSchema(containerSchema);
    registerSchema(containerMapSchema);
    registerSchema(queryMapSchema);
    registerSchema(queryResultMapSchema);
    registerSchema(querySchema);
    registerSchema(queryResultSchema);

    const configuredPlexusContainerId: string = await checkPlexusNameservice(plexusServiceName);

    // Initialize the workspace
    const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(configuredPlexusContainerId);

    const myPlexusWorkspace: Workspace = boundWorkspace.workspace;

    const myPlexusBinder: DataBinder = boundWorkspace.dataBinder;

    // Configure query result binding
    configurePlexusBinding(myPlexusBinder, myPlexusWorkspace, queryResultReceived, "hex:queryResultMap-1.0.0", "queryResultLog");


    // Make workspace available
    plexusWorkspace.current = myPlexusWorkspace;
  }

  const queryResultReceived = (fn: any) => {
    const plexusListenerResult: PlexusListenerResult = fn(queryResultLog);
    queryResultLog = plexusListenerResult.result;
    const plexusModel: PlexusModel = plexusListenerResult.increment;
    if (plexusModel) {
      const guid: string = plexusModel.id;
      const queryText = plexusModel.text;
      console.log(`Received query guid=${guid} queryText=${queryText}`);
    } else {
      console.log(`Could not find queryLog plexusModel for ${plexusListenerResult.operationType}`)
    }
    setSearchShow(true);
  }

  const sendQuery = (queryText: string) => {
    setSearchShow(false);
    const queryLog: MapProperty = retrieveMapProperty(plexusWorkspace.current, Topics.QUERY_LOG);
    appendQueryProperty(queryText, queryLog);
    plexusWorkspace.current.commit();
  }

  const handleSendQuery = () => {
    console.log(`Sending query ${searchText}`);
    sendQuery(searchText);
  };

  function showResults() {
    if (searchShow) {
      return (
        <ResultList comments={queryResultLog} />
      );
    }
  }

  return (
    <div>
      <br /><br /><br />
      <TextField
        autoFocus
        margin="normal"
        id="text"
        label="Enter your search here"
        type="text"
        variant="outlined"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
      /> 
      <div>
        <Button variant="contained" size="large" color="success" onClick={handleSendQuery}>
          Search
        </Button>
      </div>
      <br /><br /><br />
      {showResults()}
    </div>
  );
}


