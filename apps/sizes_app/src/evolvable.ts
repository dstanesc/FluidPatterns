/* eslint-disable space-before-blocks */

/* eslint-disable padded-blocks */
/* eslint-disable no-multiple-empty-lines */

import { EvolvableRenderer } from "./evolvableRenderer";
import { cloneMap } from "./propUtil";

export class Evolvable {

    private readonly myMap = new Map<string, any>();
    private readonly myTypeId: string;

    evolvableRenderer: EvolvableRenderer;

    constructor(typeId: string, evolvableRenderer: EvolvableRenderer){
        this.evolvableRenderer = evolvableRenderer;
        this.myTypeId = typeId;
        this.myMap.set("typeId", this.myTypeId);
    }

    public updateA(numA: number){
        this.myMap.set("numA", numA);
        this.render();
    }

    public updateB(strB: string){
        this.myMap.set("strB", strB);
        this.render();
    }

    public updateC(strC: string){
        this.myMap.set("strC", strC);
        this.render();
    }


    public updateD(strD: string){
        this.myMap.set("strD", strD);
        this.render();
    }

    public updateE(strE: string){
        this.myMap.set("strE", strE);
        this.render();
    }

    public updateF(strF: string){
        this.myMap.set("strF", strF);
        this.render();
    }

    public updateG(strG: string){
        this.myMap.set("strG", strG);
        this.render();
    }

    private render() {
        this.evolvableRenderer(cloneMap(this.myMap));
    }

}
