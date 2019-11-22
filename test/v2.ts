import { WatchableThing, watchable_watch } from "../src/v2";
import { strict as assert } from "assert";

let eventsThisTick: 1[] = [];
let tick = () => {
    eventsThisTick = [];
    return new Promise(r => setTimeout(() => r(), 0));
};

(async () => {
    let testThing = new WatchableThing({});
    // console.log(testThing.$get("a").$ref);
    testThing.$get("propname")[watchable_watch](() => eventsThisTick.push(1));
    await tick();
    assert.deepStrictEqual(eventsThisTick, [1]);
    // console.log("setting propname. should emit.");
    testThing.$get("propname").$ref = "new value";
    await tick();
    assert.deepStrictEqual(eventsThisTick, [1]);
    // console.log("setting a. nothing should happen.");
    testThing.$get("a").$ref = "also changed";
    await tick();
    assert.deepStrictEqual(eventsThisTick, []);
    // console.log("removing propname. should emit.");
    testThing.$ref = { "propname is no longer a thing": "rip", a: 23 }; // in this case, propname should still exist as an empty
    await tick();
    assert.deepStrictEqual(eventsThisTick, [1]);
    // console.log("adding propname. should emit.");
    testThing.$ref = { propname: "oh it's back" };
    await tick();
    assert.deepStrictEqual(eventsThisTick, [1]);
    // assert.deepStrictEqual(testThing.$ref, { propname: "oh it's back" }); // todo
    // console.log("testthing is: " + JSON.stringify(testThing));
})();
