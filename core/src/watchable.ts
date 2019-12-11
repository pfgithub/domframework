// diffing tutorial (to prevent the use of keys)
// : each item (set [Symbol.diffhelper] =Symbol("v"))
// now they can be added to a list properly

export declare let $bind: never;

let nextTickInfo:
    | {
          symbol: symbol;
          handlers: (() => void)[];
      }
    | undefined;

function _handleNextTick() {
    if (!nextTickInfo) return;
    nextTickInfo.handlers.forEach(handler => {
        // typescript flow control needs to be able to know
        // when something happens immediately
        delete (handler as any)[nextTickInfo!.symbol];
        handler();
    });
    nextTickInfo = undefined;
}

function nextTick(cb: () => void) {
    if (!nextTickInfo) {
        nextTickInfo = {
            symbol: Symbol("next tick"),
            handlers: [],
        };
        setTimeout(() => _handleNextTick(), 0);
    }
    let itemSymbol = Symbol("cb to be called next tick");
    if ((cb as any)[nextTickInfo.symbol]) return; // handler already registered. no need to call it twice.
    (cb as any)[nextTickInfo.symbol] = itemSymbol;
    nextTickInfo.handlers.push(cb);
}

export const is_watchable = Symbol("is watchable");

export const should_be_raw = Symbol("should be raw");

export type RemovalHandler = (() => void) & { __isRemovalHandler: true };

export interface WatchableBase {
    _setup?(): void;
    _teardown?(): void;
}
export abstract class WatchableBase {
    watchers: (() => void)[] = [];
    abstract get $ref(): any;
    abstract set $ref(v: any);
    watch(watcher: () => void): RemovalHandler {
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
        nextTick(() => this.watchers.forEach(w => w()));
    }
    get [is_watchable]() {
        return true;
    }
}

// !!!!!!!!!!!!!! possible memory leak: unused values need to be cleaned up when no one is watching them anymore

export class FakeWatchable extends WatchableBase {
    thing: any;
    parent: WatchableBase;
    constructor(thing: any, parent: WatchableBase) {
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
    watch(watcher: () => void) {
        return this.parent.watch(watcher);
    }
}

export class WatchableThing<T> extends WatchableBase {
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
    $get(v: string): WatchableBase {
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
    removeSelf: () => void;
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
            removeSelf: () => {},
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

export class WatchableDependencyList<T> extends WatchableBase {
    private dependencyList: WatchableBase[];
    private requiresUpdate: () => boolean;
    private getValue: () => T;
    private removalHandlers: RemovalHandler[] = [];
    constructor(
        dependencyList: WatchableBase[],
        requiresUpdate: () => boolean,
        getValue: () => T,
    ) {
        super();
        this.dependencyList = dependencyList;
        this.requiresUpdate = requiresUpdate;
        this.getValue = getValue;
    }
    _setup() {
        this.dependencyList.forEach(item =>
            this.removalHandlers.push(
                item.watch(() => {
                    if (this.requiresUpdate()) this.emit();
                }),
            ),
        );
    }
    _teardown() {
        this.removalHandlers.forEach(rh => rh());
    }
    get $ref(): T {
        return this.getValue();
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
};

// export interface Watchable {
//     watch(v: () => void): () => void; // watch(watcher) returns unwatcher
// }
