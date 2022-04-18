import { SerializedChangeSet } from "@fluid-experimental/property-dds";
import { AssemblyComponent } from "./assemblyApi";
import _ from "lodash"
import jp from "jsonpath";

export function parseChangeSet(changeSet: SerializedChangeSet) {

    const insertedComponents = jp.query(changeSet, '$..insert["hex:assemblyComponent-1.0.0"]')[0];

    const inserted: AssemblyComponent[] = [];

    if (insertedComponents) {

        Object.entries(insertedComponents).forEach(([id, body]) => {

            const component: AssemblyComponent = {
                "id": id,
                "annotation": body["String"].annotation,
                "fill": body["String"].fill,
                "x": body["Int32"].x,
                "y": body["Int32"].y,
                "width": body["Int32"].width,
                "height": body["Int32"].height
            };
            inserted.push(component);
        });
    }

    console.log(`Inserted:\n${JSON.stringify(inserted, null, 2)}`);

    const modifiedComponents = jp.query(changeSet, '$..modify["hex:assemblyComponent-1.0.0"]')[0];

    const modified: AssemblyComponent[] = [];

    if (modifiedComponents) {

        Object.entries(modifiedComponents).forEach(([id, body]) => {

            const component: AssemblyComponent = {
                "id": id,
                // alternative to optional chaining https://2ality.com/2019/07/optional-chaining.html
                "annotation": _.get(body, 'String.annotation.value'),
                "fill": _.get(body, 'String.fill.value'),
                "x": _.get(body, 'Int32.x?.value'),
                "y": _.get(body, 'Int32.y?.value'),
                "width": _.get(body, 'Int32.width.value'),
                "height": _.get(body, 'Int32.height.value')
            };
            modified.push(component);
        });
    }

    console.log(`Modified:\n${JSON.stringify(modified, null, 2)}`);

    return { "inserted": inserted, "modified": modified }
}