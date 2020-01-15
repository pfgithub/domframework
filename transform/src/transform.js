Object.defineProperty(exports, "__esModule", {
    value: true,
});
module.exports.default = function({ types: t, template }) {
    let functionTempl = template(
        `var %%functionName%% = $Component._apply(function(%%args%%){%%body%%});`,
    );
    let inlineFunctionTempl = template(`$Component.__on(%%function%%)`);

    let setWatchable = (body, idName) => {
        if (!body.__watchables) {
            body.__watchables = {};
        }
        body.__watchables[idName] = true;
    };

    return {
        name: "ast-transform",
        visitor: {
            FunctionDeclaration(path) {
                console.log(path);
                let nodeAbove = path.container[path.key - 1];
                console.log(nodeAbove);
                if (t.isExpressionStatement(nodeAbove)) {
                    let id = nodeAbove.expression;
                    if (t.isIdentifier(nodeAbove.expression)) {
                        if (id.name === "$Component") {
                            path.container[path.key - 1] = null;
                            let functionName = path.node.id;
                            let replacement = functionTempl({
                                functionName,
                                args: path.node.params,
                                body: path.node.body,
                            });
                            console.log(replacement);
                            // now within replacement, each arg, setWatchable(body, "arg");
                            // !! or set not watchable in non watchable functions
                            path.replaceWith(replacement);
                        }
                    }
                }
            },
        },
    };
};
