Truly reactive dom updates with no virtual dom and no diffing. (like svelte but different)

# Demo

v2:

```
let $data = {count: 5};
document.body.appendChild((
<div>
	Count: {$data.count}{" "}
	<button onclick={() => $data.count++}>Increase Count</button>
</div>
).node);
```

react:

```
let [data, setData] = useState({count: 5});
return <div>
	Count: {data.count}{" "}
	<button onclick={() => setData({...data, count: data.count + 1})}>Increase Count</button>
</div>

```

v1:

```
let data = watchable({count: 5});

document.body.appendChild((
<div>
	Count: {watch([data.count], () => data.count.ref)}{" "}
	<button onclick={() => data.count.ref++}>Increase Count</button>
</div>
).node);
```

# Why domframework instead of ...

domframework emphasizes performance. renders only happen when a component is created, then only the necessary parts of the component are updated. when adding an item to a list, only the new item even has any callbacks happening.

-   Best practices include performance
-   ( in react the "best practice" is to do everything as inefficiently as possible until performance starts getting impacted )
-   Typescript everywhere, even in templates
-   ( in angular, vue, lit-html, svelte they don't)
-   No diffing (virtual dom)
-   ( in react, lit-html to update some part of the page, you return an object which gets diffed with the real page to find what needs changing (it's more complicated than that))
-   Embeddable into existing pages and frameworks
-   ( every other framework can too, this isn't really very special)

```
domframework

let $data = {a: 1, b: 2}; // $ denotes watchable.

document.body.appendChild((
<div>
	<input type="number" value={$data} />
	<p>{$data.a} {$data.b}, {$data.a + $data.b}</p>
</div>
).node);

// ^ lots of that can be minimized by building a language (like svelte does) but doing this removes good type checking

---

react (with hooks)

import React, { useState } from 'react';

export default () => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);

  return (
    <div>
      <input type="number" value={a} onChange={e => setA(e.currentTarget.value)}/>
      <input type="number" value={b} onChange={e => setB(e.currentTarget.value)}/>
      {null/* this isn't quite correct because it doesn't handle cases when the number field contains strings */}
      <p>{a} + {b} = {a + b}</p>
    </div>
  );
};

---

svelte:

<script>
	let a = 1;
	let b = 2;
</script>

<input type="number" bind:value={a}>
<input type="number" bind:value={b}>

<p>{a} + {b} = {a + b}</p>
```

# concepts

quad state loading

```
type Loader<T> = {state: "init"} | {state: "lodaing", progress?: number} | {state: "loaded", value: T} | {state: "error", message: string};

let $loader: Loader<number> = {state: "init"};

// when the event is emitted for state changing, progress needs to have changed already
// don't emit events one at a time, change everything and emit on next tick

<div>
{
$loader.state === "init"
? <div><button onclick={() => $loader = {state: "loading", progress: 0}}>Click to Start Load</button></div>
:
$loader.state === "loading"
? <span>Progress: {loader.progress*100}%. <button>Cancel request</buton></span>
:
$loader.state === "loaded"
? <span>{loader.value}</span>
:
$loader.state === "error"
? <span>An error occured. <button onclick={() => $loader = {state: "loading", progress: 0}}>Retry</button></span>
: <span>never</span>
}
</div>

```
