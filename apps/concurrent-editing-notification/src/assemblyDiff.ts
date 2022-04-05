import _ from "lodash"
import { AssemblyComponent } from "./assemblyListener";

export function isModified(current: AssemblyComponent[], other: AssemblyComponent[]): AssemblyComponent[] {
  const otherIndex: Map<string, AssemblyComponent> = index(other);
  return current.filter((currentComponent) => {
    const otherComponent: AssemblyComponent = otherIndex.get(currentComponent.id);
    return !_.isEqual(currentComponent, otherComponent)
  });
}

export function index(assembly: AssemblyComponent[]): Map<string, AssemblyComponent> {
  return new Map<string, AssemblyComponent>(assembly.map(component => [component.id, component]));
}

export function assembly(index: Map<string, AssemblyComponent>): AssemblyComponent[] {
  return Array.from(index.values());
}