import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import './App.css';

import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty }
  from "@fluid-experimental/property-properties";

import { DataBinder } from "@fluid-experimental/property-binder";

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { copy as deepClone } from "fastest-json-copy";

import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";

import { commentSchema } from "@dstanesc/comment-util";

import { commentThreadSchema } from "@dstanesc/comment-util";

import { retrieveArrayProperty, retrieveCommentTextProperty, createCommentProperty, initPropertyTree, configureBinding } from "@dstanesc/comment-util";

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

  const [text, setText] = useState('');

  // Workspace reference, pseudo-immutable
  const [workspace, setWorkspace] = useState<Workspace>();

  const containerId = window.location.hash.substring(1) || undefined;

  useEffect(() => {

    async function initWorkspace() {

      // Register the templates used to instantiate properties.
      registerSchema(commentSchema);
      registerSchema(commentThreadSchema);

      // Initialize the workspace
      const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

      const myWorkspace: Workspace = boundWorkspace.workspace;

      const dataBinder: DataBinder = boundWorkspace.dataBinder;

      // Configure binding
      configureBinding(dataBinder, myWorkspace, setComments);

      //Initialize the property tree
      initPropertyTree(containerId, myWorkspace, setComments);

      // Make workspace available
      setWorkspace(myWorkspace);

      // Everything good, update browser location with container identifier
      window.location.hash = myWorkspace.containerId;
    }

    initWorkspace();

  }, []); // [] to be executed only once


  const add = () => {
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    const diceProperty = createCommentProperty(text);
    diceArrayProperty?.push(diceProperty);
    workspace.commit();
  }


  const remove = (i: number) => {
    const diceArrayProperty: ArrayProperty = retrieveArrayProperty(workspace);
    diceArrayProperty.remove(i);
    workspace.commit();
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
