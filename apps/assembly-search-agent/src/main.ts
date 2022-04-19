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
  PlexusModel,
  PlexusListenerResult,
  checkPlexusNameservice,
  updatePlexusNameservice,
  appendQueryResultProperty

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
import { QueryResult } from "@dstanesc/plexus-util/dist/plexusApi";
import { ChangeSet } from "@fluid-experimental/property-changeset";
import _ from "lodash"


const plexusServiceAlias: string = "local-plexus-service";

const trackerServiceAlias: string = "local-tracker-service";

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


const insertElasticSearch = (elasticDocument: ElasticDocument) => {

  console.log(`Inserting elastic document ${JSON.stringify(elasticDocument, null, 2)}`);

  const toIndex = {
    index: "plexus-materialized-view",
    id: elasticDocument.id,
    body: elasticDocument
  };

  elasticSearchClient.exists({
    index: "plexus-materialized-view",
    id: elasticDocument.id
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
    id: elasticDocument.id,
    body: {
      doc: elasticDocument
    }
  };

  elasticSearchClient.exists({
    index: "plexus-materialized-view",
    id: elasticDocument.id
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

    const { body } = await elasticSearchClient.search({
      index: 'plexus-materialized-view',
      body: {
        query: {
          match: {
            annotation: query.text
          }
        }
      }
    });


    //   "hits": {
    //     "total": {
    //       "value": 2,
    //       "relation": "eq"
    //     },
    //     "max_score": 0.5981865,
    //     "hits": [
    //       {
    //         "_index": "plexus-materialized-view",
    //         "_type": "_doc",
    //         "_id": "0e5b78b9-c7b6-413b-b9fb-4196a29c3ebe",
    //         "_score": 0.5981865,
    //         "_source": {
    //           "containerId": "1eecdc4d-71c4-4b1c-927a-864d05b64e43",
    //           "commentId": "0e5b78b9-c7b6-413b-b9fb-4196a29c3ebe",
    //           "sequenceNumber": 17,
    //           "commentText": "We should try again and again"
    //         }
    //       }
    //     ]
    //   }
    // }
    const resultArray = body.hits.hits;

    resultArray.forEach((result, i) => {
      const source = result._source;
      const queryResult: QueryResult = {
        index: i,
        score: result._score,
        containerId: source.containerId,
        commentId: source.commentId,
        sequenceNumber: source.sequenceNumber,
        commentText: source.commentText
      };

      const queryResultString = JSON.stringify(queryResult, null, 2);

      console.log(`Sending query result ${queryResultString}`);

      sendQueryResult(uid, queryResultString);

    });
    queryLog.delete(uid);
  });
}

const poll = () => {

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

  registerSchema(containerSchema);
  registerSchema(containerMapSchema);
  registerSchema(queryMapSchema);
  registerSchema(queryResultMapSchema);
  registerSchema(querySchema);
  registerSchema(queryResultSchema);


  const plexusContainerId: string | undefined = await checkPlexusNameservice(plexusServiceAlias);

  // Initialize the workspace
  const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(plexusContainerId);

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

  const trackerContainerId: string | undefined = await checkPlexusNameservice(trackerServiceAlias);

  const trackerWorkspace: TrackerWorkspace = await createTrackerWorkspace(trackerContainerId);

  tracker = trackerWorkspace.tree;

  if (!trackerContainerId) {

    console.log(`Posting ${trackerServiceAlias}=${trackerWorkspace.containerId} to the nameservice ..`);

    await updatePlexusNameservice(trackerServiceAlias, trackerWorkspace.containerId);
  }

  setInterval(poll, 3000);

  setInterval(answerQueries, 3000);

  return simpleWorkspace;
}


initAgent().then(boundWorkspace => {

  const dataBinder = boundWorkspace.dataBinder;

  const out = figlet.textSync('Fluid Plexus Started', {
    font: 'Standard'
  });

  console.log(out);

}).catch(err => console.log(err));

