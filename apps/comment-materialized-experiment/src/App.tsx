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
  Topics 
} from "@dstanesc/plexus-util";

import { commentSchema } from "@dstanesc/comment-util";

import { commentThreadSchema } from "@dstanesc/comment-util";

import { 
  retrieveArrayProperty as retrieveCommentArrayProperty, 
  retrieveCommentTextProperty, 
  createCommentProperty, 
  initPropertyTree, 
  configureBinding 
} from "@dstanesc/comment-util";

import { UserComment } from '@dstanesc/comment-util';


/*
 * Cell react component, the atomic dice view
 */

function Cell(props: any) {
  return (
    <button className="comment" onClick={props.onClick}>
      {props.value.text}
    </button>
  );
}

/*
 * Row react component, a collection of cells
 */

function Row(props: any) {
  return (
    <div>
      <div className="board-row">
        {
          props.cells.map((value: any, i: any) => <Cell key={i} value={value} onClick={() => props.onClick(i)} />)
        }
      </div>
    </div>
  );
}

export default function App() {

  // UI Model, array of comments
  const [comments, setComments] = useState<UserComment[]>([]);

  const [open, setOpen] = React.useState(false);

  const [text, setText] = useState("");

  // Comment workspace 
  let commentWorkspace = useRef<Workspace>(null);

  // Plexus workspace 
  let plexusWorkspace = useRef<Workspace>(null);

  const commentContainerId = window.location.hash.substring(1) || undefined;

  useEffect(() => {
    initPlexusWorkspace()
      .then(() => initCommentWorkspace())
      .then(() => registerContainerWithPlexus(plexusWorkspace.current, commentWorkspace.current));

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

    const configuredPlexusContainerId: string = "577ccfde-dd55-462e-b8e8-c899ef6ecce0";

    // Initialize the workspace
    const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(configuredPlexusContainerId);

    const myPlexusWorkspace: Workspace = boundWorkspace.workspace;

    // Make workspace available
    plexusWorkspace.current = myPlexusWorkspace;
  }

  async function initCommentWorkspace() {

    // Register the templates used to instantiate properties.
    registerSchema(commentSchema);
    registerSchema(commentThreadSchema);

    // Initialize the workspace
    const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(commentContainerId);

    const myCommentWorkspace: Workspace = boundWorkspace.workspace;

    const commentDataBinder: DataBinder = boundWorkspace.dataBinder;

    // Configure binding
    configureBinding(commentDataBinder, myCommentWorkspace, setComments);

    //Initialize the property tree
    initPropertyTree(commentContainerId, myCommentWorkspace, setComments);

    // Make workspace available
    commentWorkspace.current = myCommentWorkspace;

    // Everything good, update browser location with container identifier
    window.location.hash = myCommentWorkspace.containerId;

    const myPlexusWorkspace: Workspace = plexusWorkspace.current;

    registerContainerWithPlexus(myPlexusWorkspace, myCommentWorkspace);
  }

  const registerContainerWithPlexus = (myPlexusWorkspace: Workspace, myCommentWorkspace: Workspace) => {
    const registryLog: MapProperty = retrieveMapProperty(myPlexusWorkspace, Topics.REGISTRY_LOG);
    const commentContainerId = myCommentWorkspace.containerId;
    const containerProperty: NamedProperty = createContainerProperty(commentContainerId);
    registryLog.set(commentContainerId, containerProperty);
    myPlexusWorkspace.commit();
  }

  const add = () => {
    const diceArrayProperty: ArrayProperty = retrieveCommentArrayProperty(commentWorkspace.current);
    const diceProperty = createCommentProperty(text);
    diceArrayProperty.push(diceProperty);
    commentWorkspace.current.commit();
  }


  const remove = (i: number) => {
    const diceArrayProperty: ArrayProperty = retrieveCommentArrayProperty(commentWorkspace.current);
    diceArrayProperty.remove(i);
    commentWorkspace.current.commit();
  }


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () => {
    add();
    setOpen(false);
  };

  return (
    <div>
      <div className="">
        <Row cells={comments} onClick={(i: any) => remove(i)}></Row>
      </div>

      <br /><br /><br />

      <Button variant="contained" size="large" color="success" onClick={handleClickOpen}>
        Add
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Post Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="text"
            label="Text"
            type="text"
            fullWidth
            variant="standard"
            multiline={true}
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


