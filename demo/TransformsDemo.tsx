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

watch; // required to make sure it is defined when the plugin loads

export function Counter() {
    let counter = new WatchableRef(0);
    return (
        <div>
            Count: <button onclick={() => counter.ref--}>--</button>{" "}
            {"" + counter.$ref}{" "}
            <button
                onclick={() =>
                    counter.ref >= 10 ? (counter.ref += 2) : counter.ref++
                }
            >
                {counter.$ref >= 10 ? "+=2" : "++"}
            </button>
        </div>
    );
}
