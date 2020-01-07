// diffing tutorial (to prevent the use of keys)
// : each item (set [Symbol.diffhelper] =Symbol("v"))
// now they can be added to a list properly

export declare let $bind: never;

function nextTick(cb: () => void) {
    setTimeout(() => cb(), 0);
}

export const is_watchable = Symbol("is watchable");

export const should_be_raw = Symbol("should be raw");

export type RemovalHandler = (() => void) & { __isRemovalHandler: true };

export type WatcherCB = () => void;

export interface WatchableBase<T> {
    _setup?(): void;
    _teardown?(): void;
}
export abstract class WatchableBase<T> {
    watchers: WatcherCB[] = [];
    abstract get $ref(): T;
    abstract set $ref(v: T);
    watch(watcher: WatcherCB, deep?: boolean): RemovalHandler {
        if (this.watchers.length === 0) {
            // setup
            this._setup && this._setup();
        }
        this.watchers.push(watcher);
        return (() => {
            this.watchers = this.watchers.filter(e => e !== watcher);
            if (this.watchers.length === 0) {
                // cleanup
                this._teardown && this._teardown();
            }
        }) as RemovalHandler;
    }
    emit() {
        console.log("emitting for watchers", this.watchers);
        this.watchers.forEach(w => w());
    }
    get [is_watchable]() {
        return true;
    }
}

// !!!!!!!!!!!!!! possible memory leak: unused fakewatchables need to be removed when no one is watching them anymore

export class FakeWatchable extends WatchableBase<any> {
    thing: any;
    parent: WatchableBase<any>;
    constructor(thing: any, parent: WatchableBase<any>) {
        super();
        if (typeof thing === "function") {
            thing = thing.bind(parent.$ref);
        }
        this.thing = thing;
        this.parent = parent;
    }
    get $ref() {
        return this.thing;
    }
    set $ref(_nv: any) {
        throw new Error("Cannot set ref value of fakewatchable");
    }
    $get(v: string) {
        return new FakeWatchable(this.thing[v], this);
    }
    watch(watcher: WatcherCB) {
        return this.parent.watch(watcher);
    }
}

export class WatchableThing<T> extends WatchableBase<T> {
    private __v!: any;
    isUnused: boolean;
    constructor(v: T, isUnused = false) {
        super();
        this.$ref = v;
        this.isUnused = isUnused;
        // !!!!! if(isWatchable(v)) {
        //   watch[v] and add to watchable_cleanup
        // }
    }
    set $ref(nv: any) {
        // !!!!!!!!!!!!!!!!!!!!!!!! emit to any above us (highest first)
        // !!!!!!!!!!!!!!!!!!!!!!!! ^ the above should only happen to special watchers (forex a.b || $deep)
        this.emit(); // emit before anything under us potentially emits
        this.isUnused = false;
        // if(self instanceof list) // do stuff
        if (nv && nv[should_be_raw]) {
            // instead of manual if statements, why not have a proprety that says things
            // this.__v.$ref = nv;
            this.__v = nv;
            return;
        }
        if (typeof this.__v === "object" && typeof nv === "object") {
            // if is array, good luck...
            let existingKeys: { [key: string]: WatchableThing<any> } = {
                ...this.__v,
            };
            Object.keys(nv).forEach(key => {
                let value = nv[key];
                this.$get(key).$ref = value;
                delete existingKeys[key];
            });
            Object.keys(existingKeys).forEach(key => {
                let value = existingKeys[key];
                value.$ref = undefined;
                value.isUnused = true;
            });
            return;
        }
        if (typeof nv === "object") {
            this.__v = {};
            Object.keys(nv).forEach(key => {
                let value = nv[key];
                this.$get(key).$ref = value;
            });
            return;
        }
        this.__v = nv;
    }
    get $ref() {
        console.log("DID GET VALUE OF ", this);
        if (this.__v && this.__v[should_be_raw]) {
            // if this.__v[some_property]
            return this.__v;
        }
        if (typeof this.__v === "object") {
            let newObject: any = {};
            Object.keys(this.__v).forEach(key => {
                let value = this.__v[key].$ref;
                newObject[key] = value; // !!!!!!! if value is temporary, ignore it
            });
            return newObject;
        }
        return this.__v;
    }
    $get(v: string): WatchableBase<any> {
        console.log("$get was used with ", v);
        if (this.__v && this.__v[should_be_raw]) {
            return new FakeWatchable((this.__v as any)[v], this);
        }
        if (typeof this.__v === "object") {
            if (!(v in this.__v)) {
                this.__v[v] = new WatchableThing(undefined, true);
                return this.__v[v];
            }
            let value = (this.__v as any)[v];
            return value;
        } else {
            let val = (this.__v as any)[v];
            if (val[is_watchable]) {
                return val;
            }
            let value = new FakeWatchable(val, this);
            return value;
        }
    }
    toJSON() {
        return this.$ref;
    }
}

