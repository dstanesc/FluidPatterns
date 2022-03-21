import { SharedPropertyTree } from "@fluid-experimental/property-dds";
import {
    PropertyFactory,
    StringProperty,
    BaseProperty,
    MapProperty,
    ContainerProperty,
} from "@fluid-experimental/property-properties";
import {
    AzureClient,
    ITelemetryBaseEvent,
    ITelemetryBaseLogger,
} from "@fluidframework/azure-client";
import { IFluidContainer } from "@fluidframework/fluid-static";
import { InsecureTokenProvider } from "@fluidframework/test-client-utils";

// @ts-ignore
window.performance.mark = () => {};
// @ts-ignore
window.performance.measure = () => {};

jest.setTimeout(60 * 60 * 1_000); // 1 hour

describe("Benchmark FRS op & summary limits", function () {
    let container: IFluidContainer;
    let tree: SharedPropertyTree;

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function waitSaved() {
        return new Promise((resolve) => container.once("saved", resolve));
    }

    class TestTelemetry implements ITelemetryBaseLogger {
        summarized: boolean = false;
        error: boolean = false;

        send(event: ITelemetryBaseEvent) {
            const e = event.eventName;
            if (e === "fluid:telemetry:Summarizer:Running:Summarize_end") {
                console.log("summary created size =", event.totalBlobSize);
                this.summarized = true;
            } else if (e === "fluid:telemetry:ContainerRuntimeDisposed") {
                console.error(e);
                this.error = true;
            } else {
                const body = event.eventName;
                const msg = JSON.stringify(body, undefined, 2);
                process.stdout.write(`EVENT ${msg}` + "\n");
                // console.log("EVENT", event.eventName);
            }
        }

        async waitForSummary() {
            this.summarized = false;
            while (!this.summarized && !this.error) {
                await sleep(1000);
            }
        }
    }

    const logger = new TestTelemetry();

    const TYPE_NODE = {
        typeid: "test:Struct-1.0.0",
        properties: [{ id: "value", typeid: "String" }],
    };

    const TYPE_ROOT = {
        typeid: "test:Test-1.0.0",
        properties: [
            { id: "field", typeid: "String" },
            { id: "map", typeid: "test:Struct-1.0.0", context: "map" },
        ],
    };

    beforeAll(async function () {
        PropertyFactory.register([TYPE_ROOT, TYPE_NODE]);
    });

    beforeEach(async function () {
        const client = new AzureClient({
            connection: {
                tenantId: process.env.FRS_TENANT,
                tokenProvider: new InsecureTokenProvider(process.env.FRS_KEY, {
                    id: "benchmark",
                }),
                orderer: process.env.FRS_ORDERER,
                storage: process.env.FRS_STORAGE,
            },
            logger,
        });

        container = (
            await client.createContainer({
                initialObjects: { root: SharedPropertyTree },
            })
        ).container;

        await container.attach();
        tree = container.initialObjects.root as SharedPropertyTree;
    });

    afterEach(async function () {
        container.dispose();
        container = undefined;
    });

    test.skip("test op size (seems to fail around 1MB)", async () => {
        const root = PropertyFactory.create(
            TYPE_ROOT.typeid
        ) as ContainerProperty;
        tree.root.insert("root", root);
        tree.commit();

        const map = root.get("map") as MapProperty;

        let keyIndex = 1;
        const value = "big-string-".repeat(1_000);
        for (let num = 50; num < 200; num++) {
            for (let i = 0; i < num; i++) {
                const node = PropertyFactory.create(
                    TYPE_NODE.typeid,
                    "single",
                    {
                        value: value + keyIndex,
                    }
                );
                map.insert("key-" + keyIndex++, node);
            }

            tree.commit();
            const changeSet =
                tree.localChanges[tree.localChanges.length - 1].changeSet;

            // if the operation is too big, the test will likely fail here
            console.log(
                "approx commit size (bytes)",
                JSON.stringify(changeSet).length
            );
            await waitSaved();
        }
    });

    test("test summary size (seems to fail around 10MB)", async () => {
        const root = PropertyFactory.create(
            TYPE_ROOT.typeid
        ) as ContainerProperty;
        tree.root.insert("root", root);
        tree.commit();

        const map = root.get("map") as MapProperty;

        let keyIndex = 1;
        const value = "big-string-".repeat(10);
        let num_nodes = 10;
        for (let summarized = 0; summarized < 1_000; summarized++) {
            for (let nodes = 0; nodes < num_nodes; nodes++) {
                const node = PropertyFactory.create(
                    TYPE_NODE.typeid,
                    "single",
                    {
                        value: value + keyIndex,
                    }
                );
                map.insert("key-" + keyIndex, node);
                tree.commit();

                keyIndex++;
            }
            num_nodes = Math.min(5000, 1.5 * num_nodes);

            process.stdout.write(
                `wait for summary ${summarized} ${keyIndex} +${num_nodes}\n`
            );

            // if the summary is too big, the test will likely fail here
            await logger.waitForSummary();
        }
    });
});
