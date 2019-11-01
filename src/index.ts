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
type ComponentModel = ExistingComponentModel | WatchableComponent;

function isWatchable<T>(v: T | Watchable<T>): v is Watchable<T> {
    return !!(v as any)[watchable_watch];
}

function createComponent(
    c: ComponentModel,
    parent: ChildNode
): { finalNode: Node; removeSelf: () => void } {
    if (isWatchable(c)) {
        let finalNode = document.createTextNode(""); // nodes are inserted before this node
        parent.appendChild(finalNode);
        let removalFunctions: (() => void)[] = [];
        let updateValue = (model: ComponentModel) => {
            // clear outdated nodes
            removalFunctions.map(rf => rf());
            removalFunctions = [];
            // create new nodes
            let { removeSelf } = createComponent(model, parent);
            removalFunctions.push(removeSelf);
        };
        c[watchable_watch](updateValue);
        let currentModel = c[watchable_value]();
        updateValue(currentModel);
        return {
            finalNode,
            removeSelf: () => {
                finalNode.remove();
                removalFunctions.map(rf => rf());
            }
        };
    }
    parent.appendChild(c.node);
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
    children.map(c => {
        removalHandlers.push(createComponent(c, element).removeSelf);
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
        this[watchable_data].map(dataToWatch => {
            this[watchable_cleanupfns].push(
                dataToWatch[watchable_watch](() => {
                    // when any data changes
                    let valueToReturn = this[watchable_value](); // get our own value
                    this[watchable_watchers].map(watcher =>
                        watcher(valueToReturn)
                    ); // emit our value
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
    set ref(nv: T) {
        this[watchable_ref] = nv;
        this[watchable_watchers].map(watcher => watcher());
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

document.body.appendChild((model as any).node);

// let counter = Component<{ count: number }>(data => d.div(data.count));
