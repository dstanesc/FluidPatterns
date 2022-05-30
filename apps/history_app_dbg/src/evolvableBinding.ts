import { DataBinding } from "@fluid-experimental/property-binder";
import { Evolvable } from "./evolvable";


export class EvolvableBinding extends DataBinding {

    private updateA(value: number) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateA(value);
    }
    private updateB(value: number) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateB(value);
    }
    private updateC(value: number) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateC(value);
    }


    static initialize() {
        this.registerOnValues("numA", ["modify"], this.prototype.updateA);
        this.registerOnValues("numA", ["insert"], this.prototype.updateA);
        this.registerOnValues("numB", ["modify"], this.prototype.updateB);
        this.registerOnValues("numB", ["insert"], this.prototype.updateB); 
        this.registerOnValues("numC", ["modify"], this.prototype.updateC);
        this.registerOnValues("numC", ["insert"], this.prototype.updateC);                             
    }
}

EvolvableBinding.initialize();