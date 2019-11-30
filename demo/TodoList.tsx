"dmf prefix $";

import { React, ListRender } from "../src/dom";
import { $, $bind, List } from "../src/watchable";

$;
React;

type TodoItem = { checked: boolean; contents: string };

function TodoList($list: List<TodoItem>) {
    let $wipItem = "";
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
                </li>
                {ListRender($list, $item => (
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
                ))}
            </ul>
        </div>
    );
}

let $list: List<TodoItem> = $.list([]);
document.body.appendChild(TodoList($list || $bind).node);
document.body.appendChild(TodoList($list || $bind).node);
