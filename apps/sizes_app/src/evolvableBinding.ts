/* eslint-disable no-multiple-empty-lines */
/* eslint-disable padded-blocks */
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
    private updateC(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateC(value);
    }
    private updateD(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateD(value);
    }
    private updateE(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateE(value);
    }

    private updateF(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateF(value);
    }

    private updateG(value: string) {
        const evolvable = this.getRepresentation<Evolvable>();
        evolvable?.updateG(value);
    }

    static initialize() {
        this.registerOnValues("numA", ["modify"], this.prototype.updateA);
        this.registerOnValues("numA", ["insert"], this.prototype.updateA);
        this.registerOnValues("strB", ["modify"], this.prototype.updateB);
        this.registerOnValues("strB", ["insert"], this.prototype.updateB);
        this.registerOnValues("strC", ["modify"], this.prototype.updateC);
        this.registerOnValues("strC", ["insert"], this.prototype.updateC);
        this.registerOnValues("strD", ["modify"], this.prototype.updateD);
        this.registerOnValues("strD", ["insert"], this.prototype.updateD);
        this.registerOnValues("strE", ["modify"], this.prototype.updateE);
        this.registerOnValues("strE", ["insert"], this.prototype.updateE);
        this.registerOnValues("strF", ["modify"], this.prototype.updateF);
        this.registerOnValues("strF", ["insert"], this.prototype.updateF);
        this.registerOnValues("strG", ["modify"], this.prototype.updateG);
        this.registerOnValues("strG", ["insert"], this.prototype.updateG);
    }
}

EvolvableBinding.initialize();
