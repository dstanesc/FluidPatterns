import { DataBinder, DataBinderHandle, UpgradeType } from "@fluid-experimental/property-binder";
import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import schema from "./dice-1.0.0";
import { Operation, DEFAULT_CALL, DiceController } from "./diceController";
import { DiceBinding } from "./diceBinding";
import { PropCountRenderer, StatRenderer } from "./renderers";
import { DiceAdapter, DiceArrayBinderHandle } from './diceAdapter';
import { initWorkspace, configureTypeBinding, unregisterTypeBinding, configurePathBinding, createDiceProperty, rollSingle, rollAll, removeAll, sleep, createDiceProperties, rollManyTimes, initWorkspace2 } from './diceApi';

// @ts-ignore
window.performance.mark = () => { };
// @ts-ignore
window.performance.measure = () => { };


describe("Dice Binding Benchmark", function () {

    let dataBinder: DataBinder;

    let workspace: Workspace;

    let containerId: string;

    let propCount: number;

    let operations: Operation[] = [];

    let history: string = "";


    const setDataBinder = (b: DataBinder) => {
        dataBinder = b;
    }

    const setWorkspace = (w: Workspace) => {
        workspace = w;
    }

    const setLocationHash = (cid: string) => {
        containerId = cid;
    }

    const setPropCount = (count: number) => {
        propCount = count;
    }

    const setOperations = (ops: Operation[]) => {
        operations = ops;
    }

    const addOperation = (op: Operation) => {
        operations.push(op);
        history += op.latency + ", ";
    }

    const cleanUp = () => {
        setDataBinder(undefined);
        setWorkspace(undefined);
        setLocationHash(undefined);
        setPropCount(undefined);
        setOperations([]);
        history = "";
    }

    const performInternal = async (times: number, size: number): Promise<BoundWorkspace> => {
        const workspacePromise = initWorkspace2(containerId, setDataBinder, setWorkspace, setLocationHash);
        workspacePromise.then(
            w => {

                console.log(`Dice Binding:  configureTypeBinding`);

                configureTypeBinding(dataBinder, workspace, addOperation, setPropCount);

                console.log(`Dice Binding:  createDiceProperties`);

                createDiceProperties(size, workspace);

                console.log(`Dice Binding:  rollManyTimes`);

                rollManyTimes(times, workspace);

                operations.forEach(o => {
                    console.log(`Found operation latency ${o.latency}`);
                });

            }
        );
        return workspacePromise;
    }

    // beforeAll(function () {

    // });

    // beforeEach(function () {

    // });

    afterEach(function () {
        cleanUp();
    });

    test("empty suite", () =>{
        expect(2 + 2).toBe(4);
    });

    // test("10 properties", () => {
    //     return performInternal(10, 10).then(data => {
    //         console.log(`Dice Binding:  Test Executed ${data}`);
    //         console.log(`Recorded latencies ${history}`);
    //     });
    // });

    // test("100 properties", () => {
    //     return performInternal(10, 100).then(data => {
    //         console.log(`Dice Binding:  Test Executed ${data}`);
    //         console.log(`Recorded latencies ${history}`);
    //     });
    // });

    // test("1000 properties", () => {
    //     return performInternal(10, 1000).then(data => {
    //         console.log(`Dice Binding:  Test Executed ${data}`);
    //         console.log(`Recorded latencies ${history}`);
    //     });
    // });
});
