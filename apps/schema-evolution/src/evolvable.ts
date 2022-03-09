import { EvolvableRenderer } from "./evolvableRenderer";
import { cloneMap } from "./propUtil";

export class Evolvable {

    private readonly myMap = new Map<string,any>();

    evolvableRenderer: EvolvableRenderer;

    constructor(evolvableRenderer: EvolvableRenderer){
        this.myMap.set("numA", 0);
        this.myMap.set("strB", "-");
        this.evolvableRenderer = evolvableRenderer;     
    }

    public updateA(numA: number){
        this.myMap.set("numA", numA);
        this.render();
    }

    public updateB(strB: string){
        this.myMap.set("strB", strB);
        this.render();
    }

    private render() {        
        this.evolvableRenderer(cloneMap(this.myMap));
    }

}