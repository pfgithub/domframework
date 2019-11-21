typescript has optional chaining now! (this means nothing but is still useful)

the issue: WatchableRef needs to encompass everything

```js
let $obj = 5;
$obj = { a: 6 };
```

if a WatchableRef holds an object,
on set:

-   remove existing k/v pairs,
-   loop over object.keys,
-   add new k/v pairs

```js
let $obj = undefined;
<node>
    {$obj === undefined ? (
        <span>undefined</span>
    ) : (
        <span>
            {$obj.a} {$obj.b}
        </span>
    )}
    <button onclick={() => ($obj = undefined)}>set undefined</button>
    <button onclick={() => ($obj = { a: 6, b: 5 })}>set 5, 6</button>
</node>;
```

another issue: if you run the babel plugin twice, it should output the same code as running it once. ignore for now // < it does that right now by not having "dmf prefix";

let $obj = $.createWatchable(undefined);

$obj = WatchableRef(undefined);
$obj.ref = {a: 5, b: 6};
\$obj = WatchableRef(new WatchableObject(a: 5, b: 6))
