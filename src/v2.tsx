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

function handleNextTick() {
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
            handlers: []
        };
        setTimeout(() => handleNextTick(), 0);
    }
    let itemSymbol = Symbol("cb to be called next tick");
    if ((cb as any)[nextTickInfo.symbol]) return; // handler already registered. no need to call it twice.
    (cb as any)[nextTickInfo.symbol] = itemSymbol;
    nextTickInfo.handlers.push(cb);
}

export const watchable_cb = Symbol("cb");
export const watchable_ref = Symbol("ref");
export const watchable_data = Symbol("data");
export const watchable_emit = Symbol("emit");
export const watchable_value = Symbol("value");
export const watchable_setup = Symbol("setup");
export const watchable_watch = Symbol("watch");
export const watchable_cleanup = Symbol("cleanup");
export const watchable_watchers = Symbol("watchers");
export const watchable_cleanupfns = Symbol("cleanupfns");

export abstract class WatchableBase<T> {
    [watchable_watchers]: ((v: T) => void)[] = [];
    $ref: any;
    [watchable_watch](watcher: (v: T) => void): () => void {
        console.log("base watch was called on",this)
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
        nextTick(() =>
            this[watchable_watchers].map(w => {
                w(value);
            })
        );
    }
    abstract [watchable_value](): T;
    abstract [watchable_setup](): void;
    abstract [watchable_cleanup](): void;
}

// !!!!!!!!!!!!!! possible memory leak: unused values need to be cleaned up when no one is watching them anymore

export class FakeWatchable extends WatchableBase<void> {
    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {}
    thing: any;
    parent: WatchableBase<any>;
    constructor(thing: any, parent: WatchableBase<void>) {
        super();
        if(typeof thing === "function"){
            thing = thing.bind(parent.$ref);
        }
        this.thing = thing;
        this.parent = parent;
    }
    get $ref() {
        return this.thing;
    }
    set $ref(nv: any) {
        throw new Error("Cannot set ref value of fakewatchable");
    }
    $get(v: string) {
        return new FakeWatchable(this.thing[v], this);
    }
    [watchable_watch](watcher: (v: any) => void) {
        console.log("fw watch was called on",this)
        return this.parent[watchable_watch](watcher);
    }
}

export class WatchableThing<T> extends WatchableBase<void> {
    private __v!: any;
    isUnused: boolean;
    constructor(v: T, isUnused = false) {
        super();
        this.$ref = v;
        this.isUnused = isUnused;
    }
    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {}
    set $ref(nv: any) {
        console.log("$ref was used to set to ",nv);
        // !!!!!!!!!!!!!!!!!!!!!!!! emit to any above us (highest first)
        this[watchable_emit](); // emit before anything under us potentially emits
        this.isUnused = true;
        if (typeof this.__v === "object" && typeof nv === "object") {
            // if is array, good luck...
            let existingKeys: { [key: string]: WatchableThing<any> } = {
                ...this.__v
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
        console.log("$get was used with ",v);
        if (typeof this.__v === "object") {
            if (!(v in this.__v)) {
                this.__v[v] = new WatchableThing(undefined, true);
                return this.__v[v];
            }
            let value = (this.__v as any)[v];
            return value;
        } else {
            let value = new FakeWatchable((this.__v as any)[v], this);
            return value;
        }
    }
    toJSON() {
        return this.$ref;
    }
}

export const $ = {
    createWatchable: (v: any) => new WatchableThing(v),
    watch
};

export interface Watchable<T> {
    [watchable_watch](v: (v: T) => void): () => void; // watch(watcher) returns unwatcher
    [watchable_value](): T;
}

export class WatchableDependencyList<T> extends WatchableBase<T> {
    private [watchable_cb]: () => T;
    private [watchable_data]: Watchable<any>[];
    private [watchable_cleanupfns]: (() => void)[] = [];
    constructor(data: Watchable<any>[], cb: () => T) {
        super();
        console.log("Created watchabledependency list with", data, cb);
        this[watchable_cb] = cb;
        this[watchable_data] = data;
    }
    [watchable_value]() {
        return this[watchable_cb]();
    }
    [watchable_emit](value: T) {
        this[watchable_watchers].map(w => {
            w(value);
        });
    }
    [watchable_setup]() {
        this[watchable_data].forEach(dataToWatch => {
            this[watchable_cleanupfns].push(
                dataToWatch[watchable_watch](() => {
                    // when any data changes
                    let valueToReturn = this[watchable_value](); // get our own value
                    console.log(
                        "SOME DATA CHANGED. WE RETURNED",
                        valueToReturn,
                        "TO OUR WATCHERS",
                        this[watchable_watchers]
                    );
                    this[watchable_emit](valueToReturn);
                })
            );
        });
        console.log("Watchabledependencylist setup was called", this);
    }
    [watchable_cleanup]() {
        this[watchable_cleanupfns].map(cfn => cfn());
    }
}

export function watch<T>(data: Watchable<any>[], cb: () => T): Watchable<T> {
    return new WatchableDependencyList(data, cb);
}
