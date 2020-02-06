import { $ } from "../src/watchable";
import * as util from "util";
import { strict as assert } from "assert";

let interval = 80;
let spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

type LineType = { ref: string } | (() => string) | string;
function makeUI() {
    let lines: LineType[] = [];
    let newlineCount = 0;
    process.stdout.write("\x1b7");
    let ui = {
        addLine(line: LineType) {
            lines.push(line);
        },
        update() {
            let finalWrite = "";
            if (newlineCount) finalWrite += "\x1b[" + newlineCount + "A";
            newlineCount = 0;
            for (let line of lines) {
                let lineText: string;
                if (typeof line === "string") {
                    lineText = line;
                } else if (line instanceof Function) {
                    lineText = line();
                } else {
                    lineText = line.ref;
                }
                lineText += "\n";
                let newlineSplit = lineText.split("\n");
                newlineCount += newlineSplit.length - 1;
                finalWrite += lineText;
            }
            process.stdout.write(finalWrite);
        },
    };
    return ui;
}

let globalui = makeUI();

console.log = (...msg: any[]) => {
    globalui.addLine(
        "[log]: " +
            msg
                .map(i =>
                    typeof i === "string"
                        ? i
                        : util.inspect(i, false, null, true),
                )
                .join(" "),
    );
};

async function test(
    name: string,
    cb: (t: { equal: (a: any, b: any) => void }) => Promise<void>,
) {
    let assertCount = cb.toString().split("assert").length - 2;
    let successes = 0;
    let total = assertCount;
    let lineText = { ref: "..." };
    globalui.addLine(lineText);
    let start = new Date().getTime();
    let spa = 0;
    let update = () => {
        lineText.ref =
            name +
            " \x1b[32m✔\x1b[0m".repeat(successes) +
            " .".repeat(Math.max(total - successes - 1, 0)) +
            (total - successes - 1 < 0
                ? ""
                : " " + spinner[(spa = (spa + 1) % spinner.length)]);
        globalui.update();
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
    assert.deepStrictEqual(successes, assertCount);
}

let ms = (ms: number) => new Promise(r => setTimeout(r, ms));

test("a", async assert => {
    let $var = $.createWatchable("value");
    let changeCount = 0;
    $.watch([$var], () => {
        changeCount++;
    });
    $var.$ref = "new value";
    assert.equal(changeCount, 1);
});
