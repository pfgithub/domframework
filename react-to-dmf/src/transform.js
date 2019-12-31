function findSafePrefix(identifiers) {
    let tests = ["$", "w$"];
    let result = tests.find(test =>
        identifiers.every(identifier => !identifier.startsWith(test)),
    );
    if (result) return result;
    let $count = 0;
    identifiers.forEach(identifier => {
        let match = identifier.match(/^\$+/);
        if (!match) return;
        $count = Math.max($count, match[0].length + 1);
    });
    return "$".repeat($count);
}

function getPrefix(path) {
    path.findParent(path => path.node.___prefix).node.___prefix;
}

Object.defineProperty(exports, "__esModule", {
    value: true,
});
module.exports.default = function({ types: t }) {
    return {
        name: "ast-transform",
        visitor: {
            VariableDeclarator(path) {
                if (t.isCallExpression(path.node) && t.is) {
                }
            },
            Program(path) {
                let allIdentifiers = [];
                path.traverse({
                    Identifier(path) {
                        allIdentifiers.push(path.node.name);
                    },
                });
                path.node.___prefix = findSafePrefix(allIdentifiers);
                path.node.directives.push(
                    t.directiveLiteral("dmf prefix " + path.node.___prefix),
                );
            },
        },
    };
};
