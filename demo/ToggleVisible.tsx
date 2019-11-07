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

export function ToggleVisible(element: () => JSX.Element) {
    let isVisible = new WatchableRef(false);
    return (
        <fieldset>
            <legend>
                <button onclick={() => (isVisible.ref = !isVisible.ref)}>
                    {isVisible.$ref ? "Hide" : "Show"}
                </button>
            </legend>
            {isVisible.$ref ? element() : <div />}
        </fieldset>
    );
}
