"dmf prefix $";

import { React } from "../src";
import { $, $bind } from "../src/v2";

$;
React;

let $num = 5;
let $x = 0;
let $y = 0;

document.body.appendChild(
    (
        <div>
            <button onclick={() => --$num}>--</button>
            {$num}
            <button onclick={() => ++$num}>++</button>
            <div
                className="box"
                onmousemove={e => {
                    $x = e.clientX;
                    $y = e.clientY;
                }}
            >
                Mouse position: x: {$x}, y: {$y}
            </div>
        </div>
    ).node
);

function NumberThing($q: number) {
    // for functionalcomponents, every argument should get auto converted to a watchable whether it is or not
    return (
        <span>
            <button onclick={() => $q--}>--</button>
            {$q.toFixed(2)}
            <button onclick={() => $q++}>++</button>
        </span>
    );
}

let $obj: { a: 5; b: 6 } | undefined = undefined;
document.body.appendChild(
    (
        <div>
            {$obj === undefined ? (
                <span>not defined</span>
            ) : (
                <span>
                    {NumberThing($obj.a || $bind)}{" "}
                    {NumberThing($obj.b || $bind)}
                </span>
            )}
            <button onclick={() => ($obj = undefined)}>set undefined</button>
            <button onclick={() => ($obj = { a: 5, b: 6 })}>set 5, 6</button>
        </div>
    ).node
);
