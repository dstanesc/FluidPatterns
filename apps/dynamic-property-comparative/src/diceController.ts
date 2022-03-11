import { PropCountRenderer, StatRenderer } from "./renderers";

import { copy as deepClone } from "fastest-json-copy";


export const DEFAULT_CALL = { time: 0, latency: 0, count: 0, avg: 0, history: ""};

export interface Call {

    time: number;

    latency: number;

    count: number;

    avg: number;

    history: string;
}

export class DiceController {

    monitoredCalls: Map<string, Call>;

    statRenderer: StatRenderer;

    propCountRenderer: PropCountRenderer;


    constructor(statRenderer: StatRenderer, propCountRenderer: PropCountRenderer) {
        this.statRenderer = statRenderer;
        this.propCountRenderer = propCountRenderer;
        this.monitoredCalls = new Map<string, Call>([
            ["0", DEFAULT_CALL],
        ]);
    }

    public insertValue(key: string, diceValue: number) {

        this.propCountRenderer(parseInt(key) + 1);
    }

    public updateValue(key: string, diceValue: number) {
        console.log(`Dice controller key ${key}, value ${diceValue}`);
        let call: Call = this.monitoredCalls.get(key);
        if (call) {
            const now = Date.now();
            call.count += 1
            const currentLatency = now - call.time;
            call.avg = call.latency+currentLatency/call.count;
            call.latency = currentLatency;
            call.time = now;
            call.history +=  `${currentLatency}, `;
            this.statRenderer(deepClone(call));
        }
    }
}
