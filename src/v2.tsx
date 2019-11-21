import {
    Watchable,
    WatchableList,
    WatchableObject,
    WatchableRef,
    WatchableDependencyList
} from ".";

/*

-=-=-=-=-=-=-=-=-=-=-=- DEMO -=-=-=-=-=-==-=-=-=-=--=

"dmf prefix $";


let $o = {a: 5};



document.body.appendChild(<div>
{$o.a} ({$o.a.toFixed(2)}) <button onclick={() => $o.a++}>+</button>
</div>);







*/

type CreatedWatchable<T> = T extends object
    ? { [key in keyof T]: CreatedWatchable<T[key]> }
    : WatchableRef<T>;
export let $ = {
    // functions here are only to be auto called by the compiler
    createWatchable<T>(obj: T): CreatedWatchable<T> {
        if (typeof obj === "object") {
            if (Array.isArray(obj)) {
                let rv = new WatchableList();
                obj.forEach(q => rv.push($.createWatchable(q) as any));
                return rv as any;
            }
            let ro = new WatchableObject({});
            Object.keys(obj).forEach(k =>
                ro.set(k as never, $.createWatchable((obj as any)[k] as never))
            );
            return ro as any;
        }
        return new WatchableRef(obj) as any;
    },
    watch<T>(
        data: Watchable<any>[],
        cb: () => T
    ): WatchableDependencyList<typeof data> {
        return new WatchableDependencyList(data, cb) as any;
    }
};

// let $a = $.createWatchable({ a: "b" });
// document.body.appendChild(
//     (<div>{$.watch([$a.$get("a")], () => $a.$get("a").$ref)}</div>).node
// );

/// ------

// let ﹼa = { a: "b" }; // possible unicode character (don't use this, it would require special editor support and that's farther than I want to go. unless an eslit modification could be made to convert $watch$ to ﹼ or something)
// document.body.appendChild((<div>{ﹼa.a}</div>).node);
//
// let $a = { a: "b" };
// document.body.appendChild((<div>{$a.a}</div>).node);
//
// document.body.appendChild(
//     (<button onclick={e => $a.b++}>{$a.b++}</button>).node
// );

/// ------
// ->

// let $a = $.createWatchable({ a: "b" });
// document.body.appendChild(
//     (<div>{$.watch([$a.$get("a")], () => $a.$get("a").$ref)}</div>).node
// );
//
// let $a = $.createWatchable(5); // typescript will actually know about these types
// document.body.appendChild(
//     (
//         <button onclick={e => $a.$get("b").$ref++}>
//             {$.watch([$a.$get("b")], () => $a.$get("b").$ref++)}
//         </button>
//     ).node
// );
