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

watch;

type JSONStringNode = {
    type: WatchableRef<"string">;
    value: WatchableRef<string>;
};

type JSONNumberNode = {
    type: WatchableRef<"number">;
};
type JSONBooleanNode = {
    type: WatchableRef<"number">;
};

type JSONArrayNode = {
    type: WatchableRef<"array">;
};
type JSONObjectNode = {
    type: WatchableRef<"object">;
};

function nodeTypeMatches<
    Type extends "string" | "number" | "array" | "boolean" | "object"
>(
    node: WatchableObject<JSONNodeData>,
    nodeType: WatchableRef<string>,
    type: Type
): node is Type extends "string"
    ? WatchableObject<JSONStringNode>
    : Type extends "number"
    ? WatchableObject<JSONNumberNode>
    : Type extends "boolean"
    ? WatchableObject<JSONBooleanNode>
    : Type extends "array"
    ? WatchableObject<JSONArrayNode>
    : WatchableObject<JSONObjectNode> {
    // !!!!!!!!!!!!!!  obviously this  is not a valid solution
    return nodeType.ref === type;
}

type JSONNodeData =
    | JSONStringNode
    | JSONNumberNode
    | JSONBooleanNode
    | JSONArrayNode
    | JSONObjectNode;

export function JSONNode(node: WatchableObject<JSONNodeData>) {
    return (
        <div>
            {nodeTypeMatches(node, node.v.type.$ref, "string") ? (
                <div>{node.v.value.ref.$ref}</div>
            ) : (
                <div />
            )}
        </div>
    );
}

interface RawJSONDataTypeArray extends Array<RawJSONDataType> {} // prevent circular reference
type RawJSONDataType =
    | { [key: string]: RawJSONDataType }
    | RawJSONDataTypeArray
    | string
    | number
    | boolean
    | undefined;

export function JSONEditorDemo(JSONData: RawJSONDataType /*static*/) {
    let watchableObjects = JSON.parse(
        JSON.stringify(JSONData),
        (key, value) => {
            if (typeof value === "string") {
                return new WatchableRef(value);
            }
            if (typeof value === "number") {
                return new WatchableRef(value);
            }
            if (typeof value === "boolean") {
                return new WatchableRef(value);
            }
            if (Array.isArray(value)) {
            }
            if (typeof value === "object") {
            }
            return value;
        }
    );
}
