console.log("It works!");

export const watchable_watchers = Symbol("watchers");
export const watchable_watch = Symbol("watch");
export const watchable_value = Symbol("value");
export const watchable_ref = Symbol("ref");
export const watchable_cb = Symbol("cb");

// note that we are going to have problems with watchers not getting unregistered. elements need to return destructors and these need to be called on element removal.

interface Watchable<T> {
    [watchable_watch](v: (v: T) => void): () => void; // watch(watcher) returns unwatcher
    [watchable_value](): T;
}

interface WatchableComponent extends Watchable<ComponentModel> {}

/*

let counter = Component([d.div("$$props.count")])

document.body.appendChild(counter.node());

model::

<div>
<button #click></button>
</div>

*/

type WrapWatchable<T> = T extends number | string | symbol | boolean
    ? WatchableRef<T>
    : T extends Watchable<any>
    ? T
    : { [key in keyof T]: WrapWatchable<T[key]> };

type ExistingComponentModel = {
    node: ChildNode /*[]*/;
    removeSelf: () => void;
};
type ComponentModel = ExistingComponentModel | string | WatchableComponent;

function isWatchable<T>(v: T | Watchable<T>): v is Watchable<T> {
    return !!(v as any)[watchable_watch];
}

function createComponent(
    c: ComponentModel,
    insert: (node: Node) => void
): { finalNode: Node; removeSelf: () => void } {
    if (typeof c === "string") {
        let textNode = document.createTextNode(c);
        insert(textNode);
        return { finalNode: textNode, removeSelf: () => textNode.remove() };
    }
    if (isWatchable(c)) {
        let finalNode = document.createTextNode(""); // nodes are inserted before this node
        insert(finalNode);
        let removalFunctions: (() => void)[] = [];
        let updateValue = (model: ComponentModel) => {
            // clear outdated nodes
            removalFunctions.map(rf => rf());
            removalFunctions = [];
            // create new nodes
            let { removeSelf } = createComponent(model, node =>
                finalNode.parentNode!.insertBefore(node, finalNode)
            );
            removalFunctions.push(removeSelf);
        };
        let unwatch = c[watchable_watch](updateValue);
        let currentModel = c[watchable_value]();
        updateValue(currentModel);
        return {
            finalNode,
            removeSelf: () => {
                unwatch();
                finalNode.remove();
                removalFunctions.map(rf => rf());
            }
        };
    }
    insert(c.node);
    return {
        finalNode: c.node,
        removeSelf: () => {
            c.node.remove();
            c.removeSelf();
        }
    };
}

const d = (
    componentName: string,
    props: {
        [key: string]:
            | string
            | number
            | ((...a: any[]) => void)
            | Watchable<string | number | ((...a: any[]) => void)>;
    },
    ...children: ComponentModel[]
): ExistingComponentModel => {
    let element = document.createElement(componentName);
    let removalHandlers: (() => void)[] = [];
    if (props)
        Object.keys(props).map(prop => {
            let a: any = props[prop];
            if (a[watchable_watch]) {
                removalHandlers.push(
                    a[watchable_watch]((v: any) => {
                        (element as any)[prop] = v;
                    })
                );
                let current = a[watchable_value]();
                (element as any)[prop] = current;
                return;
            }
            (element as any)[prop] = a;
        });
    if (children)
        children.map(c => {
            removalHandlers.push(
                createComponent(c, node => element.appendChild(node)).removeSelf
            );
        });
    return {
        node: element,
        removeSelf: () => removalHandlers.forEach(h => h())
    };
    // children:map child addChild(...)
    // props:map prop // find watch() functions (these can change props based on values changing)
    // bind value changes to watch
};

// type RealOrWatchable<T> = T | Watchable<T>;

const watchable_setup = Symbol("setup");
const watchable_emit = Symbol("emit");
const watchable_cleanup = Symbol("cleanup");
const watchable_cleanupfns = Symbol("cleanupfns");
const watchable_data = Symbol("data");

abstract class WatchableBase<T> implements Watchable<T> {
    [watchable_watchers]: ((v: T) => void)[] = [];
    [watchable_watch](watcher: (v: T) => void): () => void {
        if (this[watchable_watchers].length === 0) {
            this[watchable_setup]();
        }
        this[watchable_watchers].push(watcher);
        return () => {
            console.log("removing self", this[watchable_watchers], watcher);
            this[watchable_watchers] = this[watchable_watchers].filter(
                e => e !== watcher
            );
            if (this[watchable_watchers].length === 0) {
                this[watchable_cleanup]();
            }
            console.log("done", this[watchable_watchers], watcher);
        };
    }
    [watchable_emit](value: T) {
        this[watchable_watchers].map(w => w(value));
    }
    abstract [watchable_value](): T;
    abstract [watchable_setup](): void;
    abstract [watchable_cleanup](): void;
}

