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
    item: T, // from {prev, next}
    to: { prevSymbol?: symbol; thisSymbol: symbol; nextSymbol?: symbol }
) => void;
type UpdateHandler<T extends Watchable<any>> = (
    item: T,
    from: { prevSymbol?: symbol; thisSymbol: symbol; nextSymbol?: symbol },
    to: { prevSymbol?: symbol; thisSymbol: symbol; nextSymbol?: symbol }
) => void;
type RemoveHandler<T extends Watchable<any>> = (
    item: T,
    from: { prevSymbol?: symbol; thisSymbol: symbol; nextSymbol?: symbol }
) => void;

class WatchableArray<T extends Watchable<any>> extends WatchableBase<void> {
    private __items: { value: T; remove: () => void; symbol: symbol }[] = [];
    private __addHandlers: (AddHandler<T>)[] = [];
    private __updateHandlers: (UpdateHandler<T>)[] = [];
    private __removeHandlers: (RemoveHandler<T>)[] = [];
    [watchable_value](): void {
        return undefined; // watchable arrays actually have no value
    }
    [watchable_setup](): void {
        // throw new Error("Method not implemented.");
    }
    [watchable_cleanup](): void {
        // throw new Error("Method not implemented.");
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
    push(newItem: T) {
        let newItemValue = {
            value: newItem,
            remove: newItem[watchable_watch](() => {
                this[watchable_emit]();
            }),
            symbol: Symbol("item")
        };
        let prevItem = this.__items[this.__items.length - 1];
        this.__items.push(newItemValue);
        this.__addHandlers.forEach(h =>
            h(newItemValue.value, {
                prevSymbol: prevItem ? prevItem.symbol : undefined,
                thisSymbol: newItemValue.symbol,
                nextSymbol: undefined
            })
        );
        this[watchable_emit]();
    }
    forEach(cb: (it: T, i: number, symbol: symbol) => void) {
        this.__items.forEach((item, i) => cb(item.value, i, item.symbol));
    }
    get ref() {
        return this.__items.map(it => ({ symbol: it.symbol, value: it.value }));
    }
    set ref(items: ({ symbol: symbol; value: T })[]) {
        let existingItems: {
            [key: /*symbol*/ string]: {
                value: T;
                remove: () => void;
                index: number;
            };
        } = {};
        this.__items.forEach(
            (item, index) =>
                (existingItems[(item.symbol as unknown) as string] = {
                    ...item,
                    index
                })
        );
        let newItems: {
            [key: /*symbol*/ string]: {
                value: T;
                index: number;
            };
        } = {};
        items.forEach((item, index) => {
            // new items need to be created
            // existing items need to be updated
            newItems[(item.symbol as unknown) as string] = {
                ...item,
                index
            };
        });
    }
    // diffing, finds out which items are new, modified, moved, ...
    overwrite(key: (obj: T) => string, newArray: T[]) {
        // one of the few things that does diffing
        let existingItems: {
            [key: string]: { value: T; remove: () => void; index: number };
        } = {};
        this.__items.forEach(
            (item, index) =>
                (existingItems[key(item.value)] = { ...item, index })
        );
        let newItems: {
            [key: string]: { value: T; index: number };
        } = {};
        newArray.forEach(
            (item, index) => (newItems[key(item)] = { value: item, index })
        );
        // diff and find:: items to remove, items to add, items to move
        // set this.__items to the new list
        // ---- usage ----
        // overwrite the entire list without deleting and recreating items
        // for example: array.overwrite(i => i.key, array.filter(i => i != itemToDelete))
    }
    /*item_add :: add item, add watcher to run our own emit*/
    /*item_remove :: remove item, remove watcher*/
    /*on anymodify,add,move,remove*/
}

function ArrayRender<T extends Watchable<any>>(props: {
    array: WatchableArray<T>;
    children: (e: T, s: symbol) => JSX.Element;
    // index::
    // what to do about index?
    // maybe make it a watchable number as part of T
    // index is definitely necessary but we shouldn't have to rerender everything just because index
}): JSX.Element {
    let result = <div></div>; // we don't have intrinsics yet but they are possible to add
    let removalHandlers = [];
    let nodeInformation: {
        [key: string]: { value: T; removeSelf: () => void; finalNode: Node };
    } = {};
    // add pre-existing items ::
    props.array.forEach((item, index, symbol) => {
        let { finalNode, removeSelf } = createComponent(
            props.children(item, symbol),
            node => result.node.appendChild(node)
        );
        nodeInformation[(symbol as unknown) as string] = {
            removeSelf,
            finalNode,
            value: item
        };
    });
    // handle changes
    removalHandlers.push(
        props.array.onAdd((item, { prevSymbol, thisSymbol, nextSymbol }) => {
            let infoBefore = nodeInformation[(prevSymbol as unknown) as string];
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
            let { finalNode, removeSelf } = createComponent(
                props.children(item, thisSymbol),
                nodeInsertFn // !!!!!!!!!!! maybe instead of all this work to define nodeInsertFn here, we could have nodeBefore as a parameter to createComponent?
            );
            nodeInformation[(thisSymbol as unknown) as string] = {
                removeSelf,
                finalNode,
                value: item
            };
        })
    );
    // todo onupdate
    // if prev.thisSymbol !== curr.thisSymbol
    //// ??? magic (not sure if it's possible to move a node model unless it contains all the elements)
    //// for now, probably just delete and recreate the node
    removalHandlers.push(
        props.array.onRemove((item, { prevSymbol, thisSymbol, nextSymbol }) => {
            let nodeInfo = nodeInformation[(thisSymbol as unknown) as string];
            nodeInfo.removeSelf();
            delete nodeInformation[(thisSymbol as unknown) as string];
        })
    );
    return result;
}

function makeWatchablesFromBuiltins() {}

let watchablearray = new WatchableArray<WatchableRef<string>>();

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

let updateCount = 0;

document.body.appendChild(
    (
        <div>
            <div>
                Array Updates:{" "}
                {watch([watchablearray], () => "" + updateCount++)}
            </div>
            <ul>
                {ArrayRender({
                    array: watchablearray,
                    children: (element, symbol) => (
                        <li>
                            <input
                                value={element.$ref}
                                oninput={e =>
                                    (element.ref = (e.currentTarget! as any).value)
                                }
                            />
                            <span>{element.$ref}</span>
                            <button
                                onclick={() => {
                                    watchablearray.ref = watchablearray.ref.filter(
                                        e => e.symbol !== symbol
                                    );
                                }}
                            >
                                x
                            </button>
                        </li>
                    )
                })}
            </ul>
            <button
                onclick={() =>
                    watchablearray.push(new WatchableRef("new element"))
                }
            >
                +Elem
            </button>
        </div>
    ).node
);

// let counter = Component<{ count: number }>(data => d.div(data.count));
