/*

code:

<div>value: {"" + $a.value.toString($number)}</div>

output:

<div>value: {watch([$a.$get("value").$get("toString")], () => $a.$get("value").$get("toString").ref($number))}</div>

usage:

$a.get("value") :: WatchableRef(0)
.get("tostring").ref :: WatchableRef(0).ref.toString
[watchable_watch] :: WatchableRef(0).watch => ref.toString


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
                    MemberExpression: {
                        exit(path) {
                            console.log(
                                "found memberexpression",
                                path.node.object.name
                            );
                            if (
                                (path.node.object.type === "Identifier" &&
                                    path.node.object.name.startsWith("$")) ||
                                (path.node.object.type === "CallExpression" &&
                                    path.node.object.callee.property.name ===
                                        "$get")
                            ) {
                                console.log("got ehre");
                                let property = path.node.property;
                                if (property.type === "Identifier") {
                                    //property.name = "test";
                                    path.replaceWith(
                                        t.callExpression(
                                            // maybe  we can tell it to not check this?
                                            t.memberExpression(
                                                path.node.object,
                                                t.identifier("$get")
                                            ),
                                            [t.stringLiteral(property.name)]
                                        )
                                    );
                                    path.skip(); //  this is on exit so this may  be pointless
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
