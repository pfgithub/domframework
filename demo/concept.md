list concept:

```
let $o = {list: $.list([])}
$o.list.push(item)
$o.list.remove(symbol)
```

also for this we need to be able to call functions on objects

deep watch concept:

```
let $o = [];

ObjectEditor($o || $bind);
<pre>${JSON.stringify($o || $deep)}</pre>

```

any time $o or anything it contains updates, update $deep

what if \$o has circular references?

warning: be careful about adding too many || things or you'll end up like svelte
