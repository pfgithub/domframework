"dmf";

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

import { $ } from "../src/v2";

$;

let $num = 5;

document.body.appendChild(
    (
        <div>
            <button onclick={() => --$num}>--</button>
            {$num}
            <button onclick={() => ++$num}>++</button>
        </div>
    ).node
);
