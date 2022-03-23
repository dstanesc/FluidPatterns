import {
  configureBinding,
  initPropertyTree,
  retrieveMapProperty,
  createContainerProperty,
  Topics,
  containerMapSchema,
  containerSchema,
  operationMapSchema,
  operationSchema,
  queryMapSchema,
  queryResultMapSchema,
  queryResultSchema,
  querySchema,
  PlexusModel,
  PlexusListenerResult,
  LoggedOperation,
  checkPlexusNameservice,
  updatePlexusNameservice

} from "@dstanesc/plexus-util";

import { BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import { DataBinder } from "@fluid-experimental/property-binder";
import { Workspace } from "@dstanesc/fluid-util";
import figlet from "figlet";
import { ArrayProperty, MapProperty, NamedProperty, StringProperty } from "@fluid-experimental/property-properties";
import { v4 as uuidv4 } from 'uuid';
import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";


const plexusService: string = "local-plexus-service"

let registry: Map<string, PlexusModel> = new Map<string, PlexusModel>();

const updateRegistry = (fn: any) => {
  const plexusListenerResult: PlexusListenerResult = fn(registry);
  registry = plexusListenerResult.result;
  registry.forEach((entry, key) => {
    console.log(`key=${key} entry=${JSON.stringify(entry)}`);
  })
}

let operationLog: Map<string, PlexusModel> = new Map<string, PlexusModel>();

const operationLogged = (fn: any) => {
  const plexusListenerResult: PlexusListenerResult = fn(operationLog);
  operationLog = plexusListenerResult.result;
  const plexusModel: PlexusModel = plexusListenerResult.increment;
  if (plexusModel) {
    const guid: string = plexusModel.id;
    const jsonString = plexusModel.text;
    //console.log(`key=${guid} entry=\n${jsonString}`);
    const loggedOperation: LoggedOperation = JSON.parse(jsonString);
    console.log(`loggedOperation from containerId=${loggedOperation.containerId} sequenceNumber=${loggedOperation.sequenceNumber} entry=${jsonString}`);
  } else {
    console.log(`Could not find operationLog plexusModel for ${plexusListenerResult.operationType}`)
  }
}

let queryLog: Map<string, PlexusModel> = new Map<string, PlexusModel>();

const queryReceived = (fn: any) => {
  const plexusListenerResult: PlexusListenerResult = fn(queryLog);
  queryLog = plexusListenerResult.result;
  const plexusModel: PlexusModel = plexusListenerResult.increment;
  if (plexusModel) {
    const guid: string = plexusModel.id;
    const queryText = plexusModel.text;
    console.log(`Received query guid=${guid} queryText=${queryText}`);
  } else {
    console.log(`Could not find queryLog plexusModel for ${plexusListenerResult.operationType}`)
  }
}




const initAgent = async () => {

  const out = figlet.textSync('Starting Fluid Plexus!', {
    font: 'Standard'
  });

  console.log(out);

  registerSchema(operationSchema);
  registerSchema(operationMapSchema);
  registerSchema(containerSchema);
  registerSchema(containerMapSchema);
  registerSchema(queryMapSchema);
  registerSchema(queryResultMapSchema);
  registerSchema(querySchema);
  registerSchema(queryResultSchema);


  let containerId: string | undefined = await checkPlexusNameservice(plexusService);

  // Initialize the workspace
  const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

  const workspace: Workspace = boundWorkspace.workspace;

  const dataBinder: DataBinder = boundWorkspace.dataBinder;


  // Configure registry binding
  configureBinding(dataBinder, workspace, updateRegistry, "hex:containerMap-1.0.0", "registry");

  // Configure operation binding
  configureBinding(dataBinder, workspace, operationLogged, "hex:operationMap-1.0.0", "operationLog");

  // Configure query binding
  configureBinding(dataBinder, workspace, queryReceived, "hex:queryMap-1.0.0", "queryLog");

  console.log(`Binding configured`);

  if (!containerId) {

    // Initialize property tree
    initPropertyTree(undefined, workspace, { registryListener: updateRegistry, operationLogListener: operationLogged, queryListener: updateRegistry, queryResultListener: updateRegistry });

    console.log(`Property tree initialized`);

    console.log(`Posting ${workspace.containerId} to the nameservice ..`);

    await updatePlexusNameservice(plexusService, workspace.containerId);
  }
  return boundWorkspace;
}


initAgent().then(boundWorkspace => {

  const dataBinder = boundWorkspace.dataBinder;

  const out = figlet.textSync('Fluid Plexus Started', {
    font: 'Standard'
  });

  console.log(out);

}).catch(err => console.log(err));

