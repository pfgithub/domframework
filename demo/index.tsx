"dmf prefix $";

import { React } from "../src/dom";
import { $, $bind } from "../src/watchable";

$;
React;

let $num = 5;
let $x = 0;
let $y = 0;

function ToggleView(children: () => JSX.Element) {
    let $isVisible = true;
    return (
        <div>
            <button onclick={() => ($isVisible = !$isVisible)}>
                {$isVisible ? "Hide" : "Show"}
            </button>{" "}
            {$isVisible ? (
                <div>{children()}</div>
            ) : (
                <div>Nothing to see here.</div>
            )}
        </div>
    );
}

document.body.appendChild(
    (
        <div>
            {ToggleView(() => (
                <div>
                    {NumberThing($num || $bind)}
                    {NumberThing($num || $bind)}
                    {NumberThing($num || $bind)}
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
            ))}
        </div>
    ).node
);

function NumberThing($q: number) {
    // for functionalcomponents, every argument should get auto converted to a watchable whether it is or not
    return (
        <span>
            <button onclick={() => $q--}>--</button>
            {$q.toFixed()}
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

type NestedT =
    | { a: NestedT; b: NestedT; text: string; counter: number }
    | undefined;

function NestedTest($o: NestedT) {
    return (
        <div>
            {$o ? (
                <div>
                    <button onclick={() => ($o = undefined)}>Remove</button>
                    <input
                        type="text"
                        value={$o.text}
                        oninput={e =>
                            ($o.text = (e.currentTarget as HTMLInputElement).value)
                        }
                    />
                    {NumberThing($o.counter || $bind)}
                    <ul>
                        <li>a: {NestedTest($o.a || $bind)}</li>
                        <li>b: {NestedTest($o.b || $bind)}</li>
                    </ul>
                </div>
            ) : (
                <div>
                    <button
                        onclick={() =>
                            ($o = {
                                a: undefined,
                                b: undefined,
                                text: "",
                                counter: 0
                            })
                        }
                    >
                        Create
                    </button>
                </div>
            )}
        </div>
    ); // $o ? isn't great because it updates every time $o or anything under it changes... not sure how to fix.
    // maybe there should be some way of specifying that we don't need deep values on this one because we're just comparing it against true or false
}

let $nestedO: NestedT;
document.body.appendChild(NestedTest($nestedO || $bind).node);

document.body.appendChild(ToggleView(() => NestedTest($nestedO || $bind)).node);

let $showSection = true;
document.body.appendChild(
    (
        <div>
            {$showSection ? (
                <div>
                    <button
                        onclick={() => {
                            window.startHighlightUpdates();
                            $showSection = false;
                        }}
                    >
                        highlight updates
                    </button>
                    <button
                        onclick={() =>
                            (window.onNodeUpdate = n => console.log(n))
                        }
                    >
                        log updates
                    </button>
                    <button onclick={() => (window.onNodeUpdate = () => {})}>
                        ignore updates
                    </button>
                </div>
            ) : (
                <div></div>
            )}
        </div>
    ).node
);
