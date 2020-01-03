import { React, ListRender, $, $bind, List, mount } from "dmf";

import "./drawBoxAroundElement";

$;
React;

{
    let countingNumber = $.createWatchable(0);
    mount(
        <div>
            Counter is at:{" "}
            {$.watch([countingNumber], () => {
                console.log("watch emitted.");
                return countingNumber.$ref;
            })}
            .{" "}
            <button
                onClick={() => {
                    countingNumber.$ref++;
                }}
            >
                Increase
            </button>
        </div>,
        document.body,
    );
}
