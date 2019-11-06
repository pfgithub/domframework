import {
    WatchableRef,
    d,
    textNode,
    watch,
    WatchableList,
    ListRender,
    watchable_watch,
    WatchableObject,
    FakeEmitter
} from "../src";

let watchableCount = new WatchableRef(25);
let contentIsShowing = new WatchableRef(false);

let model = d(
    "div",
    {},
    d(
        "button",
        {
            onclick: () => (contentIsShowing.ref = !contentIsShowing.ref)
        },
        textNode(
            watch([contentIsShowing], () =>
                contentIsShowing.ref ? "Hide" : "Show"
            )
        )
    ),
    watch([contentIsShowing], () =>
        contentIsShowing.ref
            ? d(
                  "div",
                  {},
                  d(
                      "span",
                      {},
                      textNode("Count: "),
                      textNode(
                          watch([watchableCount], () => "" + watchableCount.ref)
                      ),
                      textNode(" ")
                  ),
                  textNode(
                      watch([watchableCount], () => "" + watchableCount.ref)
                  ),
                  d(
                      "button",
                      { onclick: () => watchableCount.ref++ },
                      textNode("++")
                  ),
                  d(
                      "button",
                      {
                          onclick: () => {
                              console.log(watchableCount);
                              model.removeSelf();
                              console.log(watchableCount);
                          }
                      },
                      textNode("removeSelf")
                  )
              )
            : d("div", {})
    )
);

document.createElement("div").onclick;

// type OptionalProps<T> = { [key in keyof T]?: T[key] };
//
// declare global {
//     namespace JSX {
//         interface IntrinsicElements {
//             [elemName: string]: OptionalProps<GlobalEventHandlers> & {
//                 children?: ComponentModel[] | ComponentModel;
//             };
//         }
//         interface Element extends ExistingComponentModel {}
//     }
// }

let React = { createElement: d };

let modelJSX = (
    <div>
        <button onclick={() => (contentIsShowing.ref = !contentIsShowing.ref)}>
            {watch([contentIsShowing], () =>
                contentIsShowing.ref ? "Hide" : "Show"
            )}
        </button>
        {watch([contentIsShowing], () =>
            // !!!!!! this watch needs to be removed !!!!!!
            // for some  reason, after removing all the components,
            // reshowing runs this again
            contentIsShowing.ref ? (
                <div>
                    <span>
                        Count:{" "}
                        {watch([watchableCount], () => "" + watchableCount.ref)}
                    </span>
                    {textNode(" ")}
                    {textNode(
                        watch([watchableCount], () => "" + watchableCount.ref)
                    )}
                    <button onclick={() => watchableCount.ref++}>++</button>
                    <button
                        onclick={() => {
                            model.removeSelf();
                        }}
                    >
                        removeSelf
                    </button>
                </div>
            ) : (
                d("div", {})
            )
        )}
    </div>
);

let inputValue = new WatchableRef("");
let managedInput = (
    <div>
        <input
            value={inputValue.$ref}
            oninput={e =>
                (inputValue.ref = (e.currentTarget as HTMLInputElement).value)
            }
        />
        {inputValue.$ref}
    </div>
);

// let Toggleable = component();
//
// let toggleableTestModel = (
//     <Toggleable>
//         <div>visible</div>
//     </Toggleable>
// );

// let model = d(
//     "button",
//     {
//         onclick: (e: any) => {
//             watchableCount.ref++;
//         }
//     },
//     textNode("Value: "),
//     textNode(watch<string>([watchableCount], () => "" + watchableCount.ref))
//     /*
//     watch<ComponentModel>([watchableCount], () =>
//         textNode("Value: " + watchableCount.ref)
//     )*/
// );

document.body.appendChild(model.node);
document.body.appendChild(modelJSX.node);
document.body.appendChild(managedInput.node);
document.body.appendChild(
    (
        <button onclick={() => console.log(watchableCount, contentIsShowing)}>
            log
        </button>
    ).node
);

let updateCount = new WatchableRef(0);
let globalValue = new WatchableRef("");

type RecursiveWatchableList = WatchableList<WatchableList<any>>;

function ArrayTest(list: RecursiveWatchableList) {
    return (
        <div>
            <label>
                Global Value:{" "}
                <input
                    oninput={e =>
                        (globalValue.ref = (e.currentTarget! as HTMLInputElement).value)
                    }
                    value={globalValue.$ref}
                />
            </label>
            <ul>
                {ListRender({
                    list,
                    children: (element, symbol) => (
                        <li>
                            {ArrayTest(element)}
                            <button
                                onclick={() => {
                                    list.remove(symbol);
                                }}
                            >
                                x
                            </button>
                        </li>
                    )
                })}
            </ul>
            <button onclick={() => list.push(new WatchableList<any>())}>
                +Elem
            </button>
        </div>
    );
}

let mainList = new WatchableList<any>();

mainList[watchable_watch](() => updateCount.ref++);

