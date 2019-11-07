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
                    CallExpression(path) {
                        if (path.node.callee.type === "Identifier") {
                            if (path.node.callee.name === "watch") {
                                path.skip(); // ignore $ usage in watches // what's the point of this? if you're writing watch, you don't need $.
                            }
                        }
                    },
                    MemberExpression(path) {
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
