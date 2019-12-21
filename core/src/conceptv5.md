what if 
```
let $o = $.w({a: 5, b: 6})
$o.ref.a // -> o.ref.get("a")
this way typescript can know if something is watchable or not

the issue:
$o = $.w({b: 6}) // should just be $o = {b: 6}
```