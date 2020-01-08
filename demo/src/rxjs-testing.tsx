import { observe } from 'rxjs-observe';

// I don't think observables will be helpful at all...

let array = {a: "b", c: ["d"]};
const {observables, proxy} = observe(array)

let subscription = observables.c.subscribe(value => console.log(value));

//@ts-ignore
window.t = {observables, proxy, subscription};
// proxy.c.push("a") doesn't do anything