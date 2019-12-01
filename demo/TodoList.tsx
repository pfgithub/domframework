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
                {ListRender($list, $item => {
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
                                oninput={e =>
                                    ($item.contents = (e.currentTarget as any).value)
                                }
                            />
                        </li>
                    );
                    return (
                        <div>
                            {$item.contents.indexOf($filter) > -1 ? (
                                // if(different) rerender
                                // easiest way would be to check if the node changed
                                // but that makes less clean code.
                                // trying...
                                item
                            ) : (
                                <li>does not match filter</li>
                            )}
                        </div>
                    );
                })}
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