type ListNode<T> = {
    prev?: symbol;
    self: WatchableThing<T>;
    symbol: symbol;
    next?: symbol;
    removeSelf: RemovalHandler;
};

export let symbolKey = (v: symbol): string => (v as unknown) as string;

type AddCB<T> = (
    item: WatchableThing<T>,
    o: { before?: symbol; symbol: symbol; after?: symbol },
) => void;
type RemoveCB = (o: {
    before?: symbol;
    symbol: symbol;
    after?: symbol;
}) => void;

// make a real array wrapper that uses maps to diff update
// let $a = [1,2,3,1];
// $a = $a.filter(q => q === 1);
// emit remove 2 with Array[1,1]
// emit remove 3 with Array[1,1]

// TODO guess what maps exist
// use the object itself as keys
// will be helpful for diff set and remove the requirement to use symbol keys so you can just pass the object (list.forEach(el => list.remove(el))) and still have constant time. might make more work for the garbage collecter but I don't know anything about how the javascript garbage collector works so idk
export class List<T> {
    [should_be_raw]: true = true;
    private __first?: symbol;
    private __items: { [key: string]: ListNode<T> };
    private __last?: symbol;
    private __length: WatchableThing<any>;
    private __onAdd: AddCB<T>[];
    private __onRemove: RemoveCB[];
    constructor(items: T[]) {
        this.__items = {};
        this.__onAdd = [];
        this.__onRemove = [];
        this.__length = $.createWatchable(0);
        items.forEach(item => this.push(item));
    }
    onAdd(cb: AddCB<T>) {
        this.__onAdd.push(cb);
        return () => (this.__onAdd = this.__onAdd.filter(v => v !== cb));
    }
    onRemove(cb: RemoveCB) {
        this.__onRemove.push(cb);
        return () => (this.__onRemove = this.__onRemove.filter(v => v !== cb));
    }
    insert(
        o: { after: symbol | undefined } | { before: symbol | undefined },
        item: T,
    ) {
        let thisItemSymbol = Symbol("new item");
        let watchableItem = $.createWatchable(item);

        let beforeItemSymbol =
            "after" in o
                ? o.after
                : o.before
                ? this.__items[symbolKey(o.before)].prev
                : this.__last;
        let beforeItem = beforeItemSymbol
            ? this.__items[symbolKey(beforeItemSymbol)]
            : undefined;

        let afterItemSymbol = beforeItem ? beforeItem.next : this.__first;
        let afterItem = afterItemSymbol
            ? this.__items[symbolKey(afterItemSymbol)]
            : undefined;

        let thisItem: ListNode<T> = {
            prev: beforeItemSymbol,
            next: afterItemSymbol,
            self: watchableItem,
            symbol: thisItemSymbol,
            removeSelf: (() => {}) as RemovalHandler,
        };

        if (beforeItem) {
            beforeItem.next = thisItemSymbol;
        } else {
            this.__first = thisItemSymbol;
        }

        if (afterItem) {
            afterItem.prev = thisItemSymbol;
        } else {
            this.__last = thisItemSymbol;
        }

        this.__items[symbolKey(thisItemSymbol)] = thisItem;

        this.__length.$ref++;
        nextTick(() =>
            this.__onAdd.forEach(oa =>
                oa(watchableItem, {
                    before: beforeItemSymbol,
                    after: afterItemSymbol,
                    symbol: thisItemSymbol,
                }),
            ),
        );
        // next tick, emit add event
    }
    remove(itemSymbol: symbol) {
        let item = this.__items[symbolKey(itemSymbol)];
        let prevItem = this.__items[symbolKey(item.prev!)] as
            | ListNode<T>
            | undefined;
        let nextItem = this.__items[symbolKey(item.next!)] as
            | ListNode<T>
            | undefined;
        if (prevItem) prevItem.next = item.next;
        if (nextItem) nextItem.prev = item.prev;
        if (!prevItem) this.__first = item.next;
        if (!nextItem) this.__last = item.prev;

        nextTick(() =>
            this.__onRemove.forEach(or =>
                or({
                    before: item.prev,
                    after: item.next,
                    symbol: item.symbol,
                }),
            ),
        );
    }
    forEach(cb: (item: T, symbol: symbol) => void) {
        let currentSymbol = this.__first;
        while (currentSymbol) {
            let item = this.__items[symbolKey(currentSymbol)];
            cb((item.self as unknown) as T, item.symbol);
            currentSymbol = item.next;
        }
        return;
    }
    array() {
        let resarr: T[] = [];
        this.forEach(item => resarr.push(item));
        return resarr;
    }
    updateDiff(_nv: T[]) {
        // setHelperSymbol = Symbol("set helper")
        // on each item, set a sethelpersymbol
        // use this to store values in a {} and diff
        // o(n) probably whatever that means. or o(3n) if that exists.
        throw new Error("list diff set is not supported yet");
    }
    push(item: T) {
        this.insert({ after: this.__last }, item);
    }
    unshift(item: T) {
        this.insert({ before: this.__first }, item);
    }
    get length(): number {
        return (this.__length as unknown) as number;
    }
}

