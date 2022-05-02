# Essential Communication Services

The conceptual umbrella for the Fluid data communication is the [IDocumentService](https://github.com/microsoft/FluidFramework/blob/05620a70827bedf6038ddb3a51697d58e92fd854/common/lib/driver-definitions/src/storage.ts#L261) exposing handles for downstream services such:
- __storage services__ (`IDocumentStorageService`) - responsible to deliver data snapshots on request, 
- __delta stream__ (`IDocumentDeltaConnection`) - required to streamline incremental document changes in form of pub/sub interactions
- __delta storage services__ (`IDocumentDeltaStorageService`) - which provides on-demand access to the stored deltas for a given shared object, essentially required to patch the communication gaps, such undelivered messages

Underlying transport:

- __storage services__ - HTTP/REST
- __delta stream__ - TCP/WS
- __delta storage services__ - HTTP/REST

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

Summaries represent in Fluid snapshots of the data. They are captured by the infrastructure, however client-side. There are two execution flavors of the summarizing functionality: [heuristic-based](https://github.com/microsoft/FluidFramework/blob/89f8a77ca9b6c25c4c1f3067565f72eb616db671/packages/runtime/container-runtime/src/summarizerHeuristics.ts#L52) and [on-demand](https://github.com/microsoft/FluidFramework/blob/89f8a77ca9b6c25c4c1f3067565f72eb616db671/packages/runtime/container-runtime/src/summarizer.ts#L319).

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
