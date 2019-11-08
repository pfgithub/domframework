```ts
Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports.default = function({ types: t }) {
    return {
        name: "ast-transform", // not required
        visitor: {
            JSXExpressionContainer(path) {
                let watchables = [];
                path.traverse({
                    JSXExpressionContainer(path) {
                        path.skip();
                    },
                    MemberExpression(path) {
                        if (path.node.object.type === "Identifier") {
                            if (path.node.object.name.startsWith("$")) {
                                console.log("got ehre");
                                let property = path.node.property;
                                if (property.type === "Identifier") {
                                    //property.name = "test";
                                    path.replaceWith(
                                        t.callExpression(
                                            t.memberExpression(
                                                t.identifier(
                                                    "_" + path.node.object.name
                                                ),
                                                t.identifier("get")
                                            ),
                                            [t.stringLiteral(property.name)]
                                        )
                                    );
                                    console.log("did replace");
                                }
                            }
                        }
                        // if(left === "$")
                        // demo:
                        // $object.a.b.c
                        // $object.get("a").ref.ref.get("b").ref.ref.get("c").ref.ref
                        // or is it $object.ref.a.b.c
                        // how do we know?
                        // ts types would be one way
                        // $object.value.toString();
                        // $object.get("value").get("toString").ref();
                        // get(value) returns watchableref
                        // get(tostring) returns watchableref
                        // ref returns value.toString
                        // if you do it in ts:: ';;';;';;';;';;';;';;';;';;';;';;'
                        // $object    .,.           [ ] [          ]
                        //if (path.node.property.type === "Identifier") {
                        //  if (path.node.property.name === "$ref") {
                        //    watchables.push(path.node.object); // TODO dedupe
                        //    path.node.property.name = "ref";
                        //  }
                        //}
                    }
                });
                if (watchables.length <= 0) {
                    // nothing to do. don't skip.
                    return;
                }
                path.node.expression = t.callExpression(t.identifier("watch"), [
                    t.arrayExpression(watchables),
                    t.arrowFunctionExpression([], path.node.expression)
                ]);
            }
        }
    };
};

/*

!!!CONCEPT
$a.b.c.d => a.get("b").get("c").get("d").ref

*/

Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports.default = function({ types: t }) {
    return {
        name: "ast-transform", // not required
        visitor: {
            JSXExpressionContainer(path) {
                let watchables = [];
                path.traverse({
                    JSXExpressionContainer(path) {
                        path.skip();
                    },
                    MemberExpression(path) {
                        // demo:
                        // $object.a.b.c
                        // $object.get("a").ref.ref.get("b").ref.ref.get("c").ref.ref
                        // or is it $object.ref.a.b.c
                        // how do we know?
                        // ts types would be one way
                        // $object.value.toString();
                        // $object.get("value").get("toString").ref();
                        // get(value) returns watchableref
                        // get(tostring) returns watchableref
                        // ref returns value.toString
                        // if you do it in ts:: ';;';;';;';;';;';;';;';;';;';;';;'
                        // $object    .,.           [ ] [          ]
                        if (path.node.property.type === "Identifier") {
                            if (path.node.property.name === "$ref") {
                                watchables.push(path.node.object); // TODO dedupe
                                path.node.property.name = "ref";
                            }
                        }
                    }
                });
                if (watchables.length <= 0) {
                    // nothing to do. don't skip.
                    return;
                }
                path.node.expression = t.callExpression(t.identifier("watch"), [
                    t.arrayExpression(watchables),
                    t.arrowFunctionExpression([], path.node.expression)
                ]);
            }
        }
    };
};
```

```ts
let $object = c_object<
    | { state: "waiting" }
    | { state: "loaded"; value: number }
    | { state: "error"; message: string }
>({ state: "waiting" });

document.body.appendChild(
    (
        <div>
            {$object.state === "waiting" ? (
                <div>Waiting...</div>
            ) : $object.state === "loaded" ? (
                <div>Loaded. Value: {"" + $object.value}</div>
            ) : $object.state === "error" ? (
                <div>Error! {$object.message}</div>
            ) : (
                <div>never</div>
            )}
            Set State:
            <button onclick={() => ($object = { state: "waiting" })}>
                Waiting
            </button>
            <button onclick={() => ($object = { state: "loaded", value: 25 })}>
                Loaded
            </button>
            <button
                onclick={() =>
                    ($object = { state: "error", message: "A bad happened" })
                }
            >
                Error
            </button>
        </div>
    ).node
);
```

```ts
let object = c_object({ state: c_string("waiting") });

document.body.appendChild(
    <div>
        {watch([object.get("state")], () =>
            object.get("state").ref.ref === "waiting" ? (
                <div>Waiting...</div>
            ) : object.get("state").ref.ref === "loaded" ? (
                <div>
                    Loaded. Value:{" "}
                    {watch(
                        [object.get("value").ref.ref],
                        () => "" + object.value
                    )}
                </div>
            ) : object.get("state").ref.ref === "error" ? (
                <div>
                    Error!{" "}
                    {watch(
                        [object.get("message").ref.ref],
                        () => object.get("message").ref.ref
                    )}
                </div>
            ) : (
                <div>never</div>
            )
        )}
        Set State:
        <button onclick={() => (object.ref = { state: "waiting" })}>
            Waiting
        </button>
        <button onclick={() => (object.ref = { state: "loaded", value: 25 })}>
            Loaded
        </button>
        <button
            onclick={() =>
                (object.ref = { state: "error", message: "A bad happened" })
            }
        >
            Error
        </button>
    </div>
);
```
