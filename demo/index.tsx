"dmf prefix $";

import { React } from "../src";
import { $ } from "../src/v2";

$;
React;

let $num = 5;

document.body.appendChild(
    (
        <div>
            <button onclick={() => --$num}>--</button>
            {$num}
            <button onclick={() => ++$num}>++</button>
        </div>
    ).node
);
