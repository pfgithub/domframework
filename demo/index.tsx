import {
    WatchableRef,
    d,
    textNode,
    watch,
    WatchableList,
    ListRender,
    watchable_watch,
    WatchableObject,
    FakeEmitter,
    React
} from "../src";

watch; // TODO fix;

import * as td from "./TransformsDemo";
import "../src/drawBoxAroundElement";

document.body.appendChild(td.Counter().node);
document.body.appendChild(td.Counter().node);
document.body.appendChild(td.Counter().node);

let buttonIsShowing = new WatchableRef(true);
document.body.appendChild(
    (
        <div>
            {buttonIsShowing.$ref ? (
                <button
                    onclick={() => {
                        window.startHighlightUpdates();
                        buttonIsShowing.ref = false;
                    }}
                >
                    Highlight Updates
                </button>
            ) : (
                <div />
            )}
        </div>
    ).node // that doesn't make any sense. what if you want to append a text node?
);
