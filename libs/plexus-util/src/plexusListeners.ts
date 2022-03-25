import { Utils } from "@fluid-experimental/property-changeset";


export interface PlexusModel {

    key: string;

    id: string;
    
    text: string;
}

export interface PlexusListenerResult {

   result: Map<string, PlexusModel>;

   increment: PlexusModel;  
   
   operationType: Utils.OperationType;
}

export type PlexusListener = {

    (fn: (content: Map<string, PlexusModel>) => PlexusListenerResult): void;
}


export type RegistryListener = PlexusListener;

export type OperationLogListener = PlexusListener;

export type QueryLogListener = PlexusListener;

export type QueryResultLogListener = PlexusListener;

export type PlexusListeners = {
    registryListener: RegistryListener;
    operationLogListener: OperationLogListener;
    queryListener: QueryLogListener;
    queryResultListener: QueryResultLogListener;
}