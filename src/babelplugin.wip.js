/*demo code:
return <div>{<p>{key.value.$ref + "-" + value.value.$ref + cb(name.$ref)}</p>}</div>
*/

// export default function(babel) {
//   const { types: t } = babel;
//
//   return {
//     name: "ast-transform", // not required
//     visitor: {
//       Identifier(path) {
//         path.node.name = path.node.name
//           .split("")
//           .reverse()
//           .join("");
//       }
//     }
//   };
// }

// babylon 7 transformer

export default function(babel) {
    const { types: t } = babel;

    return {
        name: "ast-transform", // not required
        visitor: {
            JSXExpressionContainer(path) {
                let watchables = [];
                path.traverse({
                    JSXExpressionContainer(path) {
                        path.skip();
                    },
                    // maybe skip in functions? no reason for callbacks to become watchable.
                    // callExpression // if equals watch // path.skip()
                    CallExpression(path) {
                        if (path.node.callee.type === "Identifier") {
                            if (path.node.callee.name === "watch") {
                                path.skip();
                            }
                        }
                    },
                    MemberExpression(path) {
                        //path.skip(); // what if you said string.$ref.toLowerCase()
                        if (path.node.property.type === "Identifier") {
                            if (path.node.property.name === "$ref") {
                                watchables.push(path.node.object);
                                path.node.property.name = "ref";
                            }
                        }
                    }
                });
                console.log("FOUND WATCHABLES:", watchables, path);
                if (watchables.length <= 0) {
                    // nothing to do. don't skip.
                    return;
                }
                path.node.expression = t.callExpression(t.identifier("watch"), [
                    t.arrayExpression(watchables),
                    t.arrowFunctionExpression([], path.node.expression)
                ]);
                // t.callExpression(
                //     t.identifier("watch"),
                //     t.arrayExpression({ elements: watchables }),
                //     t.arrowFunctionExpression(/*body: path.node*/)
                // );
            }
        }
    };
}

// export function a(context) {
//   return {
//     JSXExpressionContainer(node, ...a) {
//       console.log(node, ...a);
//       let expression = node.expression;
//       let resultWatchables = [];
//       let MemberExpressionVisitor = {
// 		  JSXExpressionContainer(path){
// 			  path.skip();
// 		  }
//         MemberExpression(path) {
// 			path.skip();
//         }
//       };
//       console.log(context);
//       //node.expression.traverse(MemberExpressionVisitor);
//       // search inside for MemberExpression .property.name === "$ref",
//       // add MemberExpression.object to watch
//       /*context.report({
//         node,
//         message: "Do not use template literals",
//
//         fix(fixer) {
//           //console.log(fixer);
//           // search inside for anything .$ref
//           // don't search inside another jsxexpressioncontainer,
//           // each jsxexpressioncontainer gets its own watch statement
//           //if (node.expressions.length) {
//           //  // Can't auto-fix template literal with expressions
//           //  return;
//           //}
//
//           //return [
//           //  fixer.replaceTextRange([node.start, node.start + 1], '"'),
//           //  fixer.replaceTextRange([node.end - 1, node.end], '"'),
//           //];
//         }
//       });*/
//     }
//   };
// }
