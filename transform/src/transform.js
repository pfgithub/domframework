/*

$Component
function Component(){
$Watchable
let a = 5;
a.b();
callFnWith(a);
callFnWith(a || $bind) // idk about $bind, it seems pretty bad and error prone
// maybe only allow component functions used as jsx to bind

<Component var={a} // binds a
Component({var: a}) // does not bind a
// also Component will throw a runtime error that args are not watchable.

// one other thing is that in bindings we don't need the variable itself to be bound

}

// how about a typescript version of this

// maybe dmf will track .ref, it seems hard to make it track function parameters if it's catching $Watchable

function(watchableArg: Watch<v>){
    watchableArg.ref.a = b; // typescript will think this is ok but the compiler won't realise this is a watchable ref without some kind of annotation
}

$Component
function Component(props: Watch<{}>){
    let a = $Watchable(0);
    a.ref = 2;
    
    let object = $Watchable({a: 0, c: {d: 1}});
    
    object.ref.a++
    
    object = $Watchable() // don't allow
    
    $object.ref.c // should be both watchable and value
    // huh ^^
    $object.ref.c.ref ? //< that seems annoying and is exactly the problem the first version had
    
    object.$.a.b.c
    <Component value={object.$.a} />
    
    // what if we wrote a programming language with static typechecking that compiled to javascript that could do compiletime things with types, so watchable could have transforms on it.
    
    <Component value={$object.ref.a /* this doesn't make it clear that the value is watchable. what if every item had a .$ on it so a.b.c.$ is the watchable a.b.c. let's TestSwitcher (like $bind) /}></Component>
}

// an entirely different direction: proxy mess
^^ bad idea. don't do.

*/

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
