import _ from "lodash"
import { AssemblyComponent } from "./assemblyApi"


export interface Compare {
  id: string;
  field: string;
  local: number;
  remote: number;
  diff: number;
}

export interface Conflict {
  id: string;
  local: AssemblyComponent;
  remote: AssemblyComponent;
};

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

export function conflicts(localChanges: Map<string, AssemblyComponent>, remoteChanges: Map<string, AssemblyComponent>): Conflict[] {
  const conflictChanges: Conflict[] = [];
  const localKeys = Array.from(localChanges.keys());
  localKeys.filter(k => remoteChanges.has(k)).forEach(k => {
    const local = localChanges.get(k);
    const remote = remoteChanges.get(k);
    if (!_.isEqual(local, remote)) {
      conflictChanges.push({ "id": k, "local": local, "remote": remote });
    }
  });
  return conflictChanges;
}

export function compareTable(localAssembly: AssemblyComponent[], remoteAssembly: AssemblyComponent[]): Map<string, Compare[]> {
  const out: Map<string, Compare[]> = new Map();
  const remoteAssemblyIndex: Map<string, AssemblyComponent> = index(remoteAssembly);
  localAssembly.forEach(assembly => {
    const remoteAssembly = remoteAssemblyIndex.get(assembly.id);
    if (remoteAssembly) {
      const xCompare: Compare = { "id": `${assembly.id}_x`, "field": "x", "local": assembly.x, "remote": remoteAssembly.x, "diff": assembly.x - remoteAssembly.x };
      const yCompare: Compare = { "id": `${assembly.id}_y`, "field": "y", "local": assembly.y, "remote": remoteAssembly.y, "diff": assembly.y - remoteAssembly.y };
      const widthCompare: Compare = { "id": `${assembly.id}_width`, "field": "width", "local": assembly.width, "remote": remoteAssembly.width, "diff": assembly.width - remoteAssembly.width };
      const heightCompare: Compare = { "id": `${assembly.id}_height`, "field": "height", "local": assembly.height, "remote": remoteAssembly.height, "diff": assembly.height - remoteAssembly.height };
      const fieldCompares: Compare[] = [xCompare, yCompare, widthCompare, heightCompare];
      out.set(assembly.id, fieldCompares);
    }
  });
  return out;
}