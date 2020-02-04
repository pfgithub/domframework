"dmf prefix $";

import { React, ListRender, $, $bind, List, mount, Portal } from "dmf";

import "./drawBoxAroundElement";
import { TodoListApp } from "./TodoList";

$;
React;

import ClickerEditor from "./ClickerEditor";

const $num = 5;
let $x = 0;
let $y = 0;

mount(ClickerEditor(), document.body);

function ToggleView(children: () => JSX.Element) {
    let $isVisible = true;
    return (
        <div>
            <button onClick={() => ($isVisible = !$isVisible)}>
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

const portalResult = document.createElement("div");
const startResult = document.createTextNode("---start portal---");
const endResult = document.createTextNode("---end portal---");
portalResult.appendChild(startResult);
portalResult.appendChild(endResult);
document.body.appendChild(portalResult);

mount(
    <div>
        {ToggleView(() =>
            Portal(
                <div>
                    hi! this node was made inside a portal! it even has a
                    toggleview:{" "}
                    {ToggleView(() => (
                        <div>Here's the content!</div>
                    ))}
                </div>,
                portalResult,
                endResult,
            ),
        )}
    </div>,
    document.body,
);

mount(
    <div>
        {ToggleView(() => (
            <div>
                {NumberThing($num || $bind)}
                {NumberThing($num || $bind)}
                {NumberThing($num || $bind)}
                <div
                    class="box"
                    onMouseMove={e => {
                        $x = e.clientX;
                        $y = e.clientY;
                    }}
                >
                    Mouse position: x: {$x}, y: {$y}
                </div>
            </div>
        ))}
    </div>,
    document.body,
);

function NumberThing($q: number) {
    // for functionalcomponents, every argument should get auto converted to a watchable whether it is or not
    return (
        <span>
            <button onClick={() => $q--}>--</button>
            {$q.toFixed()}
            {console.log("value is", $q)}
            <button onClick={() => $q++}>++</button>
        </span>
    );
}

let $obj = undefined as { a: 5; b: 6 } | undefined;
mount(
    <div>
        {$obj === undefined ? (
            <span>not defined</span>
        ) : (
            <span>
                {NumberThing($obj.a || $bind)} {NumberThing($obj.b || $bind)}
            </span>
        )}
        <button onClick={() => ($obj = undefined)}>set undefined</button>
        <button onClick={() => ($obj = { a: 5, b: 6 })}>set 5, 6</button>
    </div>,
    document.body,
);

type NestedT =
    | { a: NestedT; b: NestedT; text: string; counter: number }
    | undefined;

const $globalCounter = 0;

function NestedTest($o: NestedT) {
    return (
        <div>
            {$o ? (
                <div>
                    <button onClick={() => ($o = undefined)}>Remove</button>
                    <input
                        type="text"
                        value={$o.text}
                        onInput={e => ($o!.text = e.currentTarget.value)}
                    />
                    {NumberThing($o.counter || $bind)}
                    {NumberThing($globalCounter || $bind)}
                    <ul>
                        <li>a: {NestedTest($o.a || $bind)}</li>
                        <li>b: {NestedTest($o.b || $bind)}</li>
                    </ul>
                </div>
            ) : (
                <div>
                    <button
                        onClick={() =>
                            ($o = {
                                a: undefined,
                                b: undefined,
                                text: "",
                                counter: 0,
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
mount(NestedTest($nestedO || $bind), document.body);

mount(
    ToggleView(() => NestedTest($nestedO || $bind)),
    document.body,
);

let $showSection = true;
mount(
    <div>
        {$showSection ? (
            <div>
                <button
                    onClick={() => {
                        (window as any).startHighlightUpdates();
                        $showSection = false;
                    }}
                >
                    highlight updates
                </button>
                <button
                    onClick={() =>
                        ((window as any).onNodeUpdate = (n: any) =>
                            console.log(n))
                    }
                >
                    log updates
                </button>
                <button
                    onClick={() => ((window as any).onNodeUpdate = () => {})}
                >
                    ignore updates
                </button>
            </div>
        ) : (
            <div />
        )}
    </div>,
    document.body,
);

function TodoList($list: List<string>) {
    return (
        <div>
            <div>StartTodoList</div>
            {ListRender($list, $item => (
                <div>
                    Item:{" "}
                    <input
                        type="text"
                        value={$item}
                        onInput={e => ($item = e.currentTarget.value)}
                    />
                </div>
            ))}
            <button onClick={() => $list.push("hmm")}>+</button>
            <div>EndTodoList</div>
        </div>
    );
}

const $list = $.list(["hi"]);
mount(TodoList($list || $bind), document.body);
mount(TodoList($list || $bind), document.body);

type NodeType = { num: number; subitems: List<NodeType> };

function NodeTestThing($list: List<NodeType>) {
    return (
        <div>
            <ul>
                {ListRender($list, $node => (
                    <li>
                        <div>
                            {NumberThing($node.num || $bind)},{" "}
                            {NodeTestThing($node.subitems || $bind)}
                        </div>
                    </li>
                ))}
                <li>
                    {" "}
                    <button
                        onClick={() =>
                            $list.push({ num: 5, subitems: $.list([]) })
                        }
                    >
                        +
                    </button>
                </li>
            </ul>
        </div>
    );
}

const $listTest = $.list<NodeType>([]);
mount(NodeTestThing($listTest || $bind), document.body);
mount(NodeTestThing($listTest || $bind), document.body);

mount(<div>---RealTodoList:{TodoListApp()}</div>, document.body);
