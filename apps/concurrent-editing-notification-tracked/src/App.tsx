import React, { useEffect, useRef, useState } from 'react';

import { Stage, Layer, Rect, Transformer, Text, Group, Tag, Label } from 'react-konva';
import { Html } from 'react-konva-utils';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import HomeIcon from '@mui/icons-material/Home';
import OtherHousesIcon from '@mui/icons-material/OtherHouses';
import DifferenceIcon from '@mui/icons-material/Difference';
import MergeIcon from '@mui/icons-material/Merge';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import Zoom from '@mui/material/Zoom';
import CommitIcon from '@mui/icons-material/Commit';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';
import { DataGrid, GridColDef, gridEditRowsStateSelector, GridValueGetterParams } from '@mui/x-data-grid';

import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import './App.css';

import { DataBinder } from "@fluid-experimental/property-binder";

import { copy as deepClone } from "fastest-json-copy";

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
    retrieveMapProperty,
    createContainerProperty,
    containerMapSchema,
    containerSchema,
    operationMapSchema,
    operationSchema,
    queryMapSchema,
    queryResultMapSchema,
    queryResultSchema,
    querySchema,
    Topics,
    appendQueryProperty,
    configureBinding as configurePlexusBinding,
    checkPlexusNameservice
  } from "@dstanesc/plexus-util";

import {
    registerSchema,
    createSimpleWorkspace,
    SimpleWorkspace
} from "@dstanesc/fluid-util2";

import { assemblyComponentSchema } from "./assemblyComponent-1.0.0";

import { assemblySchema } from "./assembly-1.0.0";

import {
    configureAssemblyBinding,
    initPropertyTree,
    retrieveAssemblyMapProperty,
    updateAssemblyComponentProperty
} from './assemblyApi';

import { AssemblyComponent } from './assemblyListener';
import { assembly, Compare, compareTable, Conflict, conflicts, index, isModified } from './assemblyDiff';
import _, { merge } from "lodash"


const getTableColumns = (shape: string): GridColDef[] => {

    return [
        { field: 'field', headerName: shape, type: 'string', width: 70 },
        { field: 'local', headerName: 'LOCAL', type: 'number', width: 70 },
        { field: 'remote', headerName: 'SDC', type: 'number', width: 70 },
        { field: 'diff', headerName: 'DIFF', type: 'number', width: 70 },
    ];
};

function Rectangle(props: any) {

    return (
        <Rect
            ref={props.rectRef}
            {...props.value}
            draggable={props.draggable}
            onDragStart={props.onDragStart}
            onDragEnd={props.onDragEnd}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
            onClick={props.onClick}
        />
    );
}

const plexusServiceName: string = "local-plexus-service";

const trackerServiceAlias: string = "local-tracker-service";

