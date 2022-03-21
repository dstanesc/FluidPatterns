

export interface PlexusModel {

    id: string;
    
    text: string;
}

export type PlexusListener = {

    (fn: (content: Map<string, PlexusModel>) => Map<string, PlexusModel>): void;
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