document.body.appendChild(
    (
        <div>
            Array Updates: {watch([updateCount], () => "" + updateCount.ref)}{" "}
        </div>
    ).node
);
document.body.appendChild(ArrayTest(mainList).node);

let demoWatchableObject = new WatchableObject({
    a: new WatchableRef(3),
    b: new WatchableRef(5)
});

document.body.appendChild(
    (
        <div>
            <div>
                a:{" "}
                {watch(
                    [demoWatchableObject.get("a")],
                    () => "" + demoWatchableObject.get("a").value!.ref
                )}
                <button
                    onclick={() => demoWatchableObject.get("a").value!.ref++}
                >
                    a++
                </button>
            </div>
            <div>
                b:{" "}
                {watch([demoWatchableObject.get("b")], () =>
                    demoWatchableObject.get("b").value
                        ? "" + demoWatchableObject.get("b").value!.ref
                        : "undefined"
                )}
                <button
                    onclick={() => demoWatchableObject.get("b").value!.ref++}
                >
                    b++
                </button>
            </div>
        </div>
    ).node
);

type WatchableObjectThing = WatchableObject<{
    string: WatchableRef<string>;
    visible: WatchableRef<boolean>;
    list: WatchableList<WatchableObjectThing>;
    removeConfirmVisible: WatchableRef<false>;
}>;

let testWatchableObject: WatchableObjectThing = new WatchableObject({
    string: new WatchableRef("item 1"),
    visible: new WatchableRef(true),
    list: new WatchableList(),
    removeConfirmVisible: new WatchableRef(false)
});

function ListOneItem(obj: WatchableObjectThing, onRemove: () => void) {
    let visible = obj.get("visible") as FakeEmitter<WatchableRef<boolean>>;
    let list = obj.get("list") as FakeEmitter<
        WatchableList<WatchableObjectThing>
    >;
    let string = obj.get("string") as FakeEmitter<WatchableRef<string>>;
    let removeConfirmVisible = obj.get("removeConfirmVisible") as FakeEmitter<
        WatchableRef<boolean>
    >;
    return (
        <div>
            <button onclick={() => (visible.value!.ref = !visible.value!.ref)}>
                {watch([visible], () => (visible.value!.ref ? "Hide" : "Show"))}
            </button>
            {watch([removeConfirmVisible], () =>
                !removeConfirmVisible.value!.ref ? (
                    <button
                        onclick={() => (removeConfirmVisible.value!.ref = true)}
                    >
                        Remove
                    </button>
                ) : (
                    <span>
                        Are you sure?{" "}
                        <button onclick={() => onRemove()}>Remove</button>
                        <button
                            onclick={() =>
                                (removeConfirmVisible.value!.ref = false)
                            }
                        >
                            Keep
                        </button>
                    </span>
                )
            )}
            {watch([visible], () =>
                visible.value!.ref ? (
                    <div>
                        <input
                            value={string.value!.ref}
                            oninput={e =>
                                (string.value!.ref = (e.currentTarget as HTMLInputElement).value)
                            }
                        />
                        <ul>
                            {ListRender({
                                list: list.value!,
                                children: (e, s) => (
                                    <li>
                                        {ListOneItem(e, () =>
                                            list.value!.remove(s)
                                        )}
                                    </li>
                                )
                            })}
                            <li>
                                <button
                                    onclick={() => {
                                        list.value!.push(
                                            new WatchableObject({
                                                string: new WatchableRef(
                                                    "item 1"
                                                ),
                                                visible: new WatchableRef(true),
                                                list: new WatchableList(),
                                                removeConfirmVisible: new WatchableRef(
                                                    false
                                                )
                                            })
                                        );
                                    }}
                                >
                                    +item
                                </button>
                            </li>
                        </ul>
                    </div>
                ) : (
                    undefined
                )
            )}
        </div>
    );
}

document.body.appendChild(
    ListOneItem(testWatchableObject, () =>
        alert("Cannot remove top level element")
    ).node
);

document.body.appendChild(
    (
        <button
            onclick={() =>
                console.log(
                    JSON.stringify(testWatchableObject, null, "\t"),
                    testWatchableObject
                )
            }
        >
            Log WatchableObject
        </button>
    ).node
);

let buttonIsShowing = new WatchableRef(true);
document.body.appendChild(
    (
        <div>
            {watch([buttonIsShowing], () =>
                buttonIsShowing.ref ? (
                    <button
                        onclick={() => {
                            window.startHighlightUpdates();
                            buttonIsShowing.ref = false;
                        }}
                    >
                        highlight updates
                    </button>
                ) : (
                    <div></div>
                )
            )}
        </div>
    ).node
);

function FunctionalComponent(props: { a: WatchableRef<string> }) {
    return (
        <div>
            <input
                value={props.a.$ref}
                oninput={e =>
                    (props.a.ref = (e.currentTarget as HTMLInputElement).value)
                }
            />
            {props.a.$ref}
        </div>
    );
}

document.body.appendChild(
    (
        <FunctionalComponent
            a={new WatchableRef("string goes here string  string string ")}
        />
    ).node
);
