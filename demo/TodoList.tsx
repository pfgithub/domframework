"dmf prefix $";

import { React, ListRender } from "../src/dom";
import { $, $bind, List } from "../src/watchable";

$;
React;

type TodoItem = { checked: boolean; contents: string };

function ManagedTextInput($text: string, props) {
    return (
        <input
            value={$text}
            oninput={e => ($text = (e.currentTarget as HTMLInputElement).value)}
            {...props}
        />
    );
}

function TodoList($list: List<TodoItem>) {
    let $wipItem = "";
    let $filter = "";
    return (
        <>
            <h1>Todo List</h1>
            <ul>
                <li>
                    {ManagedTextInput($wipItem || $bind, {
                        type: "text",
                        placeholder: "What to do...",
                        onkeypress: e => {
                            if (e.code === "Enter") {
                                $list.push({
                                    checked: false,
                                    contents: $wipItem
                                });
                                $wipItem = "";
                            }
                        }
                    })}
                    {ManagedTextInput($filter || $bind, {
                        type: "text",
                        placeholder: "Filter..."
                    })}
                </li>
                {ListRender($list, ($item, symbol) => {
                    let $showRemoveConfirm = false;
                    let item = (
                        <li>
                            <input
                                type="checkbox"
                                checked={$item.checked}
                                oninput={e =>
                                    ($item.checked = (e.currentTarget as any).checked)
                                }
                            />{" "}
                            <input
                                type="text"
                                value={$item.contents}
                                nodecreated={node =>
                                    setTimeout(
                                        () =>
                                            !$item.contents ? node.focus() : 0,
                                        0
                                    )
                                }
                                oninput={e =>
                                    ($item.contents = (e.currentTarget as any).value)
                                }
                                onkeypress={e => {
                                    if (e.code === "Enter") {
                                        $list.insert(
                                            { after: symbol },
                                            {
                                                checked: false,
                                                contents: ""
                                            }
                                        );
                                    }
                                }}
                            />
                            {$showRemoveConfirm ? (
                                <>
                                    Are you sure?{" "}
                                    <button
                                        onclick={() => $list.remove(symbol)}
                                    >
                                        Remove
                                    </button>
                                    <button
                                        onclick={() =>
                                            ($showRemoveConfirm = false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onclick={() => ($showRemoveConfirm = true)}
                                >
                                    x
                                </button>
                            )}
                        </li>
                    );
                    return (
                        <>
                            {$item.contents.indexOf($filter) > -1 ? (
                                // one fix would be to add $item.contents.indexOf($filter) > -1
                                // to watch itself so if it changes this rerenders
                                // but not if it doesn't change
                                item
                            ) : (
                                <li>does not match filter</li>
                            )}
                        </>
                    );
                })}
            </ul>
        </>
    );
}

let $list: List<TodoItem> = $.list([]);
let $listOfTodoLists: List<0> = $.list([0]);
document.body.appendChild(
    ListRender($listOfTodoLists, ($item, symbol) => {
        let $confirmVisible = false;
        return (
            <>
                {TodoList($list || $bind)}
                <div>
                    {$confirmVisible ? (
                        <>
                            Are you sure?{" "}
                            <button
                                onclick={() => $listOfTodoLists.remove(symbol)}
                            >
                                Remove
                            </button>
                            <button onclick={() => ($confirmVisible = false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button onclick={() => ($confirmVisible = true)}>
                            x
                        </button>
                    )}
                </div>
            </>
        );
    }).node
);
document.body.appendChild(
    (<button onclick={() => $listOfTodoLists.push(0)}>+</button>).node
);

export function HighlightUpdatesButton() {
    let $showSection = true;
    return (
        <div>
            {$showSection ? (
                <>
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
                </>
            ) : (
                <></>
            )}
        </div>
    );
}

document.body.appendChild(HighlightUpdatesButton().node);
