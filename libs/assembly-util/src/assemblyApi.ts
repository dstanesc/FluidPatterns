
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty, MapProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { AssemblyController } from "./assemblyController";
import { AssemblyListener } from "./assemblyListener";
import { AssemblyBinding } from "./assemblyBinding";
import { copy as deepCopy } from "fastest-json-copy";
import { SimpleWorkspace } from "@dstanesc/fluid-util2";

// Palette
// #eeff41 (yellow green)
// #0097a7 (green)
// #ffab40 (orange)
// #78909c (gray)
// #212121 (dark gray)
// #4285f4 (blue)
// #eeeeee (light gray)
// #595959 (darker gray)
// white
// black

export const initialData = [
    {
        "x": 409,
        "y": 129,
        "width": 100,
        "height": 100,
        "fill": "#eeff41",
        "id": "rect1",
        "annotation": ""
    },
    {
        "x": 278,
        "y": 340,
        "width": 112,
        "height": 100,
        "fill": "#ffab40",
        "id": "rect2",
        "annotation": ""
    },
    {
        "x": 194,
        "y": 123,
        "width": 200,
        "height": 200,
        "fill": "#4285f4",
        "id": "rect3",
        "annotation": ""
    },
    {
        "x": 410,
        "y": 246,
        "width": 254,
        "height": 251,
        "fill": "#0097a7",
        "id": "rect4",
        "annotation": ""
    }
];


export interface AssemblyComponent {

    id: string;

    fill: string;

    x: number;

    y: number;

    width: number;

    height: number;

    annotation: string;
}


export function enrich(toEnrich: AssemblyComponent): AssemblyComponent {
    const assemblyComponent = deepCopy(toEnrich);
    assemblyComponent["shadowBlur"] = 20;
    assemblyComponent["cornerRadius"] = 10;
    return assemblyComponent;
}

export function createAssemblyProperty(): MapProperty {
    const assemblyProperty: MapProperty = PropertyFactory.create<MapProperty>("hex:assembly-1.0.0");
    return assemblyProperty;
}

export function createComponentProperty(component: AssemblyComponent): NamedProperty {
    const operationProperty = PropertyFactory.create<NamedProperty>("hex:assemblyComponent-1.0.0", undefined, component);
    return operationProperty;
}

export function retrieveAssemblyMapProperty(workspace: SimpleWorkspace): MapProperty {
    const assemblyMapProperty: MapProperty = workspace.rootProperty.resolvePath("assembly.components")! as MapProperty
    return assemblyMapProperty;
}

export function updateAssemblyComponentProperty(assemblyMapProperty: MapProperty, assemblyComponent: AssemblyComponent) {

    const nestedProperty = assemblyMapProperty.get(assemblyComponent.id) as NamedProperty;
    
    const xProperty: Int32Property = nestedProperty.get("x") as Int32Property;
    const yProperty: Int32Property = nestedProperty.get("y") as Int32Property;
    const widthProperty: Int32Property = nestedProperty.get("width") as Int32Property;
    const heightProperty: Int32Property = nestedProperty.get("height") as Int32Property;
    const annoProperty: StringProperty = nestedProperty.get("annotation") as StringProperty;

    xProperty.setValue(assemblyComponent.x);
    yProperty.setValue(assemblyComponent.y);
    widthProperty.setValue(assemblyComponent.width);
    heightProperty.setValue(assemblyComponent.height);
    annoProperty.setValue(assemblyComponent.annotation);
}

export function initPropertyTree(init: boolean, workspace: SimpleWorkspace, assemblyListener: AssemblyListener) {
    if (init) {
        const assemblyProperty: MapProperty = createAssemblyProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert("assembly", assemblyProperty);
        workspace.commit();
        const mapProperty: MapProperty = assemblyProperty.get("components") as MapProperty;
        initialData.forEach(assemblyComponent => {
            const componentProperty: NamedProperty = createComponentProperty(assemblyComponent);
            mapProperty.insert(assemblyComponent.id, componentProperty);
        });
        workspace.commit();
    } else {
        const mapProperty: MapProperty = retrieveAssemblyMapProperty(workspace);
        mapProperty.getIds().forEach(key => {
            const assemblyComponentProperty = mapProperty.get(key) as NamedProperty;
            const idProperty: StringProperty = assemblyComponentProperty.get("id") as StringProperty;
            const fillProperty: StringProperty = assemblyComponentProperty.get("fill") as StringProperty;
            const xProperty: Int32Property = assemblyComponentProperty.get("x") as Int32Property;
            const yProperty: Int32Property = assemblyComponentProperty.get("y") as Int32Property;
            const widthProperty: Int32Property = assemblyComponentProperty.get("width") as Int32Property;
            const heightProperty: Int32Property = assemblyComponentProperty.get("height") as Int32Property;
            const annotationProperty: StringProperty = assemblyComponentProperty.get("annotation") as StringProperty;

            const assemblyComponent: AssemblyComponent = {
                "id": idProperty.getValue(),
                "fill": fillProperty.getValue(),
                "x": xProperty.getValue(),
                "y": yProperty.getValue(),
                "width": widthProperty.getValue(),
                "height": heightProperty.getValue(),
                "annotation": annotationProperty.getValue()
            };
            assemblyListener( assembly => [...assembly, enrich(assemblyComponent)]);
        });
    }
}

export function configureAssemblyBinding(dataBinder: DataBinder, workspace: SimpleWorkspace, view: string, assemblyListener: AssemblyListener) {
    dataBinder.defineRepresentation(view, "hex:assembly-1.0.0", (property) => {
        return new AssemblyController(assemblyListener);
    });
    dataBinder.defineDataBinding(view, "hex:assembly-1.0.0", AssemblyBinding);
    dataBinder.activateDataBinding(view);
}