export default function App() {

    /*
     * Main state
     */

    const containerId = window.location.hash.substring(1) || undefined;

    const workspace = useRef<TrackedWorkspace>(null);

    const [localComponents, setLocalComponents] = useState<AssemblyComponent[]>([]);

    const [remoteComponents, setRemoteComponents] = useState<AssemblyComponent[]>([]);

    const baseline = useRef<AssemblyComponent[]>([]);

    const [visible, setVisible] = useState({
        local: true,
        localChanges: false,
        annotations: false,
        merge: false,
        remote: false,
        remoteChanges: false,
        dataTable: false
    });


    /*
     * Derived state
     */

    const [localChanges, setLocalChanges] = useState<Map<string, AssemblyComponent>>(new Map());

    const [remoteChanges, setRemoteChanges] = useState<Map<string, AssemblyComponent>>(new Map());

    const [mergeComponents, setMergeComponents] = useState<Conflict[]>([]);

    const [displayData, setDisplayData] = useState<Map<string, Compare[]>>(new Map());


    /*
     * Dialog
     */
    const [annoOpen, setAnnoOpen] = React.useState(false);

    const [annoText, setAnnoText] = useState("");

    const [annoComponent, setAnnoComponent] = useState<AssemblyComponent>();

    useEffect(() => {
        initTrackerWorkspace()
            .then((trackerWorkspace) => initLocalAssemblyWorkspace(trackerWorkspace))
            .then((localWorkspace) => initRemoteAssemblyWorkspace(localWorkspace));
    }, []); // [] to be executed only once


    useEffect(() => {
        if (baseline.current.length > 0)
            setLocalChanges(index(isModified(localComponents, baseline.current)));
    }, [localComponents]);

    useEffect(() => {
        if (baseline.current.length > 0)
            setRemoteChanges(index(isModified(remoteComponents, baseline.current)));
    }, [remoteComponents]);

    useEffect(() => {
        setMergeComponents(conflicts(localChanges, remoteChanges));
    }, [localChanges, remoteChanges]);

    useEffect(() => {
        setDisplayData(compareTable(localComponents, remoteComponents));
    }, [localComponents, remoteComponents]);


    // async function initPlexusWorkspace() {

    //     registerSchema(operationSchema);
    //     registerSchema(operationMapSchema);
    //     registerSchema(containerSchema);
    //     registerSchema(containerMapSchema);
    //     registerSchema(queryMapSchema);
    //     registerSchema(queryResultMapSchema);
    //     registerSchema(querySchema);
    //     registerSchema(queryResultSchema);
    
    //     const configuredPlexusContainerId: string = await checkPlexusNameservice(plexusServiceName);
    
    //     // Initialize the workspace
    //     const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(configuredPlexusContainerId);
    
    //     const myPlexusWorkspace: Workspace = boundWorkspace.workspace;
    
    //     // Make workspace available
    //     plexusWorkspace.current = myPlexusWorkspace;
    //   }


    async function initLocalAssemblyWorkspace(trackerWorkspace: TrackerWorkspace): Promise<SimpleWorkspace> {

        registerSchema(assemblyComponentSchema);
        registerSchema(assemblySchema);

        const trackedWorkspace: TrackedWorkspace = await createTrackedWorkspace(containerId);

        if (!containerId) {

            saveTracking(trackedWorkspace, trackerWorkspace);
        }

        track(trackedWorkspace, trackerWorkspace);

        const myDataBinder: DataBinder = trackedWorkspace.dataBinder;

        configureAssemblyBinding(myDataBinder, trackedWorkspace, "local", setLocalComponents);

        initPropertyTree(containerId === undefined, trackedWorkspace, setLocalComponents);

        workspace.current = trackedWorkspace;

        window.location.hash = trackedWorkspace.containerId;

        return trackedWorkspace;
    }

    async function initRemoteAssemblyWorkspace(localWorkspace: SimpleWorkspace): Promise<SimpleWorkspace> {

        const simpleWorkspace: SimpleWorkspace = await createTrackedWorkspace(localWorkspace.containerId);

        initPropertyTree(false, simpleWorkspace, setRemoteComponents);
        
        configureAssemblyBinding(simpleWorkspace.dataBinder, simpleWorkspace, "remote", setRemoteComponents);

        return simpleWorkspace;
    }

    async function initTrackerWorkspace() {

        const trackerContainerId: string | undefined = await checkPlexusNameservice(trackerServiceAlias);

        const trackerWorkspaceFound: TrackerWorkspace = await createTrackerWorkspace(trackerContainerId);

        return trackerWorkspaceFound;
    }

    async function createBaseline() {

        baseline.current = [...localComponents];
    }

    async function resetLocalChanges() {

        setLocalChanges(new Map<string, AssemblyComponent>());
    }

    async function resetRemoteChanges() {

        setRemoteChanges(new Map<string, AssemblyComponent>());
    }

    const commitWorkspace = () => {

        workspace.current.commit();

        createBaseline();

        resetLocalChanges();

        resetRemoteChanges();
    }

    const modifyComponent = (assemblyComponent: AssemblyComponent) => {
        const assemblyMapProperty = retrieveAssemblyMapProperty(workspace.current);
        updateAssemblyComponentProperty(assemblyMapProperty, assemblyComponent);
    }

    const mergeSelectedRemoteComponent = (id: string) => {
        const remoteComponent: AssemblyComponent = remoteChanges.get(id);
        modifyComponent(remoteComponent);
    }

    const handleVisibility = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setVisible({
            ...visible,
            [event.target.name]: event.target.checked,
        });
    };

    const getTableRows = (shape: string) => {
        const shapeDisplay = displayData.get(shape);
        return shapeDisplay ? shapeDisplay : [];
    }

    const getTableVisibility = (shape: string) => {
        if (visible.merge) {
            return (mergeComponents.filter(component => component.id === shape).length > 0) ? "" : "none";
        }
        return visible.dataTable ? "" : "none";
    }

    const getRowClass = (diff: number) => {

        return diff === 0 ? "" : "highlight";
    }

    function annoClear() {
        setAnnoOpen(false);
        setAnnoComponent(undefined);
        setAnnoText("");
    }

    const handleAnnoDialogOpen = () => {
        setAnnoOpen(true);
    };

    const handleAnnoDialogClose = () => {
        annoClear();
    };

    const handleAnnoDialogSubmit = () => {
        annoComponent.annotation = annoText;
        modifyComponent(annoComponent);
        annoClear();
    };

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
        >
            <Layer visible={visible.local}>

                {localComponents.map((rect, i) => {

                    let shape;

                    const showAnnotationDialog = () => {
                        setAnnoComponent(rect);
                        setAnnoText(rect.annotation);
                        handleAnnoDialogOpen();
                    }

                    const resizeAndUpdate = () => {

                        const resize = true;
                        const newX = (resize) ? Math.floor(shape.x() * randomInRange(0.8, 1.2)) : Math.floor(shape.x());
                        const newY = (resize) ? Math.floor(shape.y() * randomInRange(0.8, 1.2)) : Math.floor(shape.y());
                        const newWidth = (resize) ? Math.floor(Math.max(100, shape.width() * randomInRange(0.7, 1.3))) : Math.floor(shape.width());
                        const newHeight = (resize) ? Math.floor(Math.max(100, shape.height() * randomInRange(0.7, 1.3))) : Math.floor(shape.height());

                        const assemblyComponent: AssemblyComponent = {
                            "id": rect.id,
                            "fill": rect.fill,
                            "x": newX,
                            "y": newY,
                            "width": newWidth,
                            "height": newHeight,
                            "annotation": rect.annotation
                        };

                        //console.log(`Updating component ${JSON.stringify(assemblyComponent, null, 2)}`);

                        if (baseline.current.length === 0) {
                            createBaseline();
                        }

                        modifyComponent(assemblyComponent);
                    }

                    const labelX = () => {
                        let x: number;
                        switch (rect.id) {
                            case "rect1":
                                x = rect.x + rect.width - 10;
                                break;
                            case "rect2":
                                x = rect.x + 10;
                                break;
                            case "rect3":
                                x = rect.x + 10;
                                break;
                            case "rect4":
                                x = rect.x + rect.width - 10;
                                break;
                        }
                        return x;
                    }

                    const labelY = () => {
                        let y: number;
                        switch (rect.id) {
                            case "rect1":
                                y = rect.y - 10;
                                break;
                            case "rect2":
                                y = rect.y + rect.height + 10;
                                break;
                            case "rect3":
                                y = rect.y - 10;
                                break;
                            case "rect4":
                                y = rect.y + rect.height + 10;
                                break;
                        }
                        return y;
                    }

                    const tagPointer = () => {
                        let pointer: string;
                        switch (rect.id) {
                            case "rect1":
                                pointer = "down";
                                break;
                            case "rect2":
                                pointer = "up";
                                break;
                            case "rect3":
                                pointer = "down";
                                break;
                            case "rect4":
                                pointer = "up";
                                break;
                        }
                        return pointer;
                    }


                    let decoration = remoteChanges.has(rect.id) ? { stroke: "blue", strokeWidth: 4 } : {};

                    if (remoteChanges.has(rect.id) && localChanges.has(rect.id) && !_.isEqual(localChanges.get(rect.id), remoteChanges.get(rect.id))) {
                        decoration.stroke = "red";
                    }

                    const decorated = Object.assign(decoration, rect);


                    return (
                        <Group>
                            <Rectangle
                                rectRef={node => shape = node}
                                key={"Rectangle_".concat(rect.id)}
                                value={decorated}
                                onDragStart={() => { }}
                                onDragEnd={resizeAndUpdate}
                                draggable={true}
                                onMouseEnter={e => {
                                    const container = e.target.getStage().container();
                                    container.style.cursor = "move";
                                }}
                                onMouseLeave={e => {
                                    const container = e.target.getStage().container();
                                    container.style.cursor = "default";
                                }}
                                onClick={showAnnotationDialog}
                            />
                            <Label
                                visible={visible.annotations && rect.annotation.length > 0}
                                key={"Label_".concat(rect.id)}
                                x={labelX()}
                                y={labelY()}
                                opacity={0.7}
                            >
                                <Tag
                                    key={"Label_Tag_".concat(rect.id)}
                                    fill={rect.fill}
                                    pointerDirection={tagPointer()}
                                    pointerWidth={15}
                                    pointerHeight={20}
                                    lineJoin="round"
                                    shadowColor='black'
                                    shadowBlur={10}
                                    shadowOffsetX={10}
                                    shadowOffsetY={10}
                                    shadowOpacity={0.5}
                                    cornerRadius={10}

                                />
                                <Text
                                    key={"Label_Text_".concat(rect.id)}
                                    text={rect.annotation}
                                    fontFamily="Calibri"
                                    fontSize={18}
                                    padding={10}
                                    fill="black"
                                />
                            </Label>
                        </Group>
                    );
                })}
            </Layer>

            <Layer visible={visible.remote} opacity={0.2}>

                {remoteComponents.map((rect, i) => {
                    return (
                        <Rectangle
                            rectRef={node => { }}
                            key={rect.id}
                            value={rect}
                            onDragStart={() => { }}
                            onDragEnd={() => { }}
                            draggable={false}
                        />
                    );
                })}
            </Layer>

            <Layer visible={visible.localChanges} opacity={0.2}>

                {assembly(localChanges).map((rect, i) => {
                    return (
                        <Rectangle
                            rectRef={node => { }}
                            key={rect.id}
                            value={rect}
                            onDragStart={() => { }}
                            onDragEnd={() => { }}
                            draggable={false}
                        />
                    );
                })}
            </Layer>

            <Layer visible={visible.remoteChanges} opacity={0.2}>

                {assembly(remoteChanges).map((rect, i) => {
                    return (
                        <Rectangle
                            rectRef={node => { }}
                            key={rect.id}
                            value={rect}
                            onDragStart={() => { }}
                            onDragEnd={() => { }}
                            draggable={false}
                        />
                    );
                })}
            </Layer>

            <Layer visible={visible.merge} opacity={1}>

                {mergeComponents.map((conflict, i) => {

                    let shapeLocal;
                    let shapeRemote;

                    const localDecoration = { stroke: "red", strokeWidth: 4, opacity: 0.7 };
                    const remoteDecoration = { stroke: "blue", strokeWidth: 4, opacity: 0.7 };

                    const localDecorated = Object.assign(localDecoration, conflict.local);
                    const remoteDecorated = Object.assign(remoteDecoration, conflict.remote);

                    const mergeSelected = () => {
                        console.log(`Merge selected invoked in ${conflict.remote.id}`);
                        mergeSelectedRemoteComponent(conflict.remote.id);
                    }

                    return (
                        <Group>
                            <Rectangle
                                rectRef={node => shapeLocal = node}
                                key={"local_".concat(conflict.local.id)}
                                value={localDecorated}
                                onDragStart={() => { }}
                                onDragEnd={() => { }}
                                draggable={false}
                            />
                            <Text
                                text="Local"
                                key={"local_text_".concat(conflict.local.id)}
                                x={conflict.local.x + conflict.local.width / 4}
                                y={conflict.local.y + conflict.local.height / 4}
                                fontSize={24}
                                fill="red"
                            />
                            <Rectangle
                                rectRef={node => shapeRemote = node}
                                key={"remote_".concat(conflict.remote.id)}
                                value={remoteDecorated}
                                onDragStart={() => { }}
                                onDragEnd={() => { }}
                                draggable={false}
                                onMouseEnter={e => {
                                    const container = e.target.getStage().container();
                                    container.style.cursor = "pointer";
                                }}
                                onMouseLeave={e => {
                                    const container = e.target.getStage().container();
                                    container.style.cursor = "default";
                                }}
                                onClick={mergeSelected}
                            />
                            <Text
                                text="Remote"
                                key={"remote_text_".concat(conflict.remote.id)}
                                x={conflict.remote.x + conflict.remote.width / 4}
                                y={conflict.remote.y + conflict.remote.height / 4}
                                fontSize={24}
                                fill="blue"
                            />
                        </Group>
                    );
                })}
            </Layer>

            <Layer>
                <Html>
                    <div>
                        <Button sx={{ m: 2 }} variant="contained" size="large" color="primary" onClick={commitWorkspace}>
                            Commit
                        </Button>
                    </div>
                    <FormControl component="fieldset" variant="standard">
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.local} name="local" onChange={handleVisibility} />
                                }
                                label="Local State"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.localChanges} name="localChanges" onChange={handleVisibility} />
                                }
                                label="Local Changes"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.annotations} name="annotations" onChange={handleVisibility} />
                                }
                                label="Annotations"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.merge} name="merge" onChange={handleVisibility} />
                                }
                                label="Merge SDC"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.remote} name="remote" onChange={handleVisibility} />
                                }
                                label="SDC State"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.remoteChanges} name="remoteChanges" onChange={handleVisibility} />
                                }
                                label="SDC Changes"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={visible.dataTable} name="dataTable" onChange={handleVisibility} />
                                }
                                label="Data Grid"
                            />
                        </FormGroup>
                    </FormControl>
                </Html>
            </Layer>

            <Layer visible={visible.dataTable} x={1000} y={100} width={600} height={400} >
                <Html
                    divProps={{
                        style: {
                            position: 'absolute',
                            top: "0px",
                            left: "0px",
                            height: "320px",
                            width: "310px",
                        },
                    }}
                >
                    <DataGrid
                        rows={getTableRows("rect1")}
                        columns={getTableColumns("rect1")}
                        pageSize={4}
                        rowsPerPageOptions={[4]}
                        sx={{
                            bgcolor: '#eeff41',
                            boxShadow: 4,
                            display: getTableVisibility("rect1")
                        }}
                        getRowClassName={(params) => `row-${getRowClass(params.row.diff)}`}
                    />
                </Html>
                <Html
                    divProps={{
                        style: {
                            position: 'absolute',
                            top: "0px",
                            left: "330px",
                            height: "320px",
                            width: "310px",
                        },
                    }}
                >
                    <DataGrid
                        rows={getTableRows("rect2")}
                        columns={getTableColumns("rect2")}
                        pageSize={4}
                        rowsPerPageOptions={[4]}
                        sx={{
                            bgcolor: '#ffab40',
                            boxShadow: 4,
                            display: getTableVisibility("rect2")
                        }}
                        getRowClassName={(params) => `row-${getRowClass(params.row.diff)}`}
                    />
                </Html>
                <Html
                    divProps={{
                        style: {
                            position: 'absolute',
                            top: "340px",
                            left: "0px",
                            height: "320px",
                            width: "310px",
                        },
                    }}
                >
                    <DataGrid
                        rows={getTableRows("rect3")}
                        columns={getTableColumns("rect3")}
                        pageSize={4}
                        rowsPerPageOptions={[4]}
                        sx={{
                            bgcolor: '#4285f4',
                            boxShadow: 4,
                            display: getTableVisibility("rect3")
                        }}
                        getRowClassName={(params) => `row-${getRowClass(params.row.diff)}`}
                    />
                </Html>
                <Html
                    divProps={{
                        style: {
                            position: 'absolute',
                            top: "340px",
                            left: "330px",
                            height: "320px",
                            width: "310px",
                        },
                    }}
                >
                    <DataGrid
                        rows={getTableRows("rect4")}
                        columns={getTableColumns("rect4")}
                        pageSize={4}
                        rowsPerPageOptions={[4]}
                        sx={{
                            bgcolor: '#0097a7',
                            boxShadow: 4,
                            display: getTableVisibility("rect4")
                        }}
                        getRowClassName={(params) => `row-${getRowClass(params.row.diff)}`}
                    />
                </Html>
                <Html>
                    <Dialog open={annoOpen} onClose={handleAnnoDialogClose}>
                        <DialogTitle style={{ color: "#1976d2" }}>Annotate Component</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="text"
                                type="text"
                                fullWidth
                                variant="standard"
                                multiline={true}
                                rows={4}
                                value={annoText}
                                onChange={e => setAnnoText(e.target.value)}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleAnnoDialogClose}>Cancel</Button>
                            <Button onClick={handleAnnoDialogSubmit}>Submit</Button>
                        </DialogActions>
                    </Dialog>
                </Html>
            </Layer>

            {/* <Layer>
                <Text
                    text={JSON.stringify(localComponents, null, 2)}
                    x={1000}
                    y={100}
                    padding={20}
                    fontSize={18}
                />
            </Layer>

            <Layer>
                <Text
                    text={JSON.stringify(remoteComponents, null, 2)}
                    x={1200}
                    y={100}
                    padding={20}
                    fontSize={18}
                /> 
            </Layer>  */}

        </Stage >
    );
};


function randomInRange(min, max) {
    const random = (Math.random() * (max - min)) + min;
    console.log(`Random in range generated ${random}`);
    return random;
}