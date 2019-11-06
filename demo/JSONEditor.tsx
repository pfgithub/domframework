import {
    WatchableRef,
    d,
    textNode,
    watch,
    WatchableList,
    ListRender,
    watchable_watch,
    WatchableObject,
    FakeEmitter
} from "../src";

type JSONObject = {
    type: "Object";
    collapsed: boolean;
    value: WatchableList<JSONData>;
    key: WatchableRef<string>;
};

type JSONArray = {
    type: "Array";
    collapsed: boolean;
    value: WatchableList<JSONData>;
    key: WatchableRef<string>;
};

type JSONString = {
    type: "String";
    collapsed: boolean;
    value: string;
    key: WatchableRef<string>;
};

type JSONBoolean = {
    type: "Boolean";
    collapsed: boolean;
    value: boolean;
    key: WatchableRef<string>;
};

type JSONNumber = {
    type: "Number";
    collapsed: boolean;
    value: number;
    key: WatchableRef<string>;
};

type JSONData = WatchableObject<
    JSONObject | JSONArray | JSONString | JSONBoolean | JSONNumber
>;

function JSONNode(node: JSONData) {
    let type = node.get("type").value;
    let collapsed = node.get("collapsed");
    let value = node.get("value");
    let key = node.get("key");
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
