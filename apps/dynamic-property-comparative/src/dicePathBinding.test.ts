import { DataBinder, DataBinderHandle, UpgradeType } from "@fluid-experimental/property-binder";
import { Workspace, BoundWorkspace, initializeBoundWorkspace, registerSchema } from "@dstanesc/fluid-util";
import schema from "./dice-1.0.0";
import { Operation, DEFAULT_CALL, DiceBindingController, DiceAdapterController } from "./diceController";
import { DiceBinding } from "./diceBinding";
import { PropCountRenderer, StatRenderer } from "./renderers";
import { DiceAdapter, DiceArrayBinderHandle } from './diceAdapter';
import { initWorkspace, configureTypeBinding, unregisterTypeBinding, configurePathBinding, createDiceProperty, rollSingle, rollAll, removeAll, sleep, createDiceProperties, rollManyTimes, initWorkspace2, createDicePropertiesSynch } from './diceApi';
import { NamedProperty } from "@fluid-experimental/property-properties";

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

    let runs:  Map<number,string> = new Map<number,string>(); 


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


    const performInternal = async (times: number, size: number): Promise<any> => {

        const workspacePromise = initWorkspace2(containerId, setDataBinder, setWorkspace, setLocationHash);

        return workspacePromise.then(
           w => {

                console.log(`Dice Binding:  createDiceProperties`);

                createDicePropertiesSynch(size, workspace);

                console.log(`Dice Binding:  configureTypeBinding`);

                configurePathBinding(dataBinder, workspace, new DiceAdapterController(addOperation, setPropCount));

                console.log(`Dice Binding:  rollManyTimes`);

                rollManyTimes(times, workspace);
            }
       );
    }

    //  const performInternal = async (times: number, size: number): Promise<BoundWorkspace> => {

    //     const workspacePromise = initWorkspace2(containerId, setDataBinder, setWorkspace, setLocationHash);

    //     workspacePromise.then(

    //         w => {

    //             return createDiceProperties(size, workspace).then(

    //                 (diceProps: NamedProperty[]) => {

    //                     console.log(`Dice Binding:  configureTypeBinding`);

    //                     configurePathBinding(dataBinder, workspace, new DiceAdapterController(addOperation, setPropCount));

    //                     console.log(`Dice Binding:  rollManyTimes`);

    //                     rollManyTimes(times, workspace);

    //                     return diceProps;
    //                 }
    //             );
    //         }
    //     );
        
    //     return workspacePromise;
    // }

    const display = () => {
        console.log(`Current latencies ${history}`);
        runs.forEach((h: string, key: number) => {
            console.log(`Historical latencies ${key} -> ${h}`);
        });
    }


    test("empty suite", () => {
        expect(2 + 2).toBe(4);
    });

    // afterEach(function () {
    //     display();
    //     cleanUp();
    // });

    // test("10 properties", () => {

    //     return performInternal(10, 10).then(props => {
            
    //         runs.set(10, history);
    //     });
    // });

    // test("100 properties", () => {

    //     return performInternal(10, 100).then(props => {
            
    //         runs.set(100, history);
    //     });
    // });

    // test("1000 properties", () => {

    //     return performInternal(10, 1000).then(props => {

    //         runs.set(1000, history);
    //     });
    // });

    // test("3000 properties", () => {

    //     return performInternal(10, 3000).then(props => {

    //         runs.set(3000, history);
    //     });
    // });
});


