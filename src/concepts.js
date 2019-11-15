/*

code:

<div>value: {"" + $a.value.toString($number)}</div>

output:

<div>value: {watch([$a.$get("value").$get("toString")], () => $a.$get("value").$get("toString").ref($number))}</div>

usage:

$a.get("value") :: WatchableRef(0)
.get("tostring").ref :: WatchableRef(0).ref.toString
[watchable_watch] :: WatchableRef(0).watch => ref.toString


function Number({$num: $num}){

return <div><button onclick={() => setNum(num + 1)}>+</button> {""+$num}</div>

}


function TodoList(){

let $list = []; // -> let $list = create([]);

return <ul>
<ListRender list={$list}>
{($item, symbol) => <li>
<Input type="text" value={$item} /> // -> value={$item.ref} // but in this situation we want to bind. $value={$item} for two way binding maybe. that loses ts support.
</li>} // no action
</ListRender>
<li><button onclick={() => $list.push("v")}>+Add Item</button></li> // no action necessary, things inside functions are ignored
</ul>

}

-----


"dmf prefix $";

let $obj = {
    mode: "a",
    a: 3
};

$obj.c = "test";

<div>{$obj.c = "test"}</div>
// <- should be $obj.$get("c").$ref but babel errors while setting it to $obj.$get before it has gotten to .ref

let o=
<div>{$obj}</div>

*/

Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports.default = function({ types: t }) {
    let $call = v =>
        t.memberExpression(t.identifier("$"), t.identifier("" + v));
    return {
        name: "ast-transform",
        visitor: {
            DirectiveLiteral(path) {
                if (path.node.value.startsWith("dmf prefix ")) {
                    let file = path.findParent(path => path.isProgram());
                    file.__dmf_prefix = path.node.value.substr(11);
                }
            },
            VariableDeclarator(path) {
                let prefix = path.findParent(path => path.isProgram())
                    .__dmf_prefix;
                if (!prefix) return;
                if (
                    path.node.id.type === "Identifier" &&
                    path.node.id.name.startsWith(prefix)
                ) {
                    path.node.init = t.callExpression($call`createWatchable`, [
                        path.node.init
                    ]);
                }
            },
            JSXExpressionContainer(path) {
                /*
                ---
                it turns out sometimes we need to do things outside of
                jsxexpresisoncontainer.
                consider:
                let $o = 5;
                $o++
                this should be $o.$ref++
                but because it's not in a jsxexpressioncontainer, that doesn't happen
                ---
                */
                let prefix = path.findParent(path => path.isProgram())
                    .__dmf_prefix;
                if (!prefix) return;
                let watchables = [];
                path.traverse({
                    JSXExpressionContainer(path) {
                        path.skip();
                    },
                    exit(path) {
                        let wrap = node => {
                            return t.memberExpression(
                                node,
                                t.identifier("$ref")
                            );
                        };
                        if (path.node.type === "Identifier") {
                            if (path.node.name.startsWith(prefix)) {
                                path.replaceWith(wrap(path.node));
                                path.skip();
                            }
                        }
                        if (path.node.type === "MemberExpression") {
                            console.log(
                                "found memberexpression",
                                path.node.object
                            );
                            if (
                                path.node.object.type === "MemberExpression" &&
                                path.node.object.property.name === "$ref"
                            ) {
                                console.log("unwrap", path.node.object);
                                path.node.object = path.node.object.object;
                            }
                            if (
                                (path.node.object.type === "Identifier" &&
                                    path.node.object.name.startsWith(prefix)) ||
                                (path.node.object.type === "CallExpression" &&
                                    path.node.object.callee.type ===
                                        "MemberExpression" &&
                                    path.node.object.callee.property.type ===
                                        "Identifier" &&
                                    path.node.object.callee.property.name ===
                                        "$get")
                            ) {
                                console.log("got ehre");
                                let property = path.node.property;
                                if (property.type === "Identifier") {
                                    //property.name = "test";
                                    path.replaceWith(
                                        wrap(
                                            t.callExpression(
                                                // maybe  we can tell it to not check this?
                                                t.memberExpression(
                                                    path.node.object,
                                                    t.identifier("$get")
                                                ),
                                                [t.stringLiteral(property.name)]
                                            )
                                        )
                                    );
                                    path.skip();
                                    console.log("did replace");
                                }
                                // if(is last) add .ref
                                // last means last before a fn call
                                // <>{a.b.toString().c + "d"}</>
                                // -> a.$get(b).$get(toString).ref().c + "d"
                            }
                            // add watch as needed
                        }
                    }
                });
                path.traverse({
                    // traverse once again and add .ref to watchables
                    JSXExpressionContainer(path) {
                        path.skip();
                    },
                    Function(path) {
                        path.skip();
                    },
                    MemberExpression(path) {
                        if (
                            path.node.property.type === "Identifier" &&
                            path.node.property.name === "$ref"
                        ) {
                            watchables.push(path.node.object);
                        }
                    }
                });

                if (watchables.length <= 0) {
                    // nothing to do. don't skip.
                    return;
                }
                path.node.expression = t.callExpression($call`watch`, [
                    t.arrayExpression(watchables),
                    t.arrowFunctionExpression([], path.node.expression)
                ]);
            }
        }
    };
};
