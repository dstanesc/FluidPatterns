import { EvolvableRenderer } from "./evolvableRenderer";
import { cloneMap } from "./propUtil";

export class Evolvable {

    private readonly myMap = new Map<string,any>();
    private readonly myTypeId: string;

    evolvableRenderer: EvolvableRenderer;

    constructor(typeId: string, evolvableRenderer: EvolvableRenderer){
        this.evolvableRenderer = evolvableRenderer;     
        this.myTypeId = typeId;
        this.myMap.set("typeId",this.myTypeId);
    }

    public updateA(numA: number){
        this.myMap.set("numA", numA);
        this.render();
    }

    public updateB(numB: number){
        this.myMap.set("numB", numB);
        this.render();
    }

    public updateC(numC: number){
        this.myMap.set("numC", numC);
        this.render();
    }

    private render() {        
        this.evolvableRenderer(cloneMap(this.myMap));
    }

}