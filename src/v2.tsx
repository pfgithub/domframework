// diffing tutorial (to prevent the use of keys)
// : each item (set [Symbol.diffhelper] =Symbol("v"))
// now they can be added to a list properly

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

export class WatchableThing<T> extends WatchableBase<void> {
    private __v!: T;
    constructor(v: T) {
        super();
        this.$ref = v;
    }
    [watchable_value](): void {}
    [watchable_setup](): void {}
    [watchable_cleanup](): void {}
    set $ref(nv: T) {
        // if(is object, loop over each item, diff or whatever, ...)
        this.__v = nv;
        this[watchable_emit]();
    }
    get $ref() {
        // unfortunately, here we need to recursive loop down into
        // __v and .ref each value
        // if(is object)
        // if(is array)
        // if(is ref)
        return this.__v;
    }
    $get(v: string): WatchableThing<any> {
        let value = (this.__v as any)[v];
        if (value ?? false) {
            // like !value but ??
        }
        // if(typeof __v === object) : return __v[v] ? __v[v] : __v[v] = new WatchableThing(undefined, temp);
    }
}

let testThing = new WatchableThing({});
console.log(testThing.$get("a").$ref);
testThing
    .$get("propname")
    [watchable_watch](() =>
        console.log(
            "propname was set. testthing is: " + JSON.stringify(testThing)
        )
    );
testThing.$get("propname").$ref = "new value";
testThing.$get("a").$ref = "also changed";
testThing.$ref = { "propname is no longer a thing": "rip" };
testThing.$ref = { propname: "oh it's back" };
// by the end of this, the cb will be called 4 times because everything updates then cb gets emitted.
// HOW TO FIX:: do the diffhelper symbol on cb

// type CreatedWatchable<T> = T extends object
//     ? { [key in keyof T]: CreatedWatchable<T[key]> }
//     : WatchableRef<T>;
// export let $ = {
//     // functions here are only to be auto called by the compiler
//     createWatchable<T>(obj: T): CreatedWatchable<T> {
//         if (typeof obj === "object") {
//             if (Array.isArray(obj)) {
//                 let rv = new WatchableList();
//                 obj.forEach(q => rv.push($.createWatchable(q) as any));
//                 return rv as any;
//             }
//             let ro = new WatchableObject({});
//             Object.keys(obj).forEach(k =>
//                 ro.set(k as never, $.createWatchable((obj as any)[k] as never))
//             );
//             return ro as any;
//         }
//         return new WatchableRef(obj) as any;
//     },
//     watch<T>(
//         data: Watchable<any>[],
//         cb: () => T
//     ): WatchableDependencyList<typeof data> {
//         return new WatchableDependencyList(data, cb) as any;
//     }
// };
