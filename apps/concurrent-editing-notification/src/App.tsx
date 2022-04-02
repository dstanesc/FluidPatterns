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

import './App.css';

import { DataBinder } from "@fluid-experimental/property-binder";

import { IPropertyTreeMessage, IRemotePropertyTreeMessage, SharedPropertyTree } from "@fluid-experimental/property-dds";

import { copy as deepClone } from "fastest-json-copy";

import {
    Workspace,
    BoundWorkspace,
    initializeBoundWorkspace,
    registerSchema
} from "@dstanesc/fluid-util";

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
            draggable
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

    const [loadDisabled, setLoadDisabled] = useState(false)

    const workspace = useRef<Workspace>(null);

    const [components, setComponents] = useState<AssemblyComponent[]>([]);

    useEffect(() => {
        initAssemblyWorkspace();
    }, []); // [] to be executed only once

    async function initAssemblyWorkspace() {

        // Register the templates used to instantiate properties.
        registerSchema(assemblyComponentSchema);
        registerSchema(assemblySchema);

        // Initialize the workspace
        const boundWorkspace: BoundWorkspace = await initializeBoundWorkspace(containerId);

        const myWorkspace: Workspace = boundWorkspace.workspace;

        const myDataBinder: DataBinder = boundWorkspace.dataBinder;

        // Configure binding
        configureAssemblyBinding(myDataBinder, myWorkspace, setComponents);

        //Initialize the property tree
        initPropertyTree(containerId, myWorkspace, setComponents);

        // Make workspace available
        workspace.current = myWorkspace;

        // Everything good, update browser location with container identifier
        window.location.hash = myWorkspace.containerId;
    }


    const loadAssembly = () => {
        const assemblyMapProperty: MapProperty = retrieveAssemblyMapProperty(workspace.current);
        initialData.forEach(assemblyComponent => {
            const componentProperty: NamedProperty = createComponentProperty(assemblyComponent);
            assemblyMapProperty.insert(assemblyComponent.id, componentProperty);
        });
        workspace.current.commit();
        setLoadDisabled(true);
    }

    const modifyComponent = (assemblyComponent: AssemblyComponent) => {

        const assemblyMapProperty = retrieveAssemblyMapProperty(workspace.current);

        updateAssemblyComponentProperty(assemblyMapProperty, assemblyComponent);

        workspace.current.commit();
    }

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
        >
            <Layer>
                {components.map((rect, i) => {

                    let nodeRef;

                    const changeSize = () => {

                        const sx = Math.random() + 0.4;
                        const sy = Math.random() + 0.4;

                        // nodeRef.to({
                        //     scaleX: sx,
                        //     scaleY: sy,
                        //     width: Math.max(100, nodeRef.width() * sx),
                        //     height: Math.max(100, nodeRef.height() * sy),
                        //     duration: 0.2
                        // });
                    }

                    const changeSizeAndUpdate = () => {

                        changeSize();

                        sleep(2000);

                        const assemblyComponent: AssemblyComponent = {
                            "id": rect.id,
                            "fill": rect.fill,
                            "x": parseInt(nodeRef.x()),
                            "y": parseInt(nodeRef.y()),
                            "width": parseInt(nodeRef.width()),
                            "height": parseInt(nodeRef.height())
                        };

                        console.log(`Updating component ${JSON.stringify(assemblyComponent, null, 2)}`);

                        modifyComponent(assemblyComponent);
                    }

                    return (
                        <Rectangle
                            rectRef={el => nodeRef = el}
                            key={rect.id}
                            value={rect}
                            onDragStart={changeSize}
                            onDragEnd={changeSizeAndUpdate}
                        />
                    );
                })}
            </Layer>

            <Layer>
                <Html>
                    <Button disabled={loadDisabled} className="load" variant="contained" size="large" color="success" onClick={loadAssembly}>
                        Load Assembly
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

        </Stage>
    );
};

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
