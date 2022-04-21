import {
  configureBinding,
  initPropertyTree,
  retrieveMapProperty,
  createContainerProperty,
  Topics,
  containerMapSchema,
  containerSchema,
  queryMapSchema,
  queryResultMapSchema,
  queryResultSchema,
  querySchema,
  int32MapSchema,
  PlexusModel,
  PlexusListenerResult,
  checkPlexusNameservice,
  updatePlexusNameservice,
  appendQueryResultProperty,
  getOffset,
  setOffset
} from "@dstanesc/plexus-util";

import {
  TrackerWorkspace,
  TrackedWorkspace,
  createOneToOneTracking,
  createTrackedWorkspace,
  createTrackerWorkspace,
  saveTracking,
  track,
  ChangeEntry,
  Tracker,
  TrackedPropertyTree
} from "@dstanesc/tracker-util";

import {
  AssemblyQueryResult
} from "@dstanesc/assembly-util";

import { SimpleWorkspace, createSimpleWorkspace, registerSchema } from "@dstanesc/fluid-util2";
import { AssemblyComponent, parseChangeSet } from "@dstanesc/assembly-util";
import { DataBinder } from "@fluid-experimental/property-binder";
import { Workspace } from "@dstanesc/fluid-util";
import figlet from "figlet";
import { ArrayProperty, MapProperty, NamedProperty, StringProperty } from "@fluid-experimental/property-properties";
import { v4 as uuidv4 } from 'uuid';
import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SerializedChangeSet, SharedPropertyTree } from "@fluid-experimental/property-dds";
import jp from "jsonpath";
import { Client } from "@elastic/elasticsearch";
import { ChangeSet } from "@fluid-experimental/property-changeset";
import _ from "lodash"


const plexusServiceAlias: string = "local-plexus-service";

const trackerServiceAlias: string = "local-tracker-service";

const searchAgentIdentity: string = "elastic-indexing-service-1";

const elasticSearchClient = new Client({ node: 'http://elastic:9200' });

let registry: Map<string, PlexusModel> = new Map<string, PlexusModel>();

let operationLog: Map<string, PlexusModel> = new Map<string, PlexusModel>();

let queryLog: Map<string, PlexusModel> = new Map<string, PlexusModel>();

let plexusWorkspace: SimpleWorkspace;

let tracker: Tracker;

let trackerCursor: number = 0;

interface ElasticDocument extends AssemblyComponent {
  containerId: string;
  sequenceNumber: number;
}


const updateRegistry = (fn: any) => {
  const plexusListenerResult: PlexusListenerResult = fn(registry);
  registry = plexusListenerResult.result;
  registry.forEach((entry, key) => {
    console.log(`key=${key} entry=${JSON.stringify(entry)}`);
  })
}


const queryReceived = (fn: any) => {
  const plexusListenerResult: PlexusListenerResult = fn(queryLog);
  queryLog = plexusListenerResult.result;
  const plexusModel: PlexusModel = plexusListenerResult.increment;
  if (plexusModel) {
    const uid: string = plexusModel.id;
    const queryText = plexusModel.text;
    console.log(`Received query guid=${uid} queryText=${queryText}`);
  } else {
    console.log(`Could not find queryLog plexusModel for ${plexusListenerResult.operationType}`)
  }
}

const sendQueryResult = (uid: string, queryText: string) => {
  const queryResultLog: MapProperty = retrieveMapProperty(plexusWorkspace, Topics.QUERY_RESULT_LOG);
  appendQueryResultProperty(uid, queryText, queryResultLog);
  plexusWorkspace.commit();
}

const queryResultReceived = (fn: any) => {
  // ignore callback
}

const getUniqueIdentity = (elasticDocument: ElasticDocument) => {

  return elasticDocument.containerId + "--" +elasticDocument.id;
}

const insertElasticSearch = (elasticDocument: ElasticDocument) => {

  console.log(`Inserting elastic document ${JSON.stringify(elasticDocument, null, 2)}`);

  const toIndex = {
    index: "plexus-materialized-view",
    id: getUniqueIdentity(elasticDocument),
    body: elasticDocument
  };

  elasticSearchClient.exists({
    index: "plexus-materialized-view",
    id: getUniqueIdentity(elasticDocument)
  }).then(exists => {
    //console.log(`Exists check =${JSON.stringify(exists, null, 2)}`);
    if (!exists.body) {
      console.log(`Document not found, actually indexing`);
      elasticSearchClient.index(toIndex);
    }
  });
}

