# Usage

## One To One Tracker Usage

If it is sufficient for us that each property DDS has it's own Tracker DDS, we can use the predefined 
method ``createOneToOneTracking``

```
const trackedTracker = createOneToOneTracking(containerId);
const tracked = await (await trackedTracker).tracked;
const tracker = await (await trackedTracker).tracker;
```

- The ``tracked`` object is the workspace of the Property DDS which is now tracked. The Property DDS used here is and extension
of ``SharedPropertyTree``, it is the ``TrackedPropertyTree`` class
- The ``tracker`` object is the DDS which collects and squashes the history from ``tracked`` object.
- The ``tracker`` object implements the contains following  methods to navigate the squashed history

``` 
 getChangeAt(offset: number): ChangeEntry;
 getSeqAt(offset: number): number
 length(): number;
 list();    
```

The ``ChangeEntry`` contains following attributes

```   
 trackedContainerId: string;
 changeset: ChangeSet;
 lastSeq: number;
```


## Many To One Tracker Usage

It is still possible to create Tracker which listens to many Property DDSes. 
But the management of the containers will have to be done on the application level.

- First Tracked Property DDS can use ``createOneToOneTracking`` method
- the obtained ``tracked`` object is of ``TrackedPropertyTree`` class
- ``tracked`` object contains ``getTrackerInfo`` method which gives us Container ID od the Tracker DDS
- when creating the second Tracked Property DDS, we should at first load the Tracker DDS
- Then we should use the method ``createTrackedWorkspace``
- in case of creation (first load), we should call the method ``saveTracking(tracked,tracker)`` afterwards.
This method will persist the Tracker Container Id to Tracked Property DDS
- for all loads (the creational one and also the next ones) we should also call method ``track(tracked,tracker)``
- for non-creational load, we can obtain Tracker Container Id from Tracked Property DDS by calling ``getTrackerInfo``
,this means that we do not need to supply it from outside
- we can for example specify the Tracker Container Id in url only for creation (need to design, how to distinguish Container ID and Tracker Container ID)



# History Usage

HistoryWorkspace interface was developed to simplify history navigation of the Property DDS

## Methods
- getTracked() : Returns the TraqckedWorkspace containing the Property DDS
- setAutoPersist(isAutoPersist: boolean) : 
- persistPoint() : 
- move(step: number) :
- commit() : 
}

## Usage

- import needed : ``import { createHistoryWorkspace, HistoryWorkspace, TrackedWorkspace } from "@dstanesc/tracker-util";``
- create or load HistoryWorkspace :  ``const historyWorkspace = await createHistoryWorkspace(containerId);``
- retrieve TrackedWorkspace containing Property DDS ``const tracked = await historyWorkspace.getTracked();``
- if you want to explicitly decide, when to persist point, switch off AutoPersist : ``historyWorkspace.setAutoPersist(false);``
- call persistPoint method any time, when you want to squash history to the current point : ``historyWorkspace.persistPoint()``
- call move method when you want to navigate history, the receiving remote chnages will be stopped : ``historyWorkspace.move(-1)``
- calling commit can lead to desynchronization of all other live clients






