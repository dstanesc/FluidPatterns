import {
    TrackerWorkspace,
    TrackedWorkspace,
    HistoryWorkspace,
    createOneToOneTracking,
    createTrackedWorkspace,
    createTrackerWorkspace,
    createHistoryWorkspace,
    saveTracking,
    track,
} from "./tracking/workspaces";

import {
    ChangeEntry,
    Tracker,
    TrackedPropertyTree,
} from "./tracking/trackdds";



export {
    createOneToOneTracking,
    createTrackedWorkspace,
    createTrackerWorkspace,
    createHistoryWorkspace,
    saveTracking,
    track, TrackedPropertyTree
};    

export type {
        TrackerWorkspace,
        TrackedWorkspace, ChangeEntry,
        Tracker, HistoryWorkspace
    };