const modifyElasticSearch = (elasticDocument: ElasticDocument) => {

  console.log(`Modifying elastic document ${JSON.stringify(elasticDocument, null, 2)}`);

  const toIndex = {
    index: "plexus-materialized-view",
    id: getUniqueIdentity(elasticDocument),
    body: {
      doc: elasticDocument
    }
  };

  elasticSearchClient.exists({
    index: "plexus-materialized-view",
    id: getUniqueIdentity(elasticDocument)
  }).then(exists => {
    console.log(`Exists check =${JSON.stringify(exists, null, 2)}`);
    if (exists.body) {
      console.log(`Document found, actually updating \n${JSON.stringify(toIndex, null, 2)}`);
      elasticSearchClient.update(toIndex);
    }
  });
}

const answerQueries = () => {

  queryLog.forEach(async (query, uid) => {

    console.log(`Answering query ${uid} ${query.text}`);

    const parsedQuery = JSON.parse(query.text);

    // {
    //   "anno": "yello fella",
    //   "color": "blue",
    //   "id": "rect1",
    //   "x": {
    //     "from": "100",
    //     "to": "200"
    //   },
    //   "y": {
    //     "from": "100",
    //     "to": "200"
    //   },
    //   "width": {
    //     "from": "100",
    //     "to": "200"
    //   },
    //   "height": {
    //     "from": "100",
    //     "to": "200"
    //   },
    //   "exclude": {}
    // }

    console.log(`Parsed Query\n${query.text}`);

    let queryMust = [];

    if (typeof parsedQuery === "object" && parsedQuery !== null) {
      // is JSON

      if (parsedQuery.text) {
        queryMust.push({ "match": { "annotation": parsedQuery.text } });
      }

      if (parsedQuery.id) {
        queryMust.push({ "term": { "id": parsedQuery.id } });
      }

      if (parsedQuery.fill) {
        queryMust.push({ "term": { "fill": parsedQuery.fill } });
      }

      if (parsedQuery.x) {
        queryMust.push({ "range": { "x": { "gte": parsedQuery.x.from, "lte": parsedQuery.x.to } } });
      }

      if (parsedQuery.y) {
        queryMust.push({ "range": { "y": { "gte": parsedQuery.y.from, "lte": parsedQuery.y.to } } });
      }

      if (parsedQuery.width) {
        queryMust.push({ "range": { "width": { "gte": parsedQuery.width.from, "lte": parsedQuery.width.to } } });
      }

      if (parsedQuery.height) {
        queryMust.push({ "range": { "height": { "gte": parsedQuery.height.from, "lte": parsedQuery.height.to } } });
      }
    } else {
      // is text
      queryMust.push({ "match": { "annotation": parsedQuery } });
    }

    // {
    //   "query": {
    //     "bool": {
    //       "must": [
    //         {
    //           "match": {
    //             "annotation": "yello"
    //           }
    //         },
    //         {
    //           "term": {
    //             "id": "rect1"
    //           }
    //         },
    //         {
    //           "range": {
    //             "x": {
    //               "gte": 100,
    //               "lte": 500
    //             }
    //           }
    //         },
    //         {
    //           "range": {
    //             "y": {
    //               "gte": 10,
    //               "lte": 500
    //             }
    //           }
    //         },
    //         {
    //           "range": {
    //             "width": {
    //               "lte": 500
    //             }
    //           }
    //         },
    //         {
    //           "range": {
    //             "height": {
    //               "gte": 100
    //             }
    //           }
    //         }
    //       ]
    //     }
    //   }
    // }

    const queryMustString = JSON.stringify(queryMust, null, 2);

    console.log(`Elastic Query\n${queryMustString}`);

    const { body } = await elasticSearchClient.search({
      index: 'plexus-materialized-view',
      body: {
        query: {
          bool: {
            must: queryMust
          }
        }
      }
    });

    // {
    //   "took": 4,
    //   "timed_out": false,
    //   "_shards": {
    //     "total": 1,
    //     "successful": 1,
    //     "skipped": 0,
    //     "failed": 0
    //   },
    //   "hits": {
    //     "total": {
    //       "value": 1,
    //       "relation": "eq"
    //     },
    //     "max_score": 5.568616,
    //     "hits": [
    //       {
    //         "_index": "plexus-materialized-view",
    //         "_type": "_doc",
    //         "_id": "rect1",
    //         "_score": 5.568616,
    //         "_source": {
    //           "containerId": "936db22d-ed9e-47a3-896b-5c9a882185ec",
    //           "sequenceNumber": 10,
    //           "id": "rect1",
    //           "annotation": "Yello fella",
    //           "fill": "#eeff41",
    //           "x": 451,
    //           "y": 69,
    //           "width": 105,
    //           "height": 124
    //         }
    //       }
    //     ]
    //   }
    // }

    const resultArray = body.hits.hits;

    resultArray.forEach((result, i) => {

      const source = result._source;

      const queryResult: AssemblyQueryResult = {
        index: i,
        score: result._score,
        containerId: source.containerId,
        sequenceNumber: source.sequenceNumber,
        id: source.id,
        annotation: source.annotation,
        fill: source.fill,
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height
      };

      const queryResultString = JSON.stringify(queryResult, null, 2);

      console.log(`Sending query result ${queryResultString}`);

      sendQueryResult(uid, queryResultString);

    });

    queryLog.delete(uid);
  });
}

