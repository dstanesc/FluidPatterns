import { IPropertyTreeMessage, IRemotePropertyTreeMessage } from "@fluid-experimental/property-dds";

export type PruneHook = {
    
    (fn: (remoteChanges: IPropertyTreeMessage[], unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>) => void): void;
}