class WatchableDependencyList<T> extends WatchableBase<T> {
    private [watchable_cb]: () => T;
    private [watchable_data]: Watchable<any>[];
    private [watchable_cleanupfns]: (() => void)[] = [];
    constructor(data: Watchable<any>[], cb: () => T) {
        super();
        this[watchable_cb] = cb;
        this[watchable_data] = data;
    }
    [watchable_value]() {
        return this[watchable_cb]();
    }
    [watchable_setup]() {
        this[watchable_data].forEach(dataToWatch => {
            this[watchable_cleanupfns].push(
                dataToWatch[watchable_watch](() => {
                    // when any data changes
                    let valueToReturn = this[watchable_value](); // get our own value
                    this[watchable_emit](valueToReturn);
                })
            );
        });
    }
    [watchable_cleanup]() {
        this[watchable_cleanupfns].map(cfn => cfn());
    }
}

class WatchableRef<T> extends WatchableBase<void> {
    private [watchable_ref]: T;
    constructor(data: T) {
        super();
        this[watchable_ref] = data;
    }
    get ref() {
        return this[watchable_ref];
    }
    get $ref() {
        return watch([this], () => this[watchable_ref]);
    }
    set ref(nv: T) {
        this[watchable_ref] = nv;
        this[watchable_emit]();
    }
    [watchable_value]() {
        return undefined; // watchable refs actually have no value
    }
    [watchable_setup]() {}
    [watchable_cleanup]() {}
}

function watch<T>(data: Watchable<any>[], cb: () => T): Watchable<T> {
    return new WatchableDependencyList(data, cb);
}

// function Component<DataType>(
//     componentfn: (data: WrapWatchable<DataType>) => ComponentModel
// ) {
//     return (data: WrapWatchable<DataType>) => {
//         // only called when a component is initialized
//         let model = componentfn(data);
//         return undefined;
//     };
// }
//
// let counter = Component<{ count: number }>(data =>
//     d(
//         "div",
//         {
//             onclick: (e: any) => {
//                 data.count.ref++;
//             }
//         },
//         watch<ComponentModel>([data.count], () => ({
//             node: document.createTextNode("" + data.count.ref)
//         }))
//     )
// );

function textNode(v: string | Watchable<string>): ExistingComponentModel {
    let textValue = isWatchable(v) ? v[watchable_value]() : v;
    let node = document.createTextNode(textValue);
    let removalHandlers: (() => void)[] = [];
    if (isWatchable(v)) {
        removalHandlers.push(
            v[watchable_watch](nv => {
                node.nodeValue = nv;
            })
        );
    }
    return {
        node,
        removeSelf: () => {
            console.log("removing", removalHandlers);
            removalHandlers.map(h => h());
        }
    };
}

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

type RealOrWatchable<T> = T | Watchable<T>;

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

type OptionalProps<T> = { [key in keyof T]?: RealOrWatchable<T[key]> };

type TagNameToPropsMap = {
    [elemName in keyof HTMLElementTagNameMap]: OptionalProps<
        HTMLElementTagNameMap[elemName] & {
            children: ComponentModel[] | ComponentModel;
        }
    >;
};

declare global {
    namespace JSX {
        interface IntrinsicElements extends TagNameToPropsMap {}
        interface Element extends ExistingComponentModel {}
    }
}

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

type AddHandler<T extends Watchable<any>> = (
    symbol: symbol,
    prevSymbol: symbol | undefined
) => void;
type UpdateHandler<T extends Watchable<any>> = (
    // when an item updates
    symbol: symbol
) => void;
type MoveHandler<T extends Watchable<any>> = (
    // when an item moves
    prevSymbol: symbol | undefined,
    nextPrevSymbol: symbol | undefined
) => void;
type RemoveHandler<T extends Watchable<any>> = (
    symbol: symbol,
    prevSymbol: symbol | undefined
) => void;

let symbolKey = (symbol: symbol) => (symbol as unknown) as string; // typescript does not allow symbols to be used as keys, so we pretend they are strings

type WatchableListItem<T extends Watchable<any>> = {
    prev?: WatchableListItem<T>; // should this be symbol instead?
    self: T;
    symbol: symbol;
    next?: WatchableListItem<T>;
    removalHandler: () => void;
};

class WatchableList<T extends Watchable<any>> extends WatchableBase<void> {
    private __items: {
        [key: /*symbol*/ string]: WatchableListItem<T>;
    } = {};
    private __start?: WatchableListItem<T>;
    private __end?: WatchableListItem<T>;

    private __addHandlers: (AddHandler<T>)[] = [];
    private __updateHandlers: (UpdateHandler<T>)[] = [];
    private __removeHandlers: (RemoveHandler<T>)[] = [];

    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {
        // foreach and call removalHandler()
        throw new Error("Method not implemented.");
    }

    onAdd(handler: AddHandler<T>) {
        this.__addHandlers.push(handler);
        return () =>
            (this.__addHandlers = this.__addHandlers.filter(
                h => h !== handler
            ));
    }
    onUpdate(handler: UpdateHandler<T>) {
        this.__updateHandlers.push(handler);
        return () =>
            (this.__updateHandlers = this.__updateHandlers.filter(
                h => h !== handler
            ));
    }
    onRemove(handler: RemoveHandler<T>) {
        this.__removeHandlers.push(handler);
        return () =>
            (this.__removeHandlers = this.__removeHandlers.filter(
                h => h !== handler
            ));
    }

