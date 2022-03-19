
export type PlexusListener = {

    (fn: (textArray: string[]) => string[]): void;
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