/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelServices,
    IChannelFactory,
} from "@fluidframework/datastore-definitions";
import { SquashedHistory, TrackedPropertyTree } from "./trackdds";


export class TrackedPropertyTreeFactory implements IChannelFactory {
    public static readonly Type = "https://graph.microsoft.com/types/trackedpropertytree";

    public static readonly Attributes: IChannelAttributes = {
        type: TrackedPropertyTreeFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.1",
    };

    public get type() {
        return TrackedPropertyTreeFactory.Type;
    }

    public get attributes() {
        return TrackedPropertyTreeFactory.Attributes;
    }

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes): Promise<TrackedPropertyTree> {
        const miprop = new TrackedPropertyTree(id, runtime, attributes);
        await miprop.load(services);
        return miprop;
    }

    public create(document: IFluidDataStoreRuntime, id: string): TrackedPropertyTree {
        const miprop = new TrackedPropertyTree(id, document, this.attributes);
        return miprop;
    }
}



export class SquashedHistoryFactory implements IChannelFactory {
    public static readonly Type = "https://graph.microsoft.com/types/squashedhistory";

    public static readonly Attributes: IChannelAttributes = {
        type: SquashedHistoryFactory.Type,
        snapshotFormatVersion: "0.1",
        packageVersion: "0.0.1",
    };

    public get type() {
        return SquashedHistoryFactory.Type;
    }

    public get attributes() {
        return SquashedHistoryFactory.Attributes;
    }

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes): Promise<SquashedHistory> {
        const miprop = new SquashedHistory(id, runtime, attributes);
        await miprop.load(services);
        return miprop;
    }

    public create(document: IFluidDataStoreRuntime, id: string): SquashedHistory {
        const miprop = new SquashedHistory(id, document, this.attributes);
        return miprop;
    }
}