    insert(beforeSymbol: symbol | undefined, item: T) {
        let itemSymbol = Symbol("list item");
        let beforeItem = beforeSymbol
            ? this.__items[symbolKey(beforeSymbol)]
            : undefined;
        let nextItem = beforeItem ? beforeItem.next : this.__start;
        let resultItem: WatchableListItem<T> = {
            prev: beforeItem,
            self: item,
            symbol: itemSymbol,
            next: nextItem,
            removalHandler: item[watchable_watch](() => {
                this.__updateHandlers.forEach(h => h(itemSymbol));
                this[watchable_emit]();
            })
        };
        if (!beforeItem) {
            this.__start = resultItem;
        }
        if (!nextItem) {
            this.__end = resultItem;
        }
        this.__items[symbolKey(itemSymbol)] = resultItem;

        this.__addHandlers.forEach(h =>
            h(itemSymbol, beforeItem ? beforeItem.symbol : undefined)
        );
        this[watchable_emit]();
    }
    push(item: T) {
        this.insert(this.__end ? this.__end.symbol : undefined, item);
    }
    remove(symbol: symbol) {
        let item = this.__items[symbolKey(symbol)];
        if (item.prev) {
            item.prev.next = item.next;
        }
        if (item.next) {
            item.next.prev = item.prev;
        }
        if (this.__start === item) {
            this.__start = item.next;
        }
        if (this.__end === item) {
            this.__end = item.prev;
        }
        item.removalHandler();

        this.__removeHandlers.forEach(h =>
            h(symbol, item.prev ? item.prev.symbol : undefined)
        );
        this[watchable_emit]();
    }
    move(symbol: symbol, beforeSymbol: symbol) {
        // TEMPORARY::
        // instead, items should be moved properly and the right events should be emitted
        let { prev, self } = this.__items[symbolKey(symbol)];
        this.remove(symbol);
        this.insert(prev ? prev.symbol : undefined, self);
    }
    get(symbol: symbol) {
        return this.__items[symbolKey(symbol)].self;
    }
    forEach(cb: (item: T, index: number, symbol: symbol) => void) {
        let currentItem = this.__start;
        let i = 0;
        while (currentItem) {
            cb(currentItem.self, i, currentItem.symbol);
            currentItem = currentItem.next;
            i++;
        }
    }
}

function ListRender<T extends Watchable<any>>(props: {
    list: WatchableList<T>;
    children: (e: T, s: symbol) => JSX.Element;
    // index::
    // what to do about index?
    // maybe make it a watchable number as part of T
    // index is definitely necessary but we shouldn't have to rerender everything just because index
}): JSX.Element {
    let result = <div></div>; // we don't have intrinsics yet but they are possible to add
    let removalHandlers = [];
    let nodeInformation: {
        [key: string]: {
            symbol: symbol;
            removeSelf: () => void;
            finalNode: Node;
        };
    } = {};
    // add pre-existing items ::
    props.list.forEach((item, index, symbol) => {
        let { finalNode, removeSelf } = createComponent(
            props.children(item, symbol),
            node => result.node.appendChild(node)
        );
        nodeInformation[(symbol as unknown) as string] = {
            removeSelf,
            finalNode,
            symbol
        };
    });
    // handle changes
    removalHandlers.push(
        props.list.onAdd((symbol, prevSymbol) => {
            let infoBefore = prevSymbol
                ? nodeInformation[symbolKey(prevSymbol)]
                : undefined;
            let nodeInsertFn: (node: Node) => void;
            if (infoBefore) {
                let next = infoBefore.finalNode.nextSibling;
                if (next) {
                    nodeInsertFn = node => result.node.insertBefore(node, next);
                } else {
                    nodeInsertFn = node => result.node.appendChild(node);
                }
            } else {
                nodeInsertFn = node =>
                    ((result.node as unknown) as ParentNode).prepend(node);
            }
            let item = props.list.get(symbol);
            let { finalNode, removeSelf } = createComponent(
                props.children(item, symbol),
                nodeInsertFn // !!!!!!!!!!! maybe instead of all this work to define nodeInsertFn here, we could have nodeBefore as a parameter to createComponent?
            );
            nodeInformation[symbolKey(symbol)] = {
                removeSelf,
                finalNode,
                symbol
            };
        })
    );
    removalHandlers.push(
        props.list.onRemove((symbol, prevSymbol) => {
            let nodeInfo = nodeInformation[symbolKey(symbol)];
            nodeInfo.removeSelf();
            delete nodeInformation[symbolKey(symbol)];
        })
    );
    return result;
}

function makeWatchablesFromBuiltins() {}

/*
<ArrayRender array={watchablearray}>
    {element => (
        <li>
            <input
                value={element.$ref}
                onInput={e =>
                    (element.ref = e.currentTarget.value)
                }
            />
        </li>
    )}
</ArrayRender>
*/

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

// let counter = Component<{ count: number }>(data => d.div(data.count));
