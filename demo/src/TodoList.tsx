"dmf prefix $";

import { React, ListRender, $, $bind, List, mount } from "dmf";
import "./drawBoxAroundElement";
import { NodeAttributes } from "dmf/dist/dom";

$;
React;

type TodoItem = { checked: boolean; contents: string };

function ManagedTextInput(
    $text: string,
    props: Partial<NodeAttributes<"input">>,
) {
    return (
        <input
            value={$text}
            onInput={e => ($text = e.currentTarget.value)}
            {...props}
        />
    );
}

function TodoList($list: List<TodoItem>) {
    let $wipItem = "";
    let $filter = "";
    let thisShouldFocus = false;
    return (
        <>
            <h1>Todo List</h1>
            <ul>
                <li>
                    {ManagedTextInput($wipItem || $bind, {
                        type: "text",
                        placeholder: "What to do...",
                        onKeyPress: e => {
                            if (e.code === "Enter") {
                                $list.unshift({
                                    checked: false,
                                    contents: $wipItem,
                                });
                                $wipItem = "";
                            }
                        },
                    })}
                    {ManagedTextInput($filter || $bind, {
                        type: "text",
                        placeholder: "Filter...",
                    })}
                </li>
                {ListRender($list, ($item, symbol) => {
                    let $showRemoveConfirm = false;
                    return (
                        <>
                            {$item.contents.indexOf($filter) > -1 ? (
                                <li>
                                    <input
                                        type="checkbox"
                                        checked={$item.checked}
                                        onInput={e =>
                                            ($item.checked =
                                                e.currentTarget.checked)
                                        }
                                    />{" "}
                                    <input
                                        type="text"
                                        value={$item.contents}
                                        dmfOnMount={node =>
                                            setTimeout(
                                                () =>
                                                    thisShouldFocus
                                                        ? (node.focus(),
                                                          (thisShouldFocus = false))
                                                        : 0,
                                                0,
                                            )
                                        }
                                        onInput={e =>
                                            ($item.contents = (e.currentTarget as any).value)
                                        }
                                        onKeyPress={e => {
                                            if (e.code === "Enter") {
                                                thisShouldFocus = true;
                                                $list.insert(
                                                    { after: symbol },
                                                    {
                                                        checked: false,
                                                        contents: "",
                                                    },
                                                );
                                            }
                                        }}
                                    />
                                    {$showRemoveConfirm ? (
                                        <>
                                            Are you sure?{" "}
                                            <button
                                                onClick={() =>
                                                    $list.remove(symbol)
                                                }
                                            >
                                                Remove
                                            </button>
                                            <button
                                                onClick={() =>
                                                    ($showRemoveConfirm = false)
                                                }
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                ($showRemoveConfirm = true)
                                            }
                                        >
                                            x
                                        </button>
                                    )}
                                </li>
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

export function TodoListApp() {
    let $list: List<TodoItem> = $.list([]);
    let $listOfTodoLists: List<0> = $.list([0]);
    return (
        <>
            {ListRender($listOfTodoLists, ($item, symbol) => {
                let $confirmVisible = false;
                return (
                    <>
                        {TodoList($list || $bind)}
                        <div>
                            {$confirmVisible ? (
                                <>
                                    Are you sure?{" "}
                                    <button
                                        onClick={() =>
                                            $listOfTodoLists.remove(symbol)
                                        }
                                    >
                                        Remove
                                    </button>
                                    <button
                                        onClick={() =>
                                            ($confirmVisible = false)
                                        }
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => ($confirmVisible = true)}
                                >
                                    x
                                </button>
                            )}
                        </div>
                    </>
                );
            })}
            <button onClick={() => $listOfTodoLists.push(0)}>+</button>
        </>
    );
}
