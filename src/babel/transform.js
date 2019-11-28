/*
----------- CASES TO HANDLE

(as discovered)

$a.b?.c.d

EXPECTED: (__1 = $a.get("b")).ref ? __1.get("c").get("d").ref
GOT: $a.get("b").ref?.c.d

delete $a.b.c

EXPECTED: $a.get("b").delete("c")
GOT: delete $a.get("b").get("c").$ref

*/

Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports.default = function({ types: t }) {
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
                            path => path.node.__is_supposed_to_skip
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix
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
                }
            },
            MemberExpression: {
                enter(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix
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
                            path => path.node.__is_supposed_to_skip
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix
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
                                            t.identifier("$get")
                                        ),
                                        [t.stringLiteral(property.name)]
                                    )
                                )
                            );
                            path.skip();
                            path.node.__is_supposed_to_skip = true;
                        }
                    }
                }
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
                        t.memberExpression(path.node.left, path.node.right)
                    );
                    return;
                }
                // }
            },
            Directive(path) {
                if (
                    path.findParent(path => path.node.__is_supposed_to_skip) ||
                    path.node.__is_supposed_to_skip
                ) {
                    return;
                }
                if (path.node.value.value.startsWith("dmf prefix ")) {
                    let file = path.findParent(path => !!path.node.directives)
                        .node;
                    file.__dmf_prefix = path.node.value.value.substr(11);
                    console.log("set dmf prefix of", file);
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
                    path => path.node.__dmf_prefix
                );
                console.log("prefix node is", prefixNode);
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
                    path => path.node.__dmf_prefix
                );
                console.log("prefix node is", prefixNode);
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
                    path => path.node.__dmf_prefix
                );
                if (!prefixNode) return;
                let prefix = prefixNode.node.__dmf_prefix;

                if (
                    path.node.left.type === "Identifier" &&
                    matches(path.node.left.name, prefix)
                ) {
                    path.node.left.__do_not_ref = true;
                    path.node.right = t.callExpression($call`createWatchable`, [
                        path.node.right
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
                    path => path.node.__dmf_prefix
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
                            [path.node.value]
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
                    path => path.node.__dmf_prefix
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
                        path.node.init
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
                    path => path.node.__dmf_prefix
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
            JSXExpressionContainer: {
                exit(path) {
                    if (
                        path.findParent(
                            path => path.node.__is_supposed_to_skip
                        ) ||
                        path.node.__is_supposed_to_skip
                    ) {
                        return;
                    }
                    let prefixNode = path.findParent(
                        path => path.node.__dmf_prefix
                    );
                    if (!prefixNode) return;
                    let prefix = prefixNode.node.__dmf_prefix;

                    let watchables = [];
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
                    path.skip();
                    path.node.expression.__is_supposed_to_skip = true;
                }
            }
        }
    };
};