const poll = () => {

  console.log(`Polling cursor=${trackerCursor} length=${tracker.length()}`);

  if (tracker.length() > 0) {

    for (let offset = trackerCursor; offset < tracker.length(); offset++) {

      const changeEntry: ChangeEntry = tracker.getChangeAt(offset);
      const changeSet: ChangeSet = changeEntry.changeset;
      const containerId: string = changeEntry.trackedContainerId;
      const lastSeq: number = changeEntry.lastSeq;
      const serializedChangeSet: SerializedChangeSet = changeSet.getSerializedChangeSet();

      console.log(`ChangeEntry received, cursor=${offset}, container=${containerId}, lastSeq=${lastSeq}, changeSet=${JSON.stringify(serializedChangeSet, null, 2)}`);

      trackerCursor = offset + 1;

      const { "inserted": inserted, "modified": modified } = parseChangeSet(serializedChangeSet);

      inserted.forEach(component => {
        const elasticDocument: ElasticDocument = { "containerId": containerId, "sequenceNumber": lastSeq, ...component };
        insertElasticSearch(elasticDocument);
      });

      modified.forEach(component => {
        const elasticDocument: ElasticDocument = { "containerId": containerId, "sequenceNumber": lastSeq, ...component };
        modifyElasticSearch(elasticDocument);
      });
    }
  }
}

const initAgent = async () => {

  const out = figlet.textSync('Starting Fluid Plexus!', {
    font: 'Standard'
  });

  console.log(out);

  registerSchema(int32MapSchema);
  registerSchema(containerSchema);
  registerSchema(containerMapSchema);
  registerSchema(queryMapSchema);
  registerSchema(queryResultMapSchema);
  registerSchema(querySchema);
  registerSchema(queryResultSchema);


  const plexusContainerId: string | undefined = await checkPlexusNameservice(plexusServiceAlias);

  // Initialize the workspace
  const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(plexusContainerId);

  console.log(`Plexus workspace created`);

  const dataBinder: DataBinder = simpleWorkspace.dataBinder;

  plexusWorkspace = simpleWorkspace;

  // Configure registry binding
  configureBinding(dataBinder, simpleWorkspace, updateRegistry, "hex:containerMap-1.0.0", "registry");

  // Configure query binding
  configureBinding(dataBinder, simpleWorkspace, queryReceived, "hex:queryMap-1.0.0", "queryLog");

  console.log(`Binding configured`);

  if (!plexusContainerId) {

    // Initialize plexus property tree
    initPropertyTree(undefined, simpleWorkspace, { registryListener: updateRegistry, queryListener: queryReceived, queryResultListener: queryResultReceived });

    console.log(`Property tree initialized`);

    console.log(`Posting ${plexusServiceAlias}=${simpleWorkspace.containerId} to the nameservice ..`);

    await updatePlexusNameservice(plexusServiceAlias, simpleWorkspace.containerId);
  }

  console.log(`Check Plexus Nameservice for ${trackerServiceAlias}`);

  const trackerContainerId: string | undefined = await checkPlexusNameservice(trackerServiceAlias);

  console.log(`Found trackerContainerId is ${trackerContainerId}`);

  const trackerWorkspace: TrackerWorkspace = await createTrackerWorkspace(trackerContainerId);

  console.log(`TrackerWorkspace created for ${trackerWorkspace.containerId}`);

  tracker = trackerWorkspace.tree;

  if (!trackerContainerId) {

    console.log(`Posting ${trackerServiceAlias}=${trackerWorkspace.containerId} to the nameservice ..`);

    await updatePlexusNameservice(trackerServiceAlias, trackerWorkspace.containerId);
  }

  setInterval(poll, 3000);

  setInterval(answerQueries, 3000);

  return simpleWorkspace;
}


const initOffset = (plexusWorkspace: SimpleWorkspace) => {

  try {
    trackerCursor = getOffset(plexusWorkspace, searchAgentIdentity);
    console.log(`Offset retrieved and set to ${trackerCursor}`);
  } catch (error) {
    setOffset(plexusWorkspace, searchAgentIdentity, 0);
    plexusWorkspace.commit;
    console.log(`Offset initialized to 0`);
  }
}


initAgent().then(plexusWorkspace => {

  initOffset(plexusWorkspace);

  const out = figlet.textSync('Fluid Plexus Started', {
    font: 'Standard'
  });

  console.log(out);

}).catch(err => console.log(err));

