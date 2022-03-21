import { configureBinding, initPropertyTree, retrieveMapProperty, createContainerProperty, Topics, containerMapSchema, containerSchema, operationMapSchema, operationSchema, queryMapSchema, queryResultMapSchema, queryResultSchema, querySchema, PlexusModel } from "@dstanesc/plexus-util";
import { BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import { DataBinder } from "@fluid-experimental/property-binder";
import { Workspace } from "@dstanesc/fluid-util";
import figlet from "figlet";
import { ArrayProperty, MapProperty, NamedProperty, StringProperty } from "@fluid-experimental/property-properties";
import { v4 as uuidv4 } from 'uuid';

let registry: Map<string, PlexusModel> = new Map<string, PlexusModel>();

const updateRegistry = (fn: any) => {
  registry = fn(registry);
  console.log(`updateRegistry callback received`);
  registry.forEach((entry, key) => {
    console.log(`key=${key} entry=${JSON.stringify(entry)}`);
  })
}

const initRegistry = async () => {

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


  // Initialize the workspace
  const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(undefined);

  const workspace: Workspace = boundWorkspace.workspace;

  const dataBinder: DataBinder = boundWorkspace.dataBinder;

  console.log(`Created container ${workspace.containerId}`);

  // Configure registry binding
  configureBinding(dataBinder, workspace, updateRegistry, "hex:containerMap-1.0.0", "registry");

  console.log(`Binding configured`);

  // Initialize property tree
  initPropertyTree(undefined, workspace, { registryListener: updateRegistry, operationLogListener: updateRegistry, queryListener: updateRegistry, queryResultListener: updateRegistry });

  console.log(`Property tree initialized`);

  // Create some dummy data
  // createDummyData(workspace);

  return boundWorkspace;
}


initRegistry().then(boundWorkspace => {

  const dataBinder = boundWorkspace.dataBinder;

  const out = figlet.textSync('Fluid Plexus Started', {
    font: 'Standard'
  });

  console.log(out);

}).catch(err => console.log(err));

function createDummyData(workspace: Workspace) {

  const registryLog: MapProperty = retrieveMapProperty(workspace, Topics.REGISTRY_LOG);

  console.log(`RegistryLog ${registryLog}`);

  const uuid = uuidv4();

  const containerProperty: NamedProperty = createContainerProperty(uuid);

  console.log(`Dummy registry entry ${containerProperty.get<StringProperty>("id").getValue()}`);

  registryLog.set(uuid, containerProperty);

  workspace.commit();
}
