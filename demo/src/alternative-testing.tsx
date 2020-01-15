@Component // marks props as watchable
function NumberIncrementer(props: {
    value: number;
    setValue: (nv: number) => void; // setValue is needed for top level changes (like setting props.value = , there's nothing you're mutating (except props) so it needs to be piped)
}) {
    // maybe it should be possible to mark some arguments as static. these render only initially and would put a change handler for dev only to error on changes. later though.
    return (
        <div>
            <button onClick={() => props.setValue(props.value + 1)}>
                Increase
            </button>
            {props.value}
            <button onClick={() => props.setValue(props.value - 1)}>
                Decrease
            </button>
        </div>
    );
}
@Component
function ObjectMutator(props: { object: { value: string } }) {
    props.object.value = "aaa"; // this will mutate the object without the need for piping. if piping is wanted, there should be some way to specify something has to be static and then have the handler use mutation to update it. pure will probably not be supported because pure changes mean dmf has to diff a lot and diffing is the opposite of the goal
}
@Component
function FakeCode(props: { a: "a" | "b" | "c" | "d" | "e" | "f" }) {
    @Watchable
    let watchableVariable = 5; // watchable variables are only watchable in this scope and in jsx elements they pass to

    if (watchableVariable > 10) {
        return (
            <div>
                Uh oh! Watchable Variable is more than 10!{" "}
                <button onClick={() => (watchableVariable = 10)}>
                    Decrease
                </button>
            </div>
        );
    }
    return (
        <div>
            <NumberIncrementer
                value={watchableVariable}
                setValue={v => (watchableVariable = v)}
            />
        </div>
    ); // Piping is ok,
}
function RealCode(props: { a: "a" | "b" | "c" | "d" | "e" | "f" }) {
    // the trouble now is how to write this in code
    // any returning conditions will auto do this (control flow analysis, fun)
    // how are the watchables found though? how are watchables handled in general?
    // !!!!!!!
    // would this work?
    // let a = {b: 5};
    // a.b = 6;
    // a[_emit] && a[_emit]("b", 6)
    return _watch([props.a], __saved => {
        if (props.a === "a") {
            if (__saved.type === 0) return __saved;
            return { type: 0, value: "1" };
        } else if (props.a === "b") {
            if (__saved.type === 1) return __saved.value;
            return { type: 1, value: "2" };
        } else if (props.a === "c") {
            if (__saved.type === 2) return __saved.value;
            return { type: 2, value: "3" };
        }
        switch (props.a) {
            case "d":
                if (__saved.type === 4) return __saved.value;
                return "4";
        }
        // ...
        // return f || <div></div>:
        // => return f || (() => {if(__saved.type == 15){return __saved.value} return {type:15, value: <div></div>
    });
    return props.a === "e"
        ? (() => {
              if (__saved.type == 10) return __saved.value;
              return { type: 10, value: "11" };
          })()
        : (() => {
              if (__saved.type == 11) return __saved.value;
              return { type: 11, value: "hmm" };
          })();
}
function Switcher(props: { a: "a" | "b" | "c" | "d" | "e" | "f" }) {
    if (props.a === "a") {
        return "1";
    } else if (props.a === "b") {
        return "2";
    } else if (props.a === "c") {
        return "3";
    }
    switch (props.a) {
        case "d":
            return "4";
        case "e":
            return "5";
        default:
            return (
                <button
                    onClick={
                        () =>
                            (props.a =
                                "a") /*should you be allowed to do this? no*/
                    }
                >
                    set a
                </button>
            );
    }
}
function TestSwitcher() {
    let value = "b" as "a" | "b" | "c" | "d" | "e" | "f";
    return (
        <div>
            <Switcher a={value} />
            <button onClick={() => (value = "b")}>set d</button>
        </div>
    );
}
function TodoList() {
    let list: string[] = [];
    return (
        <>
            <button onClick={() => list.push("1")}></button>
            {list.map((item, i) => {
                return (
                    <input
                        value={item}
                        onInput={e => (item = e.currentTarget.value)}
                    />
                );
            })}
        </>
    );
}
