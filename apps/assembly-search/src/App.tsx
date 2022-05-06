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

import { SimpleWorkspace, createSimpleWorkspace, registerSchema } from "@dstanesc/fluid-util2";

import {
  retrieveMapProperty,
  createContainerProperty,
  containerMapSchema,
  containerSchema,
  queryMapSchema,
  queryResultMapSchema,
  queryResultSchema,
  querySchema,
  int32MapSchema,
  Topics,
  appendQueryProperty,
  configureBinding as configurePlexusBinding,
  checkPlexusNameservice,
  PlexusModel,
  PlexusListenerResult
} from "@dstanesc/plexus-util";

import { AssemblyQueryResult } from '@dstanesc/assembly-util';
import { parse, SearchParserResult, SearchParserOptions, SearchParserOffset, ISearchParserDictionary } from 'search-query-parser';

const plexusServiceName: string = "local-plexus-service"


function Result(props: any) {

  const goAuthor = () => {
    const authoringLink = `http://localhost:3003/?highlight=${props.queryResult.id}#${props.queryResult.containerId}`;
    window.open(authoringLink)
  };

  const imgDivStyle = {
    width: props.queryResult.width + 'px',
    height: props.queryResult.height + 'px',
    // border: '4px solid',
    background: props.queryResult.fill,
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "10px 10px 10px"
  }

  const dataDivStyle = {
    paddingLeft: "30px"
  }

  return (
    <table className="anno">
      <tbody>
        <tr><td colSpan={2}><b>ContainerId:</b> <Button onClick={goAuthor} className="anno">{props.queryResult.containerId}</Button></td></tr>
        <tr><td><div style={imgDivStyle} onClick={goAuthor}></div></td>
          <td><div style={dataDivStyle}>
            <span><b>ComponentId:</b> {props.queryResult.id}</span><br />
            <span><b>Index:</b> {props.queryResult.index}</span><br />
            <span><b>SequentialNo:</b>{props.queryResult.sequenceNumber}</span><br />
            <span><b>Score:</b> {props.queryResult.score}</span><br />
            <span><b>Annotation:</b> {props.queryResult.annotation}</span><br />
            <span><b>Fill:</b> {props.queryResult.fill}</span><br />
            <span><b>x:</b> {props.queryResult.x}</span><br />
            <span><b>y:</b> {props.queryResult.y}</span><br />
            <span><b>width:</b> {props.queryResult.width}</span><br />
            <span><b>height:</b> {props.queryResult.height}</span><br />
          </div></td></tr>
      </tbody>
    </table>
  );
}


function ResultList(props: any) {

  const results = props.queryResults.map(queryResult => <Result key={queryResult.index} queryResult={queryResult} />);

  return (
    <div>
      <div className="board-row">
        {results}
      </div>
    </div>
  );
}



export default function App() {

  const [searchText, setSearchText] = useState("");

  // Plexus workspace 
  let plexusWorkspace = useRef<SimpleWorkspace>(null);

  const [searchShow, setSearchShow] = useState(false);

  const queryResults = useRef([]);

  const queryId = useRef("");

  const [resultArray, setResultArray] = useState([]);

  useEffect(() => {
    initPlexusWorkspace();
  }, []); // [] to be executed only once

  async function initPlexusWorkspace() {
    registerSchema(int32MapSchema);
    registerSchema(containerSchema);
    registerSchema(containerMapSchema);
    registerSchema(queryMapSchema);
    registerSchema(queryResultMapSchema);
    registerSchema(querySchema);
    registerSchema(queryResultSchema);

    const configuredPlexusContainerId: string = await checkPlexusNameservice(plexusServiceName);

    // Initialize the workspace
    const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(configuredPlexusContainerId);

    const myPlexusBinder: DataBinder = simpleWorkspace.dataBinder;

    // Configure query result binding
    configurePlexusBinding(myPlexusBinder, simpleWorkspace, queryResultReceived, "hex:queryResultMap-1.0.0", "queryResultLog");

    // Make workspace available
    plexusWorkspace.current = simpleWorkspace;
  }

  const queryResultReceived = (fn: any) => {
    const plexusListenerResult: PlexusListenerResult = fn(new Map());
    const plexusModel: PlexusModel = plexusListenerResult.increment;
    if (plexusModel) {
      const resultId: string = plexusModel.key;
      const queryId: string = plexusModel.id;
      const queryResultText = plexusModel.text;
      console.log(`Received result resultId=${resultId}  queryId=${queryId} queryResultText=${queryResultText}`);
      queryResults.current.push(plexusModel);
    } else {
      console.log(`Could not find queryLog plexusModel for ${plexusListenerResult.operationType}`)
    }
    const queryResultArray = queryResults.current
      .filter(result => result.id === queryId.current)
      .map(result => {
        console.log(`Received query result \n${result.text}`);
        const queryResult: AssemblyQueryResult = JSON.parse(result.text);
        return queryResult;
      });

    setResultArray(queryResultArray);

    setSearchShow(true);
  }

  const sendQuery = (queryText: string) => {
    setSearchShow(false);
    const languageSpec = { keywords: ["id", "fill"], ranges: ['x', 'y', 'width', 'height'], "offsets": false, "tokenize": false, "alwaysArray": false }
    const parsedQuery = parse(queryText, languageSpec);
    const parsedQueryString = JSON.stringify(parsedQuery, null, 2);
    console.log(`Parsed query:\n${parsedQueryString}`);
    const queryLog: MapProperty = retrieveMapProperty(plexusWorkspace.current, Topics.QUERY_LOG);
    queryId.current = appendQueryProperty(parsedQueryString, queryLog);
    queryResults.current = [];
    plexusWorkspace.current.commit();
  }

  const handleSendQuery = () => {
    console.log(`Sending query ${searchText}`);
    sendQuery(searchText);
  };

  const handleEnterKey = (event) => {
    if (event.key === 'Enter') {
      handleSendQuery();
    }
  };

  function showResults() {

    if (searchShow) {
      return (
        <ResultList queryResults={resultArray} />
      );
    }
  }

  return (
    <div>
      <br /><br /><br />
      <div className="left">
        <TextField
          autoFocus
          margin="normal"
          id="text"
          label="Assembly Component Search"
          type="text"
          variant="outlined"
          value={searchText}
          color="primary"
          onChange={e => setSearchText(e.target.value)}
          onKeyUp={handleEnterKey}
          InputProps={{ style: { fontSize: 32 } }}
          InputLabelProps={{ style: { fontSize: 18 } }}
        />
        {/* <Button variant="contained" size="large" color="success" onClick={handleSendQuery}>
          Search
        </Button> */}
      </div>
      <br /><br /><br />
      {showResults()}
    </div>
  );
}


