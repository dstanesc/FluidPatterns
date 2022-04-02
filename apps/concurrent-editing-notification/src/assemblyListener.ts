import { Utils } from "@fluid-experimental/property-changeset";

export interface AssemblyComponent {

    id: string;

    fill: string;

    x: number;

    y: number;

    width: number;

    height: number;
}


export type AssemblyListener = {

    (fn: (components: AssemblyComponent[]) => AssemblyComponent[]): void;
}
