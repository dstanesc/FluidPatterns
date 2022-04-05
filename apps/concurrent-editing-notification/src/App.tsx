import React, { useEffect, useRef, useState } from 'react';

import { Stage, Layer, Rect, Transformer, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import './App.css';

import { DataBinder } from "@fluid-experimental/property-binder";

import { copy as deepClone } from "fastest-json-copy";

import {
    registerSchema,
    createSimpleWorkspace,
    SimpleWorkspace,
    ReadyLogger
} from "./workspace";

import { assemblyComponentSchema } from "./assemblyComponent-1.0.0";

import { assemblySchema } from "./assembly-1.0.0";

import {
    configureAssemblyBinding,
    initPropertyTree,
    retrieveAssemblyMapProperty,
    updateAssemblyComponentProperty
} from './assemblyApi';

import { AssemblyComponent } from './assemblyListener';
import { assembly, index, isModified } from './assemblyDiff';
import _ from "lodash"


function Rectangle(props: any) {

    return (
        <Rect
            ref={props.rectRef}
            {...props.value}
            draggable={props.draggable}
            onDragStart={props.onDragStart}
            onDragEnd={props.onDragEnd}
        />
    );
}


export default function App() {

    const containerId = window.location.hash.substring(1) || undefined;

    const workspace = useRef<SimpleWorkspace>(null);

    const [localComponents, setLocalComponents] = useState<AssemblyComponent[]>([]);

    const [remoteComponents, setRemoteComponents] = useState<AssemblyComponent[]>([]);

    const baseline = useRef<AssemblyComponent[]>([]);

    const [localChanges, setLocalChanges] = useState<Map<string, AssemblyComponent>>(new Map());

    const [remoteChanges, setRemoteChanges] = useState<Map<string, AssemblyComponent>>(new Map());

    const [visible, setVisible] = useState(() => ["local"]);

    useEffect(() => {
        initLocalAssemblyWorkspace()
            .then((localWorkspace) => initRemoteAssemblyWorkspace(localWorkspace));
        //.then((remoteWorkspace) => createBaseline());
    }, []); // [] to be executed only once


    useEffect(() => {
        if (baseline.current.length > 0)
            setLocalChanges(index(isModified(localComponents, baseline.current)));
    }, [localComponents]);

    useEffect(() => {
        if (baseline.current.length > 0)
            setRemoteChanges(index(isModified(remoteComponents, baseline.current)));
    }, [remoteComponents]);


    async function initLocalAssemblyWorkspace(): Promise<SimpleWorkspace> {

        // Register the templates used to instantiate properties.
        registerSchema(assemblyComponentSchema);
        registerSchema(assemblySchema);

        // Initialize the workspace
        const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(containerId);

        const myDataBinder: DataBinder = simpleWorkspace.dataBinder;

        // Configure binding
        configureAssemblyBinding(myDataBinder, simpleWorkspace, "local", setLocalComponents);

        //Initialize the property tree
        initPropertyTree(containerId === undefined, simpleWorkspace, setLocalComponents);

        // Make workspace available
        workspace.current = simpleWorkspace;

        // Everything good, update browser location with container identifier
        window.location.hash = simpleWorkspace.containerId;

        return simpleWorkspace;
    }

    async function initRemoteAssemblyWorkspace(localWorkspace: SimpleWorkspace): Promise<SimpleWorkspace> {

        // Initialize the workspace
        const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(localWorkspace.containerId);

        initPropertyTree(false, simpleWorkspace, setRemoteComponents);

        // Configure binding
        configureAssemblyBinding(simpleWorkspace.dataBinder, simpleWorkspace, "remote", setRemoteComponents);

        return simpleWorkspace;
    }

    async function createBaseline() {

        baseline.current = [...localComponents];
    }

    const commitWorkspace = () => {

        workspace.current.commit();

        createBaseline();
    }

    const mergeWorkspace = () => {

       setVisible(["localChanges", "remoteChanges"]);
    }

    const modifyComponent = (assemblyComponent: AssemblyComponent) => {

        const assemblyMapProperty = retrieveAssemblyMapProperty(workspace.current);

        updateAssemblyComponentProperty(assemblyMapProperty, assemblyComponent);
    }

    const handleVisibility = (
        event: React.MouseEvent<HTMLElement>,
        newFormats: string[],
    ) => {
        setVisible(newFormats);
    };

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
        >
            <Layer visible={visible.includes("local")}>

                {localComponents.map((rect, i) => {

                    let shape;

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
                        };

                        console.log(`Updating component ${JSON.stringify(assemblyComponent, null, 2)}`);

                        if (baseline.current.length === 0) {
                            createBaseline();
                        }

                        modifyComponent(assemblyComponent);
                    }

                    let decoration = remoteChanges.has(rect.id) ? { stroke: "blue", strokeWidth: 4 } : {};

                    if (remoteChanges.has(rect.id) && localChanges.has(rect.id) && !_.isEqual(localChanges.get(rect.id), remoteChanges.get(rect.id))) {
                        decoration.stroke = "red";
                    }

                    const decorated = Object.assign(decoration, rect);

                    return (
                        <Rectangle
                            rectRef={node => shape = node}
                            key={rect.id}
                            value={decorated}
                            onDragStart={() => { }}
                            onDragEnd={resizeAndUpdate}
                            draggable={true}

                        />
                    );
                })}
            </Layer>

            <Layer visible={visible.includes("remote")} opacity={0.2}>

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

            <Layer visible={visible.includes("localChanges")} opacity={0.2}>

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

            <Layer visible={visible.includes("remoteChanges")} opacity={0.2}>

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

            <Layer>
                <Html>
                    <ToggleButtonGroup
                        value={visible}
                        onChange={handleVisibility}
                        aria-label="layer visibility"
                    >
                        <ToggleButton sx={{ m: 1 }} size="large" color="success" value="local" aria-label="local">
                            LOCAL
                        </ToggleButton>
                        <ToggleButton sx={{ m: 1 }} size="large" color="success" value="remote" aria-label="remote">
                            REMOTE
                        </ToggleButton>
                        <ToggleButton sx={{ m: 1 }} size="large" color="success" value="localChanges" aria-label="localChanges">
                            LOCAL CHANGES
                        </ToggleButton>
                        <ToggleButton sx={{ m: 1 }} size="large" color="success" value="remoteChanges" aria-label="remoteChanges">
                            REMOTE CHANGES
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Button sx={{ m: 2 }} variant="outlined" size="large" color="success" onClick={commitWorkspace}>
                        COMMIT
                    </Button>
                    <Button sx={{ m: 2 }} variant="outlined" size="large" color="success" onClick={mergeWorkspace}>
                        MERGE
                    </Button>
                    <Button sx={{ m: 2 }} variant="outlined" size="large" color="success" onClick={createBaseline}>
                        BASELINE
                    </Button>
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
            </Layer> */}

        </Stage>
    );
};


function randomInRange(min, max) {
    const random = (Math.random() * (max - min)) + min;
    console.log(`Random in range generated ${random}`);
    return random;
}