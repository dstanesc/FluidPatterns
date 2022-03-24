import { Operation } from "./diceController";

export type StatRenderer = {

    (call: Operation): void;
}

export type PropCountRenderer = {
    
    (count: number): void;
}