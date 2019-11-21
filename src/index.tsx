console.log("It works!");

import "./drawBoxAroundElement";

export const watchable_watchers = Symbol("watchers");
export const watchable_watch = Symbol("watch");
export const watchable_value = Symbol("value");
export const watchable_ref = Symbol("ref");
export const watchable_cb = Symbol("cb");

declare global {
    interface Window {
        onNodeUpdate: (node: Node) => void;
        startHighlightUpdates: () => void;
    }
}

window.onNodeUpdate = (node: Node) => console.log("NODE UPDATED:", node);

let doNextTick: (() => void)[] = [];
function nextTick(cb: () => void) {
    if (!doNextTick.length) {
        setTimeout(() => {
            doNextTick.forEach(dnt => dnt());
            doNextTick = [];
        }, 0);
    }
    doNextTick.push(cb);
}

// note that we are going to have problems with watchers not getting unregistered. elements need to return destructors and these need to be called on element removal.

export interface Watchable<T> {
    [watchable_watch](v: (v: T) => void): () => void; // watch(watcher) returns unwatcher
    [watchable_value](): T;
}

export interface WatchableComponent extends Watchable<ComponentModel> {}

export type WrapWatchable<T> = T extends number | string | symbol | boolean
    ? WatchableRef<T>
    : T extends Watchable<any>
    ? T
    : { [key in keyof T]: WrapWatchable<T[key]> };

export type ExistingComponentModel = {
    node: ChildNode /*[]*/;
    removeSelf: () => void;
};
export type ComponentModel =
    | ExistingComponentModel
    | string
    | WatchableComponent;

export function isWatchable<T>(v: T | Watchable<T>): v is Watchable<T> {
    return !!(v as any)[watchable_watch];
}

