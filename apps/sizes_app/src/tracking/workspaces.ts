/* eslint-disable @typescript-eslint/semi */
/* eslint-disable @typescript-eslint/comma-dangle */
/* eslint-disable space-in-parens */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable quote-props */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/space-infix-ops */
/* eslint-disable padded-blocks */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { SharedPropertyTree } from "@fluid-experimental/property-dds";
import { PropertyFactory, NodeProperty } from "@fluid-experimental/property-properties";


import { DataBinder } from "@fluid-experimental/property-binder";

import { ITelemetryBaseLogger } from "@fluidframework/common-definitions";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
} from "@fluidframework/azure-client";
import { fluidClient } from "../fluidAccess";



export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}


export interface SimpleWorkspace {

    tree: SharedPropertyTree;

    containerId: string;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;
}



export async function createSimpleWorkspace( containerId: string | undefined,
    logger: ITelemetryBaseLogger| undefined = undefined): Promise<SimpleWorkspace> {

    const containerSchema = {
            initialObjects: { tree: SharedPropertyTree }
        };

    const createNew = containerId === undefined;
    
    const client = fluidClient;

    let containerAndServices;

    if (createNew) {
        containerAndServices = await client.createContainer(containerSchema);
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await client.getContainer(containerId!, containerSchema);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tree": sharedTree, "dataBinder": dataBinder
    , "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } } as SimpleWorkspace;
}




