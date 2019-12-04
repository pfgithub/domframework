// goals:

// easy to compile (1 babel plugin) + functional style like react jsx
// like svelte but just javascript. no messy html mixed thing
// really good typescript support ! !!! !!!!!!
// easy to develop for (rarely have to think about how things update)

// most useful input (without regard for feasability)

```tsx
"dmf prefix $";

function WebDataLoader(){
    let $website = ""; // $ means watchable. you can see when the value changes.
    let $webData: WebData = {state: "waiting"}; 
    // everything below here ends up in watchable
    if($webData.state === "ready"){
        return WebDataDisplay(webData);
    }
    $webData || $change(() => {
        // wben $webData changes, this is called. Useful sometimes.
    });
    $: $c = $webData + ""; // when inputs change (webData), $c changes // (from svelte)
    let label1 = uniqid();
    return <>
        <label for={label1}>url</label>: <input id={label1} type="text" bind={$website} />
        <MyInputComponent $website={$website} />
    </>;
    // $property = two way bind, property = one way bind
    // instead of a={$a} setA={v => $a = v} (because that's slow), do two way bind instead
    // but it isn't slow
    // setA would only be used for top level things. other things can be directly modified
    // having bind makes it more clear that that is what is expected though
    // (and you write less code)
}

```

// most useful output (without regard for feasability)


outcome:

```js
/*

continue with the current thing
add $ bound properties
<input $value={$v} type="text">
<input $value={$v} type="number"> // note that value is a string
<input $checked={$v} type="radio">

<input value={$v}> // when $v changes, value changes






*/

```




lists:::

!! builtin arrays

dmf:
O(nlogn) sorting
O(  n  ) filtering
O(  1  ) adding, modifying, removing an item

vs react:
O(nlogn) sorting
O(  n  ) filtering
O(  n  ) adding, modifying, removing an item


```

function Component(props: {$value: v}){
    props.$value // if the prefixed identifier is the property of a non-prefixed thing, it should count as prefixed after the non-prefixed thing
    // (intended to prevent the annoying typescript thing where {$a, $b, $c}: {$a: type, $b: type, $c: type})
    let $a = $b;
    // WANTED:
    let $a = $b
    // CURRENT:
    let $a = $.createWatchable($b.$ref)
    // 2:
    $a = $b
    // WANTED:
    error! bad
    // CURRENT:
    $a.$ref = $b.$ref
}

```


```tsx

// items should have to be watchable at every step ::

let $o = {$c: "test", $d: "test"};

$o.$c.toString() // $o.get("$c").ref.toString()
$o.$d // $o.get("$d").ref

```

```tsx

// real fragments should be possible
// nodes should return              
let q: () => { nodes: Node[], insertAfter: (node: ChildNode) => void }
// the mounter should call back to the node
// with the node after
// (this will use lots of blank text nodes but those can)
// (          be optimized later                        )

// / / // / / // / / // / / // / / //

```


