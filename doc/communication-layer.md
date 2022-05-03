# Essential Communication Services

The conceptual umbrella for the Fluid data communication is the [IDocumentService](https://github.com/microsoft/FluidFramework/blob/05620a70827bedf6038ddb3a51697d58e92fd854/common/lib/driver-definitions/src/storage.ts#L261) exposing handles for downstream services such:
- __Storage services__ (`IDocumentStorageService`) - responsible to deliver data snapshots on request, 
- __Delta stream__ (`IDocumentDeltaConnection`) - required to streamline incremental document changes in form of pub/sub interactions
- __Delta storage services__ (`IDocumentDeltaStorageService`) - which provides on-demand access to the stored deltas for a given shared object, essentially required to patch the communication gaps, such undelivered messages

Underlying transport:

- __Storage services__ - Exclusively HTTP/REST
- __Delta stream__ - TCP/WS or HTTP long-polling
- __Delta storage services__ - Exclusively HTTP/REST

# Initial Loading

To date the loading process represents a series of `REST` calls to fetch the snapshot tree. In the case of [FluidHelloWorld](https://github.com/microsoft/FluidHelloWorld) the loading yields 32 `REST` calls, such:

```
getCommits (webpack:///node_modules/@fluidframework/server-services-client/lib/historian.js#58)
getCommits (webpack:///node_modules/@fluidframework/server-services-client/lib/gitManager.js#68)
getVersions (webpack:///node_modules/@fluidframework/routerlicious-driver/lib/shreddedSummaryDocumentStorageService.js#42)
getVersions (webpack:///node_modules/@fluidframework/routerlicious-driver/lib/shreddedSummaryDocumentStorageService.js#38)
getVersions (webpack:///node_modules/@fluidframework/container-loader/lib/retriableDocumentStorageService.js#31)
getVersion (webpack:///node_modules/@fluidframework/container-loader/lib/container.js#782)
fetchSnapshotTree (webpack:///node_modules/@fluidframework/container-loader/lib/container.js#1286)
load (webpack:///node_modules/@fluidframework/container-loader/lib/container.js#828)
resolve (webpack:///node_modules/@fluidframework/container-loader/lib/loader.js#124)
```
for loading the snapshot tree and multiple :

```
getBlob (webpack:///node_modules/@fluidframework/server-services-client/lib/historian.js#49)
getBlob (webpack:///node_modules/@fluidframework/server-services-client/lib/gitManager.js#85)
readBlob (webpack:///node_modules/@fluidframework/routerlicious-driver/lib/shreddedSummaryDocumentStorageService.js#87)
prefetchTreeCore (webpack:///node_modules/@fluidframework/driver-utils/lib/prefetchDocumentStorageService.js#73)
prefetchTree (webpack:///node_modules/@fluidframework/driver-utils/lib/prefetchDocumentStorageService.js#61)
getSnapshotTree (webpack:///node_modules/@fluidframework/driver-utils/lib/prefetchDocumentStorageService.js#30)
fetchSnapshotTree (webpack:///node_modules/@fluidframework/container-loader/lib/container.js#1292)
load (webpack:///node_modules/@fluidframework/container-loader/lib/container.js#828)
resolve (webpack:///node_modules/@fluidframework/container-loader/lib/loader.js#124)
```

calls for reading the nested blobs.

The snapshot tree is quite verbose as carries many details of the instantiated container:

```json
{
	"sha": "110f6c7a21ea2c4ee4aa7ebecfccec7570279179",
	"tree": [
		{
			"path": ".channels",
			"mode": "40000",
			"sha": "d70feaff1cdeebb6a9f840042e25260549f7b1f6",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".channels/rootDOId",
			"mode": "40000",
			"sha": "81603a45314ce7a15350b5815e33f0c02b508fbb",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels",
			"mode": "40000",
			"sha": "d60fd6cff468f6d229ecec2fa2d4d7edf77a2565",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/7a683482-4916-465e-931c-b6f16773233a",
			"mode": "40000",
			"sha": "db99ed4eb11be079c85f8666ad37a4d1ceafc647",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/7a683482-4916-465e-931c-b6f16773233a/.attributes",
			"mode": "100644",
			"sha": "ec0976e83e99c4660f11a0711bc82fa2a47d4cfc",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/7a683482-4916-465e-931c-b6f16773233a/header",
			"mode": "100644",
			"sha": "5ab05a8719630b219be3d28ec8cf47b30caa655c",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/root",
			"mode": "40000",
			"sha": "be0f6103acf52425c8e24953ade054ebd26ea16f",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/root/.attributes",
			"mode": "100644",
			"sha": "b842e94227b824a425d7219cf4bb2c912ba999fc",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.channels/root/header",
			"mode": "100644",
			"sha": "5af4c278bb63e8e283086fa698341472aeb2bf0d",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".channels/rootDOId/.component",
			"mode": "100644",
			"sha": "c35bbe00f9cb9ee99c8af3d4757411abdda3d8f3",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".electedSummarizer",
			"mode": "100644",
			"sha": "281a05982b6d4d03bc3df509ecdbc22a196cc69a",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".logTail",
			"mode": "40000",
			"sha": "f8f79f8d92556ac548c4cf345359fe316dd6a80b",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".logTail/logTail",
			"mode": "100644",
			"sha": "f388df13b6dfda731a94674ca5146083c010f20b",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".metadata",
			"mode": "100644",
			"sha": "8eaf0ecab838c6f7c1f793a633ad463e8ba855a6",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".protocol",
			"mode": "40000",
			"sha": "338a3496b594198f6bd7f12ab4e2ec48fadd6c7e",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".protocol/attributes",
			"mode": "100644",
			"sha": "9f1825d093f8c88322cb1ffc582cc7ea259c589d",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".protocol/quorumMembers",
			"mode": "100644",
			"sha": "0637a088a01e8ddab3bf3fa98dbe804cbde1a0dc",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".protocol/quorumProposals",
			"mode": "100644",
			"sha": "0637a088a01e8ddab3bf3fa98dbe804cbde1a0dc",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".protocol/quorumValues",
			"mode": "100644",
			"sha": "c730f7a6ff8c606cc2b7d083e5a9705bff0d7029",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".serviceProtocol",
			"mode": "40000",
			"sha": "ad7ff8e1f24b0d4b8ccdd69569b0f3d07619bd0b",
			"size": 0,
			"type": "tree",
			"url": ""
		},
		{
			"path": ".serviceProtocol/deli",
			"mode": "100644",
			"sha": "022f55a262299fa7f2549d53f0610a02483db450",
			"size": 0,
			"type": "blob",
			"url": ""
		},
		{
			"path": ".serviceProtocol/scribe",
			"mode": "100644",
			"sha": "1b2bf9a365034da2cd3901260f4b5cbc50b5f916",
			"size": 0,
			"type": "blob",
			"url": ""
		}
	],
	"url": ""
}
```

The snapshots are stored in a Git storage service. Furthermore the API offered by the [IDocumentStorageService](https://Github.com/microsoft/FluidFramework/blob/05620a70827bedf6038ddb3a51697d58e92fd854/common/lib/driver-definitions/src/storage.ts#L111) is organically tied to the Git conceptual domain (that is adopts concepts such commits, trees and blobs building-up faithfully on the [Git terminology](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)).

The usage of the interface is `read-only`.

```ts
/**
 * Interface to provide access to snapshots saved for a shared object
 */
export interface IDocumentStorageService extends Partial<IDisposable> {
    repositoryUrl: string;

    /**
     * Policies implemented/instructed by driver.
     */
    readonly policies?: IDocumentStorageServicePolicies;

    /**
     * Returns the snapshot tree.
     */
    getSnapshotTree(version?: IVersion): Promise<ISnapshotTree | null>;

    /**
     * Retrieves all versions of the document starting at the specified versionId - or null if from the head
     */
    getVersions(versionId: string | null, count: number): Promise<IVersion[]>;

    /**
     * Writes to the object with the given ID
     */
    write(root: ITree, parents: string[], message: string, ref: string): Promise<IVersion>;

    /**
     * Creates a blob out of the given buffer
     */
    createBlob(file: ArrayBufferLike): Promise<ICreateBlobResponse>;

    /**
     * Reads the object with the given ID, returns content in arrayBufferLike
     */
    readBlob(id: string): Promise<ArrayBufferLike>;

    /**
     * Uploads a summary tree to storage using the given context for reference of previous summary handle.
     * The ISummaryHandles in the uploaded tree should have paths to indicate which summary object they are
     * referencing from the previously acked summary.
     * Returns the uploaded summary handle.
     */
    uploadSummaryWithContext(summary: ISummaryTree, context: ISummaryContext): Promise<string>;

    /**
     * Retrieves the commit that matches the packfile handle. If the packfile has already been committed and the
     * server has deleted it this call may result in a broken promise.
     */
    downloadSummary(handle: ISummaryHandle): Promise<ISummaryTree>;
}
```

# Summarizing

A summary represents in Fluid multiple data snapshots. They are captured by the infrastructure, however client-side. There are two execution flavors of the summarizing functionality: [heuristic-based](https://github.com/microsoft/FluidFramework/blob/89f8a77ca9b6c25c4c1f3067565f72eb616db671/packages/runtime/container-runtime/src/summarizerHeuristics.ts#L52) and [on-demand](https://github.com/microsoft/FluidFramework/blob/89f8a77ca9b6c25c4c1f3067565f72eb616db671/packages/runtime/container-runtime/src/summarizer.ts#L319).

The functionality and implementation overlaps with the workflow already investigated in the [Initial Loading](#initial-loading) paragraph. The only addition is that summarizing is leveraging also the `write` methods of the interface.

Summarizing is distributed data structure (DDS) specific. 

```ts
/**
 * Gets a form of the object that can be serialized.
 * @returns A tree representing the snapshot of the shared object.
 */
protected abstract summarizeCore(serializer: IFluidSerializer): ISummaryTreeWithStats;

// where:

export interface ISummaryTreeWithStats {
    stats: ISummaryStats;
    summary: ISummaryTree;
}

export interface ISummaryStats {
    treeNodeCount: number;
    blobNodeCount: number;
    handleNodeCount: number;
    totalBlobSize: number;
    unreferencedBlobSize: number;
}
```

Deserves probably highlighted that the summarization result (`ISummaryTree`) is itself Git-ish:

```ts

export interface ISummaryTree {
    type: SummaryType.Tree;

    tree: { [path: string]: SummaryObject };
}

export type SummaryObject = ISummaryTree | ISummaryBlob | ISummaryHandle | ISummaryAttachment;

export interface ISummaryBlob {
    type: SummaryType.Blob;
    content: string | Uint8Array;
}

export interface ISummaryAttachment {
    type: SummaryType.Attachment;
    id: string;
}
```

For instance the [SharedMap](https://github.com/microsoft/FluidFramework/blob/89f8a77ca9b6c25c4c1f3067565f72eb616db671/packages/dds/map/src/map.ts#L248) uses following algorithm:

```ts
// If single property exceeds this size, it goes into its own blob
const MinValueSizeSeparateSnapshotBlob = 8 * 1024;

// Maximum blob size for multiple map properties
// Should be bigger than MinValueSizeSeparateSnapshotBlob
const MaxSnapshotBlobSize = 16 * 1024;

// Partitioning algorithm:
// 1) Split large (over MinValueSizeSeparateSnapshotBlob = 8K) properties into their own blobs.
//    Naming (across snapshots) of such blob does not have to be stable across snapshots,
//    As de-duping process (in driver) should not care about paths, only content.
// 2) Split remaining properties into blobs of MaxSnapshotBlobSize (16K) size.
//    This process does not produce stable partitioning. This means
//    modification (including addition / deletion) of property can shift properties across blobs
//    and result in non-incremental snapshot.
//    This can be improved in the future, without being format breaking change, as loading sequence
//    loads all blobs at once and partitioning schema has no impact on that process.
```

See also the heuristic summarizer [configuration documentation](https://github.com/microsoft/FluidFramework/blob/c71cb13c0c64d779447edffdb834a05739a0bacb/docs/content/docs/concepts/summarizer.md#summarizer)

# Incremental Updates

The [DocumentDeltaConnection](https://github.com/microsoft/FluidFramework/blob/a16019bb71b67deef3924ab47036d1aa534bafa9/packages/drivers/driver-base/src/documentDeltaConnection.ts#L38) represents a connection to a stream of delta updates. The low level communication is ensured by [socket.io library](https://github.com/socketio/socket.io)

In the case of [FluidHelloWorld](https://github.com/microsoft/FluidHelloWorld), which is based on the SharedMap DDS following notification path is observed (reduced for brevity):

```
updateDice (app.js:71)
emit (events.js:153)
processCore (map.js:289)
process (sharedObject.js:294)
process (channelDeltaConnection.js:33)
processOp (remoteChannelContext.js:46)
processChannelOp (dataStoreRuntime.js:596)
processRemoteMessage (container.js:1250)
processInboundMessage (deltaManager.js:566)
push (deltaQueue.js:59)
enqueueMessages (deltaManager.js:517)
incomingOpHandler (deltaManager.js:49)
ConnectionManager.opHandler (connectionManager.js:94)
emit (events.js:153)
(anonymous) (documentDeltaConnection.js:67)
Socket.onevent (socket.js:278)
ws.onmessage (websocket.js:160)
```

Is probably worth mentioning our understanding that the `DataStore` in Fluid container runtime terminology represents still a data snapshot, more precisely an [ISnapshotTree](https://github.com/microsoft/FluidFramework/blob/a16019bb71b67deef3924ab47036d1aa534bafa9/common/lib/protocol-definitions/src/storage.ts#L88) instantiation.

```ts
export interface ISnapshotTree {
    id?: string;
    blobs: { [path: string]: string };
    trees: { [path: string]: ISnapshotTree };
}

```

 Each runtime is associated with multiple [DataStores](https://github.com/microsoft/FluidFramework/blob/05620a70827bedf6038ddb3a51697d58e92fd854/packages/runtime/container-runtime/src/dataStores.ts#L60).

 WebSocket based notification is employed for super-low message delivery latencies (aka speed) but the important question from data consistency standpoint is: 
 
 __What are Fluid's message delivery guarantees? Is it possible that messages are lost during niche situations?__

 Actually FLuidFramework elevates the answer in the [published documentation](https://github.com/microsoft/FluidFramework/blob/42e6f0e949b02c055de7d7f06d148bb18c66336f/docs/content/docs/concepts/tob.md#fluid-data-operations-all-the-way-down) to the DDS data consistency level:

> __Fluid guarantees eventual consistency via total order broadcast.__ That is, when a DDS is changed locally by a client, that change – that is, the operation – is first sent to the Fluid service, which does three things:
>
> - Assigns a monotonically increasing sequence number to the operation; this is the “total order” part of total order broadcast.
> - Broadcasts the operation to all other connected clients; this is the “broadcast” part of total order broadcast.
> - Stores the operation’s data (see data persistence).

We will investigate in the sections  below how it is possible to offer such level of uncompromising reliability built on top of a protocol which offers no delivery guarantees (ie websocket).



# Quorum and Proposal

The shared protocol is used to establish value consensus across clients associated with a given Fluid session.

A [Quorum](https://github.com/microsoft/FluidFramework/blob/c7c985443a1c25df9d68f06390a32981a8c3c508/server/routerlicious/packages/protocol-base/src/quorum.ts#L346) represents all clients currently within the collaboration window. As well as the values they have agreed upon and any pending proposals.

The QuorumProposals [class](https://github.com/microsoft/FluidFramework/blob/c7c985443a1c25df9d68f06390a32981a8c3c508/server/routerlicious/packages/protocol-base/src/quorum.ts#L137) holds a key/value store.  Proposed values become finalized in the store once all connected clients have agreed on the proposal.

A quorum proposal transitions between four possible states: propose, accept, reject, and commit.

A proposal begins in the propose state. The proposal is sent to the server and receives a sequence number which is
used to uniquely identify it. Clients within the collaboration window accept the proposal by allowing their
reference sequence number to go above the sequence number for the proposal. They reject it by submitting a reject
message prior to sending a reference sequence number above the proposal number. Once the minimum sequence number
goes above the sequence number for the proposal without any rejections it is considered accepted.

The proposal enters the commit state when the minimum sequence number goes above the sequence number at which it
became accepted. In the commit state all subsequent messages are guaranteed to have been sent with knowledge of
the proposal. Between the accept and commit state there may be messages with reference sequence numbers prior to
the proposal being accepted.


# Delta Manager

The [DeltaManager](https://github.com/microsoft/FluidFramework/blob/02a318ea8ff5ca0fae5fce8f5e3060cee6eedffd/packages/loader/container-loader/src/deltaManager.ts#L76) stays at the core of FluidFramework strategy for the __exactly-once__ message delivery guarantee.

According to the internal documentation the `DeltaManager` manages the flow of both inbound and outbound messages. This class ensures that __shared objects receive delta messages in order regardless of possible network conditions or timings causing out of order delivery__.

The essential APIs:

The delta queue

```ts
/**
 * Queue of ops to be sent to or processed from storage
 */
export interface IDeltaQueue<T> extends IEventProvider<IDeltaQueueEvents<T>>, IDisposable {
    /**
     * Pauses processing on the queue
     * @returns A promise which resolves when processing has been paused.
     */
    pause(): Promise<void>;

    /**
     * Resumes processing on the queue
     */
    resume(): void;

    /**
     * Peeks at the next message in the queue
     */
    peek(): T | undefined;

    /**
     * Returns all the items in the queue as an array. Does not remove them from the queue.
     */
    toArray(): T[];
}

```

The delta manager

```ts
/**
 * Manages the transmission of ops between the runtime and storage.
 */
export interface IDeltaManager<T, U> extends IEventProvider<IDeltaManagerEvents>, IDeltaSender, IDisposable {
    /** The queue of inbound delta messages */
    readonly inbound: IDeltaQueue<T>;

    /** The queue of outbound delta messages */
    readonly outbound: IDeltaQueue<U[]>;

    /** The queue of inbound delta signals */
    readonly inboundSignal: IDeltaQueue<ISignalMessage>;

    /** The current minimum sequence number */
    readonly minimumSequenceNumber: number;

    /** The last sequence number processed by the delta manager */
    readonly lastSequenceNumber: number;

    /** The last message processed by the delta manager */
    readonly lastMessage: ISequencedDocumentMessage | undefined;

    /** The latest sequence number the delta manager is aware of */
    readonly lastKnownSeqNumber: number;

    /** The initial sequence number set when attaching the op handler */
    readonly initialSequenceNumber: number;

	// ...
}
```

The essential tracking in the `DeltaManager`:

- `initSequenceNumber` - The sequence number `DeltaManager` initially loaded from. Exposed by `IDeltaManager` interface as `initialSequenceNumber`.

- `minSequenceNumber` - The minimum sequence number is a sequence seen by all clients, and all clients will specify their reference sequence number as above the minium sequence number. This mean that no new operations can come in that reference anything at or below the minimum sequence number. Exposed by `IDeltaManager` interface as `minimumSequenceNumber`.

- `lastQueuedSequenceNumber` - is the last queued sequence number. If there are gaps in seq numbers, then this number is not updated until we cover that gap, so it increases each time by 1.

- `lastObservedSeqNumber` - is  an estimation of last known sequence number for the container in storage. It's initially populated at web socket connection time (if storage provides that info) and is updated once operations show up. It's never less than lastQueuedSequenceNumber.Exposed by `IDeltaManager` interface as `lastKnownSeqNumber`.

- `lastProcessedSequenceNumber` - shares the semantics of  `lastQueuedSequenceNumber` only that is after processing. Exposed by `IDeltaManager` interface as `lastSequenceNumber`.


Based on the sequence number tracking, the `DeltaManager` has the ability to __apply corrections in form of retrieving the missing deltas between the given sequence numbers__. The `from` is typically implied as `lastQueuedSequenceNumber + 1` whereas `to` is supplied as argument to the delta recovery call:

```ts
private fetchMissingDeltas(reason: string, to?: number){
	//..
}
private async fetchMissingDeltasCore(reason: string, cache: boolean, to?: number) {
	//..	
}
```

The delta queue correction requests are resolved internally by the __Delta storage service__ already identified in the introduction as one of the essential components

# Delta Storage Service

The interface to provide access to stored deltas for a shared object is  [IDeltaStorageService](https://github.com/microsoft/FluidFramework/blob/e85239320a86c29d20c5d322273aee6b4e00af8b/common/lib/driver-definitions/src/storage.ts#L44).

```ts
export interface IDeltaStorageService {
    /**
     * Retrieves all the delta operations within the inclusive sequence number range
     * @param tenantId - Id of the tenant.
     * @param id - document id.
     * @param from - first op to retrieve (inclusive)
     * @param to - first op not to retrieve (exclusive end)
     * @param fetchReason - Reason for fetching the messages. Example, gap between seq number
     *  of Op on wire and known seq number. It should not contain any PII. It can be logged by
     *  spo which could help in debugging sessions if any issue occurs.
     */
    get(
        tenantId: string,
        id: string,
        from: number, // inclusive
        to: number, // exclusive
        fetchReason?: string,
    ): Promise<IDeltasFetchResult>;
}
```