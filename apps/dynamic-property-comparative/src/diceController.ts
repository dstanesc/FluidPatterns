import { PropCountRenderer, StatRenderer } from "./renderers";

import { copy as deepClone } from "fastest-json-copy";


export const DEFAULT_CALL = { publishedAt: 0, latency: 0, count: 0, history: "" };

export interface Operation {

    publishedAt: number;

    latency: number;

    count: number;

    history: string;
}

export class DiceController {

    monitoredOperations: Map<string, Operation>;

    statRenderer: StatRenderer;

    propCountRenderer: PropCountRenderer;


    constructor(statRenderer: StatRenderer, propCountRenderer: PropCountRenderer) {
        this.statRenderer = statRenderer;
        this.propCountRenderer = propCountRenderer;
        this.monitoredOperations = new Map<string, Operation>([
            ["9", DEFAULT_CALL],
        ]);
    }

    public insertValue(key: string, publishedAt: number, receivedAt: number) {
        console.log(`Dice insertValue key ${key}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        this.propCountRenderer(parseInt(key) + 1);
    }

    public updateValue(key: string, publishedAt: number, receivedAt: number) {
        console.log(`Dice updateValue key ${key}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        if (publishedAt > 0) {
            let call: Operation = this.monitoredOperations.get(key);
            if (call) {
                call.publishedAt = publishedAt;
                call.latency = receivedAt - publishedAt;
                call.count += 1
                call.history += `${call.latency}, `;
                this.statRenderer(deepClone(call));
            }
        }
    }
}
