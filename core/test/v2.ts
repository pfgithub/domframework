import { WatchableThing } from "../src/watchable";
import { strict as assert } from "assert";

let interval = 80;
let spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

async function test(
    name: string,
    cb: (t: { equal: (a: any, b: any) => void }) => Promise<void>,
) {
    let assertCount = cb.toString().split("assert").length - 2;
    let successes = 0;
    let total = assertCount;
    process.stdout.write(name + "\x1b7");
    let start = new Date().getTime();
    let spa = 0;
    let update = () => {
        process.stdout.write(
            "\x1b8" +
                " \x1b[32m✔\x1b[0m".repeat(successes) +
                " .".repeat(Math.max(total - successes - 1, 0)) +
                (total - successes - 1 < 0
                    ? ""
                    : " " + spinner[(spa = (spa + 1) % spinner.length)]),
        );
    };
    let int = setInterval(() => update(), interval);
    //defer clearInterval(int)
    await cb({
        equal: (a, b) => {
            try {
                assert.deepStrictEqual(a, b);
            } catch (e) {
                process.stdout.write("\n");
                clearInterval(int);
                throw e;
            }
            successes++;
        },
    });
    clearInterval(int);
    process.stdout.write("\n");
    assert.deepStrictEqual(successes, assertCount);
}

let ms = (ms: number) => new Promise(r => setTimeout(r, ms));

test("a", async assert => {
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
    assert.equal(1, 1);
    await ms(Math.random() * 1000);
});
