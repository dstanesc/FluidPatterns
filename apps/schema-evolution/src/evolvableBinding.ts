import { DataBinding } from "@fluid-experimental/property-binder";
import { Evolvable } from "./evolvable";


export class EvolvableBinding extends DataBinding {

    private updateA(value: number) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateA(value);
    }
    private updateB(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateB(value);
    }
    static initialize() {
        this.registerOnValues("numA", ["modify"], this.prototype.updateA);
        this.registerOnValues("numA", ["insert"], this.prototype.updateA);
        this.registerOnValues("strB", ["modify"], this.prototype.updateB);
        this.registerOnValues("strB", ["insert"], this.prototype.updateB);
    }
}

EvolvableBinding.initialize();