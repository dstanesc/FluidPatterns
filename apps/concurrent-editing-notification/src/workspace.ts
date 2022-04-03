import { EventEmitter } from "events";
import { IFluidDataStoreContext, IFluidDataStoreFactory } from "@fluidframework/runtime-definitions";
import { IFluidHandle, IRequest, IResponse } from "@fluidframework/core-interfaces";
import { SharedPropertyTree, PropertyTreeFactory } from "@fluid-experimental/property-dds";
import { IDirectory, ISharedDirectory, IValueChanged, SharedDirectory } from "@fluidframework/map";

import { LazyLoadedDataObject, LazyLoadedDataObjectFactory } from "@fluidframework/data-object-base";
import { PropertyFactory, BaseProperty, NodeProperty } from "@fluid-experimental/property-properties";
import { IFluidDataStoreRuntime } from "@fluidframework/datastore-definitions";

import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";

import { getDefaultObjectFromContainer } from "@fluidframework/aqueduct";
import { getTinyliciousContainer } from "@fluid-experimental/get-container";

import { DataBinder } from "@fluid-experimental/property-binder";

import { TinyliciousClient, TinyliciousContainerServices } from "@fluidframework/tinylicious-client";

import { IFluidContainer } from "@fluidframework/fluid-static";

import { InsecureTokenProvider } from "@fluidframework/test-client-utils";
import {
    AzureClient,
    LOCAL_MODE_TENANT_ID,
} from "@fluidframework/azure-client";

// Boilerplate to simplify Fluid and SharedPropertyTree usage
export async function registerSchema(schema: any) {

    PropertyFactory.register(Object.values([schema]));
}


export interface SimpleWorkspace {

    containerId: string;

    tree: SharedPropertyTree;

    dataBinder: DataBinder;

    rootProperty: NodeProperty;

    commit(): void;


}


export async function createSimpleWorkspace(containerId: string | undefined): Promise<SimpleWorkspace> {

    const createNew = containerId === undefined;

    const containerSchema = {
        initialObjects: { tree: SharedPropertyTree }
    };

    const client = new AzureClient({
        connection: {
            tenantId: LOCAL_MODE_TENANT_ID,
            tokenProvider: new InsecureTokenProvider("", {
                id: "root",
            }),
            orderer: "http://localhost:7070",
            storage: "http://localhost:7070",
        }
    });

    // const client = new TinyliciousClient();

    let containerAndServices;

    if (createNew) {
        containerAndServices = await client.createContainer(containerSchema);
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await client.getContainer(containerId, containerSchema);
    }

    const sharedTree = containerAndServices.container.initialObjects.tree as SharedPropertyTree;

    const dataBinder = new DataBinder();

    dataBinder.attachTo(sharedTree);

    return { "containerId": containerId, "tree": sharedTree, "dataBinder": dataBinder, "rootProperty": sharedTree.root, "commit": () => { sharedTree.commit() } }
}



export async function initializeWorkspace(containerId: string | undefined): Promise<Workspace> {

    const createNew = containerId === undefined;

    let containerIdString: string = (createNew) ? "" : containerId;

    const workspacePromise: Promise<Workspace> = getTinyliciousContainer(containerIdString, PropertyTreeContainerRuntimeFactory, createNew)
        .then(([container, cid]) => getDefaultObjectFromContainer<Workspace>(container).then(workspace => { workspace.containerId = cid; return workspace; }));


    return workspacePromise;
}

export async function initializeBoundWorkspace(containerId: string | undefined): Promise<BoundWorkspace> {

    return initializeWorkspace(containerId)
        .then(workspace => {
            // Create the binder
            const dataBinder = new DataBinder();
            dataBinder.attachTo(workspace.tree);
            return {
                workspace: workspace,
                dataBinder: dataBinder
            }
        })
}

// The root is map-like, so we'll use this key for storing the value.
const propertyKey = "propertyKey";

export interface Workspace extends EventEmitter {

    containerId: string | undefined;

    rootProperty: NodeProperty;

    tree: SharedPropertyTree;

    on(event: "changeSetModified" | "commit", listener: (CS: any) => void): this;

