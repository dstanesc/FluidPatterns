import { Workspace } from "@dstanesc/fluid-util";
import { PropertyFactory, NodeProperty, Int32Property, ArrayProperty, NamedProperty, NamedNodeProperty, StringProperty, MapProperty }
    from "@fluid-experimental/property-properties";
import { DataBinder, UpgradeType } from "@fluid-experimental/property-binder";
import { AssemblyController } from "./assemblyController";
import { AssemblyComponent, AssemblyListener } from "./assemblyListener";
import { AssemblyBinding } from "./assemblyBinding";
import { copy as deepCopy } from "fastest-json-copy";

export function enrich(toEnrich: AssemblyComponent): AssemblyComponent {
    const assemblyComponent = deepCopy(toEnrich);
    assemblyComponent["shadowBlur"] = 10;
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

export function retrieveAssemblyMapProperty(workspace: Workspace): MapProperty {
    const assemblyMapProperty: MapProperty = workspace.rootProperty.resolvePath("assembly.components")! as MapProperty
    return assemblyMapProperty;
}

export function updateAssemblyComponentProperty(assemblyMapProperty: MapProperty, assemblyComponent: AssemblyComponent) {

    const nestedProperty = assemblyMapProperty.get(assemblyComponent.id) as NamedProperty;
    
    const xProperty: Int32Property = nestedProperty.get("x") as Int32Property;
    const yProperty: Int32Property = nestedProperty.get("y") as Int32Property;
    const widthProperty: Int32Property = nestedProperty.get("width") as Int32Property;
    const heightProperty: Int32Property = nestedProperty.get("height") as Int32Property;
    
    xProperty.setValue(assemblyComponent.x);
    yProperty.setValue(assemblyComponent.y);
    widthProperty.setValue(assemblyComponent.width);
    heightProperty.setValue(assemblyComponent.height);
}

export function initPropertyTree(containerId: string | undefined, workspace: Workspace, assemblyListener: AssemblyListener) {
    if (containerId === undefined) {
        const assemblyProperty: MapProperty = createAssemblyProperty();
        const rootProp: NodeProperty = workspace.rootProperty;
        rootProp.insert("assembly", assemblyProperty);
        workspace.commit();
    } else {
        const mapProperty: MapProperty = retrieveAssemblyMapProperty(workspace);
        mapProperty.getIds().forEach(key => {
            const nestedProperty = mapProperty.get(key) as NamedProperty;
            const idProperty: StringProperty = nestedProperty.get("id") as StringProperty;
            const fillProperty: StringProperty = nestedProperty.get("fill") as StringProperty;
            const xProperty: Int32Property = nestedProperty.get("x") as Int32Property;
            const yProperty: Int32Property = nestedProperty.get("y") as Int32Property;
            const widthProperty: Int32Property = nestedProperty.get("width") as Int32Property;
            const heightProperty: Int32Property = nestedProperty.get("height") as Int32Property;

            const assemblyComponent: AssemblyComponent = {
                "id": idProperty.getValue(),
                "fill": fillProperty.getValue(),
                "x": xProperty.getValue(),
                "y": yProperty.getValue(),
                "width": widthProperty.getValue(),
                "height": heightProperty.getValue()
            };

            assemblyListener( assembly => [...assembly, enrich(assemblyComponent)]);
        });
    }
}

export function configureAssemblyBinding(dataBinder: DataBinder, workspace: Workspace, assemblyListener: AssemblyListener) {
    dataBinder.defineRepresentation("view", "hex:assembly-1.0.0", (property) => {
        return new AssemblyController(assemblyListener);
    });

    dataBinder.defineDataBinding("view", "hex:assembly-1.0.0", AssemblyBinding);
    dataBinder.activateDataBinding("view");
}