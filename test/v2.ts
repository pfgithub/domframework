import { WatchableThing, watchable_watch } from "../src/watchable";
import { strict as assert } from "assert";

async function test(
    name: string,
    cb: (t: { equal: (a: any, b: any) => void }) => Promise<void>
) {
    let assertCount = cb.toString().split("assert").length - 2;
    let successes = 0;
    process.stdout.write(" .".repeat(assertCount) + "\r");
    await cb({
        equal: (a, b) => {
            assert.deepStrictEqual(a, b);
            process.stdout.write(" \x1b[32m✔\x1b[0m");
            successes++;
        }
    });
    console.log("");
    assert.deepStrictEqual(successes, assertCount);
}

test("emitters", async assert => {
    let eventsThisTick: 1[] = [];
    let tick = () => {
        eventsThisTick = [];
        return new Promise(r => setTimeout(() => r(), 0));
    };

    let testThing = new WatchableThing({});
    // console.log(testThing.$get("a").$ref);
    testThing.$get("propname")[watchable_watch](() => eventsThisTick.push(1));
    await tick();
    assert.equal(eventsThisTick, [1]);
    // console.log("setting propname. should emit.");
    testThing.$get("propname").$ref = "new value";
    await tick();
    assert.equal(eventsThisTick, [1]);
    // console.log("setting a. nothing should happen.");
    testThing.$get("a").$ref = "also changed";
    await tick();
    assert.equal(eventsThisTick, []);
    // console.log("removing propname. should emit.");
    testThing.$ref = { "propname is no longer a thing": "rip", a: 23 }; // in this case, propname should still exist as an empty
    await tick();
    assert.equal(eventsThisTick, [1]);
    // console.log("adding propname. should emit.");
    testThing.$ref = { propname: "oh it's back" };
    await tick();
    assert.equal(eventsThisTick, [1]);

    assert.equal(testThing.$get("propname").$ref, "oh it's back");
    assert.equal(
        (testThing.$get("propname") as any).$get("toString").$ref(),
        "oh it's back"
    );
    // as/**/ */sert.deepStrictEqual(testThing.$ref, { propname: "oh it's back" }); // todo
    // console.log("testthing is: " + JSON.stringify(testThing));
});
