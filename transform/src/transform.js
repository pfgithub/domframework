/*
// TODO:

rest attributes:
< {...{}} => __rest={{}} >

check if an object is actually watchable before doing .get() chains
$a.s = 5;
current: $a.get("s").ref = 5;
should be: ($a.watchable ? $a.get().ref : $a.s)
or maybe not
don't do this ^^

----------- CASES TO HANDLE

(as discovered)

$a.b?.c.d

EXPECTED: (__1 = $a.get("b")).ref ? __1.get("c").get("d").ref
GOT: $a.get("b").ref?.c.d

delete $a.b.c

EXPECTED: $a.get("b").delete("c")
GOT: delete $a.get("b").get("c").$ref


<>{$a.b().c > d ? <></> : <></>}</>

<>{watch([$a.b], (____prev, ___skip) => {
let ____curr = {};
____curr._1 = $a.get("b").$ref().c > d
if(____curr._1 === ____prev.ref._1){
  return ___skip();
}

return ____curr._1 ? <></> : <></>

})}</>

// just doing ? for now. more needs to be done though.

function ($a){
// make sure a is actually watchable
if(!$a.__is_watchable) throw new Error("parameter a expected to be watchable but not. either remove the $ or use || $bind when calling the function")
}

*/

Object.defineProperty(exports, "__esModule", {
    value: true,
});
module.exports.default = function({ types: t, template }) {
    let $call = v =>
        t.memberExpression(t.identifier("$"), t.identifier("" + v));
    let wrap = node => t.memberExpression(node, t.identifier("$ref"));
    let matches = (str, prefix) => str.startsWith(prefix) && str !== prefix;

    return {
        name: "ast-transform",
        visitor: {
            Identifier: {
                exit(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip,
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix,
                    );
                    if (!prefixNode) return;
                    let prefix = prefixNode.node.__dmf_prefix;

                    if (path.node.__do_not_ref) {
                        return;
                    }

                    if (matches(path.node.name, prefix)) {
                        path.replaceWith(wrap(path.node));
                        path.skip();
                        path.node.__is_supposed_to_skip = true;
                    }
                },
            },
            MemberExpression: {
                enter(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip,
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix,
                    );
                    if (!prefixNode) return;
                    let prefix = prefixNode.node.__dmf_prefix;

                    if (
                        path.node.property.type === "Identifier" &&
                        matches(path.node.property.name, prefix)
                    ) {
                        path.node.property.__do_not_ref = true;
                    }
                },
                exit(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip,
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix,
                    );
                    if (!prefixNode) return;
                    let prefix = prefixNode.node.__dmf_prefix;

                    if (
                        path.node.object.type === "MemberExpression" &&
                        path.node.object.property.name === "$ref"
                    ) {
                        path.node.object = path.node.object.object;
                    }
                    if (
                        (path.node.object.type === "Identifier" &&
                            matches(path.node.object.name, prefix)) ||
                        (path.node.object.type === "CallExpression" &&
                            path.node.object.callee.type ===
                                "MemberExpression" &&
                            path.node.object.callee.property.type ===
                                "Identifier" &&
                            path.node.object.callee.property.name === "$get")
                    ) {
                        if (path.node.object.__ignore) {
                            return;
                        }
                        let property = path.node.property;
                        if (property.type === "Identifier") {
                            if (property.name === "$bind") {
                                path.node.object.__ignore = true;
                                path.replaceWith(path.node.object);
                                path.skip();
                                path.node.__is_supposed_to_skip = true;
                                return;
                            }
                            //property.name = "test";
                            path.replaceWith(
                                wrap(
                                    t.callExpression(
                                        // maybe  we can tell it to not check this?
                                        t.memberExpression(
                                            path.node.object,
                                            t.identifier("$get"),
                                        ),
                                        [t.stringLiteral(property.name)],
                                    ),
                                ),
                            );
                            path.skip();
                            path.node.__is_supposed_to_skip = true;
                        }
                    }
                },
            },
            ImportSpecifier(path) {
                path.skip();
                path.node.__is_supposed_to_skip = true;
            },
            LogicalExpression(path) {
                // if (path.node.operator === "||") {
                if (
                    path.node.right.type === "Identifier" &&
                    path.node.right.name === "$bind"
                ) {
                    path.replaceWith(
                        t.memberExpression(path.node.left, path.node.right),
                    );
                    return;
                }
                // }
            },
            JSXSpreadAttribute(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                // throw new Error("Spread attributes are not supported yet");
                path.replaceWith(
                    t.jsxAttribute(
                        t.jSXIdentifier("dmfRest"),
                        t.jSXExpressionContainer(path.node.argument),
                    ),
                );
            },
            Directive(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                if (path.node.value.value.startsWith("dmf prefix ")) {
                    let block = path.parent;
                    block.__dmf_prefix = path.node.value.value.substr(11);
                    path.remove();
                }
            },
            FunctionDeclaration(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                path.node.params.forEach(param => {
                    if (
                        param.type === "Identifier" &&
                        matches(param.name, prefix)
                    ) {
                        param.__do_not_ref = true;
                    }
                });
            },
            ArrowFunctionExpression(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                path.node.params.forEach(param => {
                    if (
                        param.type === "Identifier" &&
                        matches(param.name, prefix)
                    ) {
                        param.__do_not_ref = true;
                    }
                });
            },
            AssignmentPattern(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                if (
                    path.node.left.type === "Identifier" &&
                    matches(path.node.left.name, prefix)
                ) {
                    path.node.left.__do_not_ref = true;
                    path.node.right = t.callExpression($call`createWatchable`, [
                        path.node.right,
                    ]);
                }
            },
            ObjectProperty(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                let canCreateWatchable = true;
                if (
                    path.parent.type === "ObjectPattern" &&
                    path.node.value.type === "Identifier" &&
                    matches(path.node.value.name, prefix)
                ) {
                    path.node.value.__do_not_ref = true;
                    canCreateWatchable = false;
                }
                if (
                    path.node.key.type === "Identifier" &&
                    matches(path.node.key.name, prefix)
                ) {
                    path.node.key.__do_not_ref = true;
                    if (canCreateWatchable)
                        path.node.value = t.callExpression(
                            $call`createWatchable`,
                            [path.node.value],
                        );
                }
            },
            VariableDeclarator(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                if (
                    path.node.id.type === "Identifier" &&
                    matches(path.node.id.name, prefix)
                ) {
                    path.node.id.__do_not_ref = true;
                    if (!path.node.init) {
                        path.node.init = t.identifier("undefined");
                    }
                    path.node.init = t.callExpression($call`createWatchable`, [
                        path.node.init,
                    ]);
                }
            },
            ArrayPattern(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                let prefixNode = path.findParent(
                    path => path.node.__dmf_prefix,
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                path.node.elements.forEach(element => {
                    if (
                        element.type === "Identifier" &&
                        matches(element.name, prefix)
                    )
                        element.__do_not_ref = true;
                });
            },
            /* !!! TODO
            LabeledStatement:
            
            anything past this should get condensed into return <>{ watch(... ... aaa) }</>
            */
            JSXExpressionContainer: {
                exit(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip,
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix,
                    );
                    if (!prefixNode) return;
                    let prefix = prefixNode.node.__dmf_prefix;

                    let watchables = [];
                    let tests = [];
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
                        },
                        ConditionalExpression: {
                            exit(path) {
                                // test goes into its own thing
                                let newL = tests.push(path.node.test);
                                path.node.test = t.memberExpression(
                                    t.identifier("____curr"),
                                    t.identifier("_" + (newL - 1)),
                                );
                            },
                        },
                    });

                    if (watchables.length <= 0) {
                        // nothing to do. don't skip.
                        return;
                    }

                    // !!! todo move these out for better performance
                    // also if("a" === "b") is false...
                    let ifTemplate = template(`
                        if(!!____curr.%%index%% === !!____prev.ref.%%index%%){
                            if(____saved) {
                                console.log("Skipping because saved value", ____saved.ref)
                                return ____saved.ref;
                            }
                        }
                    `);

                    let expressionTemplate = template(`
                        %%call_watch%%(%%watchables%%, (____prev, ____saved) => {
                            const ____curr = %%tests%%;
                            %%test_ifs%%
                            ____prev.ref = ____curr;
                            return %%result%%;
                        })
                    `);

                    path.node.expression = expressionTemplate({
                        call_watch: $call`watch`,
                        watchables: t.arrayExpression(watchables),
                        tests: t.objectExpression(
                            tests.map((test, index) =>
                                t.objectProperty(
                                    t.identifier("_" + index),
                                    test,
                                ),
                            ),
                        ),
                        test_ifs: tests.map((test, index) => {
                            return ifTemplate({
                                index: t.identifier("_" + index),
                            });
                        }),
                        result: path.node.expression,
                    }).expression;
                    path.skip();
                    path.node.expression.__is_supposed_to_skip = true;
                },
            },
        },
    };
};
