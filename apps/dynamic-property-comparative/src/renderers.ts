import { Call } from "./diceController";

export type StatRenderer = {

    (call: Call): void;
}

export type PropCountRenderer = {
    
    (count: number): void;
}