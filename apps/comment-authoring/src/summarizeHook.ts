
import { Workspace } from "@dstanesc/fluid-util";
import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SerializedChangeSet, SharedPropertyTree } from "@fluid-experimental/property-dds";

import {
    createOperationProperty,
    LoggedOperation,
    retrieveMapProperty,
    Topics
} from "@dstanesc/plexus-util";

import { MapProperty, NamedProperty } from "@fluid-experimental/property-properties";

export function addSummarizeHook(plexusWorkspace: Workspace, commentWorkspace: Workspace) {

    const origPrune = (SharedPropertyTree as any).prune as any;

    (SharedPropertyTree as any).prune = (
        minimumSequenceNumber: number,
        remoteChanges: IRemotePropertyTreeMessage[],
        unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>,
    ) => {

        console.log("Prune invoked");

        pruneHook(
            minimumSequenceNumber,
            remoteChanges,
            unrebasedRemoteChanges,
            plexusWorkspace,
            commentWorkspace
        );
        return origPrune(
            minimumSequenceNumber,
            remoteChanges,
            unrebasedRemoteChanges
        );
    };


    const pruneHook = (
        minimumSequenceNumber: number,
        remoteChanges: IRemotePropertyTreeMessage[],
        unrebasedRemoteChanges: Record<string, IRemotePropertyTreeMessage>,
        plexusWorkspace: Workspace,
        commentWorkspace: Workspace
    ) => {

        console.log("Prune hook triggered");

        remoteChanges.forEach(remoteChange => {
            // console.log(`Operation type ${remoteChange.op}`);
            // console.log(`ChangeSet ${JSON.stringify(remoteChange.changeSet, null, 2)}`);
            // console.log(`Metadata ${remoteChange.metadata}`);
            const changeSet: SerializedChangeSet = remoteChange.changeSet;
            if (changeSet.modify) {
                if (changeSet.modify["hex:commentThread-1.0.0"]) {

                    const looggedOperation: LoggedOperation = {
                        "containerId": commentWorkspace.containerId,
                        "changeSet": changeSet,
                        "guid": remoteChange.guid,
                        "sequenceNumber": remoteChange.sequenceNumber
                    };
                    const jsonString = JSON.stringify(looggedOperation, null, 1);
                    console.log(`Publishing now`);
                    console.log(`${jsonString}`);
                    const operationLog: MapProperty = retrieveMapProperty(plexusWorkspace, Topics.OPERATION_LOG);
                    const operationProperty: NamedProperty = createOperationProperty(remoteChange.guid, jsonString);
                    if (!operationLog.has(remoteChange.guid)) {
                        operationLog.set(remoteChange.guid, operationProperty);
                        plexusWorkspace.commit();
                    } else {
                        console.log(`Changes already published ${remoteChange.guid}`);
                    }
                }
            }
        });
    }
}
