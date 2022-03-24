import { PropCountRenderer, StatRenderer } from "./renderers";

import { copy as deepClone } from "fastest-json-copy";


export const DEFAULT_CALL = {  rollIndex: 0, publishedAt: 0, latency: 0, count: 0, history: "" };

export interface Operation {

    rollIndex: number;

    publishedAt: number;

    latency: number;

    count: number;

    history: string;
}

export class DiceBindingController {

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

    public insertValue(key: string, rollIndex: number, publishedAt: number, receivedAt: number) {
        console.log(`Dice insertValue key ${key}, rollIndex ${rollIndex}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        this.propCountRenderer(parseInt(key) + 1);
    }

    public updateValue(key: string, rollIndex: number, publishedAt: number, receivedAt: number) {
        console.log(`Dice updateValue key ${key}, rollIndex ${rollIndex}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        if (publishedAt > 0) {
            let call: Operation = this.monitoredOperations.get(key);
            if (call) {
                if (call.rollIndex < rollIndex) {
                    call.rollIndex = rollIndex;
                    call.publishedAt = publishedAt;
                } else if (call.rollIndex === rollIndex){
                    call.latency = receivedAt - call.publishedAt;
                    call.count += 1
                    call.history += `${call.latency}, `;
                    this.statRenderer(deepClone(call));
                }
                this.monitoredOperations.set(key, call);
            }
        }
    }
}



export class DiceAdapterController {

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

    public insertValue(key: string, rollIndex: number, publishedAt: number, receivedAt: number) {
        console.log(`Dice insertValue key ${key}, rollIndex ${rollIndex}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        this.propCountRenderer(parseInt(key) + 1);
    }

    public updateValue(key: string, rollIndex: number, publishedAt: number, receivedAt: number) {
        console.log(`Dice updateValue key ${key}, rollIndex ${rollIndex}, publishedAt ${publishedAt}, receivedAt ${receivedAt}`);
        if (publishedAt > 0) {
            let call: Operation = this.monitoredOperations.get(key);
            if (call && rollIndex) {
                    call.rollIndex = rollIndex;
                    call.publishedAt = publishedAt;
                    call.latency = receivedAt - call.publishedAt;
                    call.count += 1
                    call.history += `${call.latency}, `;
                    this.statRenderer(deepClone(call));
                
                this.monitoredOperations.set(key, call);
            }
        }
    }
}


