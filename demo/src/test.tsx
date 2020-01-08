"dmf prefix $";

import { React, ListRender, $, $bind, List, mount } from "dmf";

import "./drawBoxAroundElement";

$;
React;

let $text = "initial";

/*
$text || $onchange(() => {
	console.log("changed");
})
*/

mount(
    <>
        <input value={$text} onInput={e => ($text = e.currentTarget.value)} />
        {$text ? (
            <input
                value={$text}
                onInput={e => ($text = e.currentTarget.value)}
            />
        ) : (
            "type some text to show"
        )}
    </>,
    document.body,
);
