import { configureBinding, initPropertyTree, retrieveArrayProperty, createStringProperty, Topics, stringArraySchema, queryArraySchema, queryResultArraySchema, queryResultSchema, querySchema, retrieveNestedTextProperty } from "@dstanesc/plexus-util";
import { BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import { DataBinder } from "@fluid-experimental/property-binder";
import { Workspace } from "@dstanesc/fluid-util";
import figlet from "figlet";
import { ArrayProperty, StringProperty } from "@fluid-experimental/property-properties";
import { v4 as uuidv4 } from 'uuid';

let registry: string[] = [];

const updateRegistry = (fn: any) => {
    registry = fn(registry);
    console.log(registry);
}

const initRegistry = async () => {

  const out = figlet.textSync('Starting Fluid Plexus!', {
    font: 'Standard'
  });
  
  console.log(out);

  registerSchema(stringArraySchema);
  registerSchema(queryArraySchema);
  registerSchema(queryResultArraySchema);
  registerSchema(querySchema);
  registerSchema(queryResultSchema);


  // Initialize the workspace
  const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(undefined);

  const workspace: Workspace = boundWorkspace.workspace;

  const dataBinder: DataBinder = boundWorkspace.dataBinder;

  console.log(`Created container ${workspace.containerId}`);

  // Configure registry binding
  configureBinding(dataBinder, workspace, updateRegistry, "hex:stringArray-1.0.0", "registry");


  console.log(`Binding configured`);

  // Initialize property tree
  initPropertyTree(undefined, workspace, { registryListener: updateRegistry, operationLogListener: updateRegistry, queryListener:  updateRegistry, queryResultListener:  updateRegistry });

  console.log(`Property tree initialized`);

  //Create some dummy data
  const registryLog: ArrayProperty = retrieveArrayProperty(workspace, Topics.REGISTRY_LOG);

  console.log(`RegistryLog ${registryLog}`);

  const containerProperty: StringProperty = createStringProperty(uuidv4())

  console.log(`Dummy registry entry ${containerProperty.getValue()}`);

  registryLog.push(containerProperty);

  workspace.commit();

  const containerProperty2: StringProperty = createStringProperty(uuidv4())

  console.log(`Dummy registry entry replaced ${containerProperty2.getValue()}`);

  registryLog.set(0, containerProperty2);

  workspace.commit();

  return boundWorkspace;
}


initRegistry().then( boundWorkspace => {

  const dataBinder = boundWorkspace.dataBinder;

  const out = figlet.textSync('Fluid Plexus Started', {
    font: 'Standard'
  });

  console.log(out);

}).catch(err => console.log(err));