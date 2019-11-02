Data-driven dom updates

# Demo

```
let data = watchable({count: 5});

document.body.appendChild((
<div>
	Count: {watch([data.count], () => data.count.ref)}{" "}
	<button>Increase Count</button>
</div>
).node);
```

# Why domframework instead of ...

domframework emphasizes performance. renders only happen when a component is created, then only the necessary parts of the component are updated.

-   Best practices include performance
-   ( in react the "best practice" is to do everything as inefficiently as possible until performance starts getting impacted )
-   Typescript everywhere, even in templates
-   ( in angular, vue, lit-html, svelte they don't)
-   No diffing or "rerendering"
-   ( in react, lit-html to update some part of the page, you return an object which gets diffed with the real page to find what needs changing (it's more complicated than that))
-   Embeddable into existing pages and frameworks
-   ( every other framework can too, this isn't really very special)

```
domframework

let data = watchable({a: 1, b: 2});

document.body.appendChild((
<div>
	<input type="number" value={data} />
	<p>{data.$a} {data.$b}, {watch([data.a, data.b], () => data.a + data.b)}</p>
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