    stopTransmission(stopped: boolean): void;

    commit(): void;
}

export interface BoundWorkspace {

    workspace: Workspace;

    dataBinder: DataBinder;
}

const directoryWait = async <T = any>(directory: IDirectory, key: string): Promise<T> => {
    const maybeValue = directory.get<T>(key);
    if (maybeValue !== undefined) {
        return maybeValue;
    }

    return new Promise((resolve) => {
        const handler = (changed: IValueChanged) => {
            if (changed.key === key) {
                directory.off("containedValueChanged", handler);
                const value = directory.get<T>(changed.key);
                if (value === undefined) {
                    throw new Error("Unexpected containedValueChanged result");
                }
                resolve(value);
            }
        };
        directory.on("containedValueChanged", handler);
    });
};



export class LazyWorkspace extends LazyLoadedDataObject<ISharedDirectory> implements Workspace {

    public containerId: string | undefined;

    private _tree: SharedPropertyTree;
    private _queryString: string | undefined;
    private _existing: boolean = false;

    stopTransmission(stopped: boolean): void {
        this._tree.stopTransmission(stopped);
    }

    /**
      * hasInitialized is run by each client as they load the DataObject.  Here we use it to set up usage of the
      * DataObject, by registering an event listener for dice rolls.
      */
    protected async initialize(existing: boolean) {
        if (existing) {
            // The SharedPropertyTree isn't created until after attach, so we potentially need to wait for it.
            const treeHandle = await directoryWait<IFluidHandle<SharedPropertyTree>>(this.root, propertyKey);
            if (this._queryString !== undefined) {
                // The absolutePath of the DDS should not be updated. Instead, a new handle can be created with the new
                // path. To be fixed with this issue - https://github.com/microsoft/FluidFramework/issues/6036
                (treeHandle as any).absolutePath += `?${this._queryString}`;
            }
            this._tree = await treeHandle.get();
        } else {
            if (this._tree === undefined) {
                this.root.set(propertyKey, SharedPropertyTree.create(
                    this.runtime,
                    undefined,
                    this._queryString).handle,
                );
                this._tree = await this.root.get<IFluidHandle<SharedPropertyTree>>(propertyKey).get();
            }
        }

        this.tree.on("localModification", (changeSet: any) => {
            this.emit("changeSetModified", changeSet);
        });
    }


    public get rootProperty() { return this._tree!.root; }

    public get tree() { return this._tree!; }

    commit() {
        this.tree.commit();
        this.emit("commit");
    }

    resolvePath(path: string, options: any): BaseProperty | undefined {
        return this.tree.root.resolvePath(path, options);
    }

    public static getFactory(): IFluidDataStoreFactory { return PropertyTreeInstantiationFactory; }

    public static async create(parentContext: IFluidDataStoreContext, props: any) {
        // return PropertyTreeRoot.factory.create(parentContext, props);
        throw new Error("Not yet implemented");
    }

    public create() {
        /* this.initialize(false); */
        console.log("A");
    }
    public async load(_context: IFluidDataStoreContext, _runtime: IFluidDataStoreRuntime, existing: boolean) {
        this._existing = existing;
        /* this.initialize(true); */
        console.log("B");
    }

    public override async request(request: IRequest): Promise<IResponse> {
        const url = request.url;
        console.log(url);
        this._queryString = url.split("?")[1];
        await this.initialize(this._existing);
        return super.request(request);
    }
}

/**
 * The DataObjectFactory is used by Fluid Framework to instantiate our DataObject.  We provide it with a unique name
 * and the constructor it will call.  In this scenario, the third and fourth arguments are not used.
 */
export const PropertyTreeInstantiationFactory = new LazyLoadedDataObjectFactory<LazyWorkspace>(
    "property-tree",
    LazyWorkspace,
    SharedDirectory.getFactory(),
    [new PropertyTreeFactory()],
    [],
);

export const PropertyTreeContainerRuntimeFactory = new ContainerRuntimeFactoryWithDefaultDataStore(
    PropertyTreeInstantiationFactory,
    new Map([
        ["property-tree", Promise.resolve(PropertyTreeInstantiationFactory)],
    ]),
);