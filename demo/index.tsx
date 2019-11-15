"dmf prefix $";

import { React } from "../src";
import { $ } from "../src/v2";

$;
React;

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

let $obj = {
    mode: "a",
    a: 3
} as { mode: "a"; a: number } | { mode: "b"; b: number };

document.body.appendChild(
    (
        <div>
            {$obj.mode === "a" ? (
                <div>
                    <button
                        onclick={
                            () =>
                                ($obj = {
                                    mode: "b",
                                    b: 12
                                }) /* should but doesn't compile to  $obj.$ref = { ... } */
                        }
                    >
                        b mode
                    </button>
                    a: {$obj.a}{" "}
                    <button onclick={() => ++($obj as any).a}>++</button>
                </div>
            ) : (
                <div>
                    <button onclick={() => ($obj = { mode: "a", a: 3 })}>
                        a mode
                    </button>
                    b: {$obj.b}{" "}
                    <button onclick={() => --($obj as any).b}>--</button>
                </div>
            )}
        </div>
    ).node
);
