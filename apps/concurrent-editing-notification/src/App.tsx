import React, { useEffect, useRef, useState } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Rect, Transformer, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import './App.css';

import { DataBinder } from "@fluid-experimental/property-binder";

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { copy as deepClone } from "fastest-json-copy";

import {
    Workspace,
    BoundWorkspace,
    initializeBoundWorkspace,
    registerSchema,
    createSimpleWorkspace,
    SimpleWorkspace
} from "./workspace";

import { assemblyComponentSchema } from "./assemblyComponent-1.0.0";

import { assemblySchema } from "./assembly-1.0.0";

import {
    configureAssemblyBinding,
    createComponentProperty,
    initPropertyTree,
    retrieveAssemblyMapProperty,
    updateAssemblyComponentProperty
} from './assemblyApi';

import { AssemblyComponent } from './assemblyListener';

import { MapProperty, NamedProperty } from '@fluid-experimental/property-properties';

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


const initialData = [
    {
        "x": 409,
        "y": 129,
        "width": 100,
        "height": 100,
        "fill": "red",
        "id": "rect1"
    },
    {
        "x": 278,
        "y": 340,
        "width": 112,
        "height": 100,
        "fill": "red",
        "id": "rect2"
    },
    {
        "x": 194,
        "y": 123,
        "width": 200,
        "height": 200,
        "fill": "green",
        "id": "rect3"
    },
    {
        "x": 410,
        "y": 246,
        "width": 254,
        "height": 251,
        "fill": "yellow",
        "id": "rect4"
    }
];


export default function App() {

    const containerId = window.location.hash.substring(1) || undefined;

    const workspace = useRef<SimpleWorkspace>(null);

    const [components, setComponents] = useState<AssemblyComponent[]>([]);

    const [remoteComponents, setRemoteComponents] = useState<AssemblyComponent[]>([]);

    const [assemblyLocalVisible, setAssemblyLocalVisible] = useState(true);

    const [assemblyRemoteVisible, setAssemblyRemoteVisible] = useState(false);

    const [visible, setVisible] = useState(() => ["local"]);

    useEffect(() => {
        initLocalAssemblyWorkspace()
            .then(() => { if (!containerId) loadAssembly() })
            .then(() => initRemoteAssemblyWorkspace());
    }, []); // [] to be executed only once

    async function initLocalAssemblyWorkspace() {

        // Register the templates used to instantiate properties.
        registerSchema(assemblyComponentSchema);
        registerSchema(assemblySchema);

        // Initialize the workspace
        const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(containerId);

        const myDataBinder: DataBinder = simpleWorkspace.dataBinder;

        // Configure binding
        configureAssemblyBinding(myDataBinder, simpleWorkspace, "local", setComponents);

        //Initialize the property tree
        initPropertyTree(containerId, simpleWorkspace, setComponents);

        // Make workspace available
        workspace.current = simpleWorkspace;

        // Everything good, update browser location with container identifier
        window.location.hash = simpleWorkspace.containerId;
    }

    const loadAssembly = async () => {
        const assemblyMapProperty: MapProperty = retrieveAssemblyMapProperty(workspace.current);
        initialData.forEach(assemblyComponent => {
            const componentProperty: NamedProperty = createComponentProperty(assemblyComponent);
            assemblyMapProperty.insert(assemblyComponent.id, componentProperty);
        });
        workspace.current.commit();
    }


    async function initRemoteAssemblyWorkspace() {

        // Initialize the workspace
        const simpleWorkspace: SimpleWorkspace = await createSimpleWorkspace(workspace.current.containerId);

        // Configure binding
        configureAssemblyBinding(simpleWorkspace.dataBinder, simpleWorkspace, "remote", setRemoteComponents);

        //Initialize the property tree
        initPropertyTree(containerId, simpleWorkspace, setRemoteComponents);
    }


    const commitWorkspace = () => {

        workspace.current.commit();
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

                {components.map((rect, i) => {

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

                        modifyComponent(assemblyComponent);
                    }

                    return (
                        <Rectangle
                            rectRef={node => shape = node}
                            key={rect.id}
                            value={rect}
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

            <Layer>
                <Html>
                    <ToggleButtonGroup
                        value={visible}
                        onChange={handleVisibility}
                        aria-label="layer visibility"
                    >
                        <ToggleButton sx={{m: 2}} size="medium" color="success" value="local" aria-label="local">
                            LOCAL
                        </ToggleButton>
                        <ToggleButton sx={{m: 2}} size="medium" color="success" value="remote" aria-label="remote">
                            REMOTE
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Button sx={{m: 2}} variant="outlined" size="large" color="success" onClick={commitWorkspace}>
                        COMMIT
                    </Button>
                </Html>
            </Layer>

            <Layer>
                <Text
                    text={JSON.stringify(components, null, 2)}
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
            </Layer>

        </Stage>
    );
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInRange(min, max) {
    const random = (Math.random() * (max - min)) + min;
    console.log(`Random in range generated ${random}`);
    return random;
}