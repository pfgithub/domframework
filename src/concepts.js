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