type WDLCallback<T> = (
    previousData: { ref: any },
    previousValue: { ref: T } | undefined,
) => T;
export class WatchableDependencyList<T> extends WatchableBase<T> {
    private dependencyList: WatchableBase<any>[];
    private getValue: WDLCallback<T>;
    private previousData: { ref: any } = { ref: {} };
    private removalHandlers: RemovalHandler[] = [];
    private savedReturnValue: { ref: T } | undefined = undefined;
    constructor(
        dependencyList: WatchableBase<any>[],
        getValue: WDLCallback<T>,
    ) {
        super();
        this.dependencyList = dependencyList;
        this.getValue = getValue;
    }
    _setup() {
        this.dependencyList.forEach(item =>
            this.removalHandlers.push(
                item.watch(() => {
                    console.log("item watch emitted");
                    this.emit();
                }),
            ),
        );
    }
    _teardown() {
        console.log("tearing down up watcher for", this.removalHandlers);
        this.removalHandlers.forEach(rh => rh());
    }
    get $ref(): T {
        let value = this.getValue(this.previousData, this.savedReturnValue);
        this.savedReturnValue = { ref: value };
        return value; // dom will check strict equality so if a new node is created it will know there is nothing to do // <-- the opposite
    }
    set $ref(v: T) {
        throw new Error("Cannot set value of watchable dependency list.");
    }
}

export const $ = {
    createWatchable: (v: any) => new WatchableThing(v),
    list<T>(items: T[]): List<T> {
        return new List(items);
    },
    watch<T>(dependencyList: WatchableBase<any>[], getValue: WDLCallback<T>) {
        return new WatchableDependencyList(dependencyList, getValue);
    },
};

export function isWatch<T>(v: T | WatchableBase<T>): v is WatchableBase<T> {
    return !!(v as any)[is_watchable];
}

// export interface Watchable {
//     watch(v: () => void): () => void; // watch(watcher) returns unwatcher
// }

export function objectShallowDiff(
    prev: { [key: string]: any },
    curr: { [key: string]: any },
) {
    let propertyChangeMap = new Map<
        string,
        {
            state: "removed" | "added" | "changed" | "unchanged";
            value: any;
        }
    >();
    Object.entries(curr).forEach(([key, value]) => {
        propertyChangeMap.set(key, { state: "added", value });
    });
    Object.entries(prev).forEach(([key, value]) => {
        let cm = propertyChangeMap.get(key);
        if (cm) {
            if (cm.value === value) cm.state = "unchanged";
            else cm.state = "changed";
        } else {
            propertyChangeMap.set(key, {
                state: "removed",
                value: undefined,
            });
        }
    });
    let resultMap = new Map<
        string,
        "removed" | "added" | "changed" | "unchanged"
    >();
    // it might be nice to return propertyChangeMap directly but that would require lots of typescript stuff so that this function knows the types of the objects
    for (let [key, value] of propertyChangeMap) {
        resultMap.set(key, value.state);
    }
    return resultMap;
}

console.log(
    "@@@ SHALLOW DIFF TEST:::",
    objectShallowDiff(
        { a: "removed", b: "changed", c: "unchanged" },
        { b: "changed-", c: "unchanged", d: "addedd" },
    ),
);
