style things:

-   add a random thing to the class

p.realclassname.randomid

this allows people to make custom styles for your website that work past some recompiles

css animations:

```
button::create{
	transition: 0.1s something;
}
```

on create, button will have a .create.fjknfdsalnkdf class for the length of the transition. after that it will be removed

typescript types

what if watchables have a special type, T & {\_\_\_\_watchable}

```
let $playing = false;
$playing || $onchange(() => {
	// called when $playing changes
})
```

switch to observables: I don't want Observable.from() everywhere but it might solve issues with maps and arrays and using random types
