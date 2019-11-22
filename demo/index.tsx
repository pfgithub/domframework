"dmf prefix $";

import { React } from "../src";
import { $ } from "../src/v2";

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

let $obj: { a: 6; b: 5 } | undefined = undefined;
document.body.appendChild(
    (
        <div>
            {$obj === undefined ? (
                <span>undefined</span>
            ) : (
                <span>
                    {$obj.a} {$obj.b}
                </span>
            )}
            <button onclick={() => ($obj = undefined)}>set undefined</button>
            <button onclick={() => ($obj = { a: 6, b: 5 })}>set 5, 6</button>
        </div>
    ).node
);
