import { React, ListRender, $, $Component, $Watchable, List, mount } from "dmf";

$;
React;

// ---

$Component;
function NumberIncrementer(props: {
    number: number;
    setNumber: (v: number) => void;
}) {
    return (
        <div>
            <button onClick={() => props.setNumber(props.number + 1)}>+</button>
            {props.number}
            <button onClick={() => props.setNumber(props.number - 1)}>-</button>
        </div>
    );
}

$Component;
function Main(props: {}) {
    $Watchable;
    let x = 0;

    return <NumberIncrementer number={x} setNumber={nx => (x = nx)} />;
}