export function createComponent(
    c: ComponentModel,
    insert: (node: Node) => void
): { finalNode: Node; removeSelf: () => void } {
    if (typeof c !== "object") {
        let textNode = document.createTextNode("" + c);
        insert(textNode);
        window.onNodeUpdate(textNode);
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
        window.onNodeUpdate(finalNode);
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
    window.onNodeUpdate(c.node);
    return {
        finalNode: c.node,
        removeSelf: () => {
            c.node.remove();
            c.removeSelf();
        }
    };
}

export const d = (
    componentName: string | ((props: {}) => ExistingComponentModel),
    props: {
        [key: string]:
            | string
            | number
            | ((...a: any[]) => void)
            | Watchable<string | number | ((...a: any[]) => void)>;
    },
    ...children: ComponentModel[]
): ExistingComponentModel => {
    if (typeof componentName === "function") {
        return componentName({ children, ...props });
    }
    let element = document.createElement(componentName);
    let removalHandlers: (() => void)[] = [];
    let nodeCreationHandler: Function | undefined;
    if (props)
        Object.keys(props).map(prop => {
            if (prop === "nodecreated") {
                nodeCreationHandler = props[prop] as Function;
                return;
            }
            let a: any = props[prop];
            if (a[watchable_watch]) {
                removalHandlers.push(
                    a[watchable_watch]((v: any) => {
                        if ((element as any)[prop] !== v)
                            (element as any)[prop] = v;
                        // notify prop update
                        window.onNodeUpdate(element);
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
    window.onNodeUpdate(element);
    if (nodeCreationHandler) nodeCreationHandler(element); // maybe nodecreationhandler should return removal functions
    return {
        node: element,
        removeSelf: () => removalHandlers.forEach(h => h())
    };
    // children:map child addChild(...)
    // props:map prop // find watch() functions (these can change props based on values changing)
    // bind value changes to watch
};

export let React = { createElement: d };

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
        // next tick:
        nextTick(() => this[watchable_watchers].map(w => w(value)));
    }
    abstract [watchable_value](): T;
    abstract [watchable_setup](): void;
    abstract [watchable_cleanup](): void;
}

export class WatchableDependencyList<T> extends WatchableBase<T> {
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

export class WatchableRef<T> extends WatchableBase<void> {
    private [watchable_ref]: T;
    constructor(data: T) {
        super();
        this[watchable_ref] = data;
    }
    get $ref() {
        return this[watchable_ref];
    }
    set $ref(nv: T) {
        this[watchable_ref] = nv;
        this[watchable_emit]();
    }
    [watchable_value]() {
        return undefined; // watchable refs actually have no value
    }
    [watchable_setup]() {}
    [watchable_cleanup]() {}
    toJSON() {
        return this.$ref;
    }
}

export function watch<T>(data: Watchable<any>[], cb: () => T): Watchable<T> {
    return new WatchableDependencyList(data, cb);
}

export function textNode(
    v: string | Watchable<string>
): ExistingComponentModel {
    let textValue = isWatchable(v) ? v[watchable_value]() : v;
    let node = document.createTextNode(textValue);
    let removalHandlers: (() => void)[] = [];
    if (isWatchable(v)) {
        removalHandlers.push(
            v[watchable_watch](nv => {
                if (node.nodeValue !== nv) node.nodeValue = nv;
                window.onNodeUpdate(node);
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

export type RealOrWatchable<T> = T | Watchable<T>;

export type OptionalProps<T> = { [key in keyof T]?: RealOrWatchable<T[key]> };

export type TagNameToPropsMap = {
    [elemName in keyof HTMLElementTagNameMap]: OptionalProps<
        HTMLElementTagNameMap[elemName] & {
            children: ComponentModel[] | ComponentModel;
            nodecreated: (node: HTMLElementTagNameMap[elemName]) => void;
        }
    >;
};

declare global {
    namespace JSX {
        interface IntrinsicElements extends TagNameToPropsMap {}
        interface Element extends ExistingComponentModel {}
    }
}

export type AddHandler<T extends Watchable<any>> = (
    symbol: symbol,
    prevSymbol: symbol | undefined
) => void;
export type UpdateHandler<T extends Watchable<any>> = (
    // when an item updates
    symbol: symbol
) => void;
export type MoveHandler<T extends Watchable<any>> = (
    // when an item moves
    prevSymbol: symbol | undefined,
    nextPrevSymbol: symbol | undefined
) => void;
export type RemoveHandler<T extends Watchable<any>> = (
    symbol: symbol,
    prevSymbol: symbol | undefined
) => void;

let symbolKey = (symbol: symbol) => (symbol as unknown) as string; // typescript does not allow symbols to be used as keys, so we pretend they are strings

export type WatchableListItem<T extends Watchable<any>> = {
    prev?: WatchableListItem<T>; // should this be symbol instead?
    self: T;
    symbol: symbol;
    next?: WatchableListItem<T>;
    removalHandler: () => void;
};

export class WatchableList<T extends Watchable<any>> extends WatchableBase<
    void
> {
    private __items: {
        [key: /*symbol*/ string]: WatchableListItem<T>;
    } = {};
    private __start?: WatchableListItem<T>;
    private __end?: WatchableListItem<T>;

    private __addHandlers: AddHandler<T>[] = [];
    private __updateHandlers: UpdateHandler<T>[] = [];
    private __removeHandlers: RemoveHandler<T>[] = [];

    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {
        let currentItem = this.__start;
        while (currentItem) {
            currentItem.removalHandler();
            currentItem = currentItem.next;
        }
    }

    // !!!!!!!! needs list constructor

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
        } else {
            beforeItem.next = resultItem;
        }
        if (!nextItem) {
            this.__end = resultItem;
        } else {
            nextItem.prev = resultItem;
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
    toJSON() {
        let res: T[] = [];
        this.forEach(i => res.push(i));
        return res;
    }
}

export function ListRender<T extends Watchable<any>>(props: {
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

export function makeWatchablesFromBuiltins() {}

export class FakeEmitter<T extends Watchable<void>> {
    constructor() {}
    get $ref() {
        // return this.realObject.$ref
    }
    set $ref(v: any) {
        // this.realObject.$ref = v;
        // what if realobject is number and v is object
    }
}

export class WatchableObject<
    T extends { [key: string]: Watchable<void> | undefined }
> extends WatchableBase<void> {
    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {}

    private __object: { [key in keyof T]: FakeEmitter<any> };

    constructor(initial: T) {
        super();
        this.__object = {} as any;
    }
    $get(v: keyof T) {
        // returns something
        if (this.__object[v]) {
            return this.__object[v];
        }
        this.__object[v] = new FakeEmitter();
        // fakeemitter::watchUnused::delete this.__object[v]
    }
}
// DEMO::
// $obj.$get("a").ref = 5;
// that updates the fakeemitter at "a" to contain a WatchableRef = 5
// how?
// ?

// export class WatchableObject<
//     T extends { [key: string]: Watchable<void> | undefined }
// > extends WatchableBase<void> {
//     [watchable_value](): void {}
//     [watchable_setup](): void {
//         // throw new Error("Method not implemented.");
//     }
//     [watchable_cleanup](): void {
//         // throw new Error("Method not implemented.");
//     }
//     private __object: {
//         [key in keyof T]: {
//             removalHandler: () => void;
//             fakeEmitter: FakeEmitter<T[key]>;
//         };
//     };
//     constructor(object: T) {
//         super();
//         //@ts-ignore
//         this.__object = {};
//         // !!!!!!!!!!!!! TODO!!!
//         Object.keys(object).forEach(k => {
//             //@ts-ignore
//             this.create(k, object[k]);
//         });
//     }
//     create(key: keyof T, value: T[typeof key] | undefined) {
//         // add a watcher on the fakeemitter to delete(key) when it is cleaned up
//         // :::
//         // someone may get a value that does not exist
//         // in this situation, we need to create a temporary fakeEmitter
//         // if the value gets set, that's fine.
//         // once everyone watching the fakeemitter is done, if there is no value,
//         // it needs to be cleaned up.
//         // Maybe the fakeemitter can have a reference to this that it calls
//         // on cleanup if it === undefined
//         // Keep in mind we need to differentiate between
//         // {a: undefined}
//         // and
//         // {}
//         let fakeEmitter = new FakeEmitter<T[typeof key]>();
//         fakeEmitter.ref = value;
//         let removalHandler = fakeEmitter[watchable_watch](() => {
//             // !!!!!!!! emit create event
//             this[watchable_emit]();
//         });
//         // fakeEmitter.onCleanup() // if(it === undefined) // cleanup
//         let newValue = { removalHandler, fakeEmitter };
//         this.__object[key] = newValue;
//     }
//     get v(): { [key in keyof T]: FakeEmitter<T[key]> } {
//         return new Proxy(
//             {},
//             {
//                 get: (q, v) => {
//                     if (typeof v === "string") return this.get(v as keyof T);
//                     return (this as any)[v];
//                 }
//             }
//         ) as { [key in keyof T]: FakeEmitter<T[key]> };
//     }
//     get<Q extends keyof T>(key: Q): FakeEmitter<T[Q]> {
//         // return new ObjectValueGetter
//         let value = this.__object[key];
//         if (!value) {
//             this.create(key, undefined);
//             return this.__object[key].fakeEmitter;
//         }
//         return value.fakeEmitter;
//     }
//     set(key: keyof T, value: T[typeof key]) {
//         if (this.__object[key]) {
//             this.__object[key].fakeEmitter.ref = value; // fakeemitter will handle event emitting
//         } else {
//             this.create(key, value);
//         }
//     }
//     delete(key: keyof T) {
//         if (this.__object[key]) {
//             this.__object[key].fakeEmitter; // !!!!!!!!!!!!! tell fakeemitter it should delete once all its watchers are cleared
//         }
//     }
//     toJSON() {
//         let resObject: {
//             [key in keyof T]?: FakeEmitter<T[key]>;
//         } = {};
//         Object.keys(this.__object).forEach(
//             key => (resObject[key as keyof T] = this.__object[key].fakeEmitter)
//         );
//         return resObject;
//     }
// }
