import { Utils } from "@fluid-experimental/property-changeset";
import { AssemblyComponent } from "./assemblyApi";

export type AssemblyListener = {

    (fn: (components: AssemblyComponent[]) => AssemblyComponent[]): void;
}
