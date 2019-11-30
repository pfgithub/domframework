"dmf prefix $";

import { React, ListRender } from "../src/dom";
import { $, $bind, List } from "../src/watchable";

$;
React;

type TodoItem = { checked: boolean; contents: string };

function TodoList($list: List<TodoItem>) {
    let $wipItem = "";
    let $filter = "";
    return (
        <div>
            <h1>Todo List</h1>
            <ul>
                <li>
                    <input
                        type="text"
                        placeholder="What to do..."
                        value={$wipItem}
                        oninput={e =>
                            ($wipItem = (e.currentTarget as any).value)
                        }
                        onkeypress={e => {
                            if (e.code === "Enter") {
                                $list.push({
                                    checked: false,
                                    contents: $wipItem
                                });
                                $wipItem = "";
                            }
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={$filter}
                        oninput={e =>
                            ($filter = (e.currentTarget as any).value)
                        }
                    />
                </li>
                {ListRender($list, $item => (
                    <div>
                        {$item.contents.indexOf($filter) > -1 ? (
                            // here is an issue!
                            // we don't need to rerender this!!
                            // it should be wrapped in something that only
                            // rerenders it when $item.checked, $item.contents changes, not $filter
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
                                    oninput={e =>
                                        ($item.contents = (e.currentTarget as any).value)
                                    }
                                />
                            </li>
                        ) : (
                            <li>does not match filter</li>
                        )}
                    </div>
                ))}
            </ul>
        </div>
    );
}

let $list: List<TodoItem> = $.list([]);
document.body.appendChild(TodoList($list || $bind).node);
document.body.appendChild(TodoList($list || $bind).node);

export function HighlightUpdatesButton() {
    let $showSection = true;
    return (
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
    );
}

document.body.appendChild(HighlightUpdatesButton().node);
