import {
    WatchableRef,
    d,
    textNode,
    watch,
    WatchableList,
    ListRender,
    watchable_watch,
    WatchableObject,
    FakeEmitter,
    React
} from "../src";

type JSONObject = {
    type: WatchableRef<"Object">;
    collapsed: WatchableRef<boolean>;
    value: WatchableList<JSONData>;
    key: WatchableRef<string>;
};

type JSONArray = {
    type: WatchableRef<"Array">;
    collapsed: WatchableRef<boolean>;
    value: WatchableList<JSONData>;
    key: WatchableRef<string>;
};

type JSONString = {
    type: WatchableRef<"String">;
    collapsed: WatchableRef<boolean>;
    value: WatchableRef<string>;
    key: WatchableRef<string>;
};

type JSONBoolean = {
    type: WatchableRef<"Boolean">;
    collapsed: WatchableRef<boolean>;
    value: WatchableRef<boolean>;
    key: WatchableRef<string>;
};

type JSONNumber = {
    type: WatchableRef<"Number">;
    collapsed: WatchableRef<boolean>;
    value: WatchableRef<number>;
    key: WatchableRef<string>;
};

type JSONData = WatchableObject<
    JSONObject | JSONArray | JSONString | JSONBoolean | JSONNumber
>;

function JSONNode(node: JSONData) {
    let type = node.v.type.value;
    let collapsed = node.v.collapsed;
    let value = node.v.value;
    let key = node.v.key;
    // watch([node.v.type, node.v.collapsed], { getjson: node }, nodejson => {
    //     /*nodejson will be an object with each item at its .ref*/
    //     /*that doesn't make sense but it would work*/
    // });
    // what about if we did a custom compiler
    // in babel, remap key.value.$ref to watch([key.value], () => key.value.ref)
    // or key.value.$ref + "-" + value.value.$ref
    // watch([key.value, value.value], () => key.value.ref + "-" + value.value.ref)
    // babel will see the $ sign inside {} brackets and wrap the whole {} in a watch statement
    if (node.v.type.value.ref === "String") {
        node.v.type.value.ref;
    }
    return (
        <div>
            {watch([key], () =>
                key.value ? <div>{key.value.$ref}: </div> : <div />
            )}
            {watch([type], () =>
                type === "String" ? (
                    <div>
                        {
                            ((value as unknown) as FakeEmitter<
                                WatchableRef<string>
                            >).value!.$ref
                        }
                    </div>
                ) : type === "Object" ? (
                    <div>sublist ,., .,. ,., .,. ,., .,. ,., .,.</div>
                ) : (
                    <div>not supported</div>
                )
            )}
        </div>
    );
}
