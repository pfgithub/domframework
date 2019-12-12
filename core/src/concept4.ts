import { WatchableBase, isWatch } from "./watchable";

type Watch<T> = WatchableBase<T>;
// or WatchableDependencyList but why restrict it?
// watchabledependencylist is the only thing that will actually be used

// real fragments should be possible
// nodes should return
let q: () => {
    nodes: Node[];
    insertBefore: (parent: ChildNode, before: ChildNode) => void;
};
// the mounter should call back to the node
// with the node after
// (this will use lots of blank text nodes but those can)
// (          be optimized later                        )

type primitive = string | number | boolean | bigint | null | undefined;

type ExistingUserNodeSpec = primitive | ExistingNodeSpec;

const isExistingNode = Symbol("is_existing_node");
let nodeIsExisting = (node: UserNodeSpec): node is NodeSpec =>
    !!(node as any)[isExistingNode];

type ExistingNodeSpec = {
    insertBefore: (parentNode: ChildNode, node: ChildNode) => void;
    removeSelf: () => void;
    [isExistingNode]: true;
};
type NodeSpec = ExistingNodeSpec | Watch<ExistingNodeSpec>;
type UserNodeSpec = ExistingUserNodeSpec | Watch<ExistingUserNodeSpec>; // a nodespec provided by the user. auto converted into text nodes and fragments as needed.

/*

concept v5
not sure what concept v5 is
ok that's it for concept v5

*/

function createNode(spec: UserNodeSpec): ExistingNodeSpec {
    if (nodeIsExisting(spec)) {
        return spec; // already a node, no action to take
    }
    if (isWatch(spec)) {
        // OPTIMIZATION: if prev is text and next is text, just update node.nodeValue
        let nodeAfter = document.createTextNode("" + spec);
        let parentNode = undefined; //
        let prevUserNode: ExistingUserNodeSpec | undefined = undefined;
        let prevNode: ExistingNodeSpec | undefined = undefined;
        let onchange = () => {
            if (!parentNode) {
                return; /*there is no parent node ; we can't do anything very useful...*/
            }
            // if equals previous value, do nothing
            let newUserNode = spec.$ref;
            if (prevUserNode === newUserNode) return; // nothing to do;
            // remove existing node
            if (prevNode) prevNode.removeSelf();
            // create real nodes
            let newNode = createNode(newUserNode);
            prevNode = newNode;
            newNode.insertBefore(parentNode, nodeAfter);
        };

        return;
    }
    let node = document.createTextNode("" + spec);
    return {
        insertBefore: (parent, after) => parent.insertBefore(node, after),
        removeSelf: () => node.remove(),
        [isExistingNode]: true,
    };
}

// <div>
//     <></> // Fragment returns UserNodeSpec
//     {a ? <></> : <div></div>} // Watchable returns UserNodeSpec
//     {a ? [<div></div>] : <div></div>} // Does not return array. If you need an array, use ...{}
// </div>

// export let React = {
//     userNodeToRealNode(node: UserNodeSpec) {
//         if (isWatch(node)) {
//         }
//     },
//     Fragment(props: {}, ...children: UserNodeSpec[]): ExistingNodeSpec {
//         let nodeAfter = document.createTextNode("");
//         let nodes: ChildNode[] = [];
//         return {
//             nodes: nodes,
//             insertBefore(node: ChildNode) {},
//             removeSelf: () => {},
//         };
//     },
//     TextNode(text: string | Watch<string>): ExistingNodeSpec {
//         let node = document.createTextNode("");
//         let onch = (newtext: primitive) => {
//             // check if text is the same as before. if so, do nothing.
//             node.nodeValue = "" + newtext;
//         };
//         let removalHandlers: (() => void)[] = [];
//         if (isWatch(text)) {
//             // this will probably end up unused because userNodeToRealNode doesn't know if something is just text once or will always be text
//             removalHandlers.push(
//                 text.watch(() => {
//                     onch(text.$ref);
//                 }),
//             );
//             onch(text.$ref);
//         } else {
//             onch(text);
//         }
//         return {
//             nodes: [node],
//             insertBefore: (parent, before) => {
//                 parent.insertBefore(node, before);
//             },
//             removeSelf: () => removalHandlers.forEach(handler => handler()),
//         };
//     },
//     createElement(
//         name: string,
//         props: {},
//         ...children: (UserNodeSpec | Watch<UserNodeSpec>)[]
//     ): ExistingNodeSpec {
//         let parentNode = document.createElement(name);
//
//         let removalHandlers = [];
//
//         // attributes (fun)
//
//         children.forEach(childv_ => {
//             let childv: NodeSpec | Watch<NodeSpec>;
//             // maybe if array, childv = React.Fragment ?
//             if (typeof childv_ !== "object") {
//                 childv = React.TextNode(childv);
//             } else {
//                 childv = childv_;
//             }
//
//             let finalNode = document.createTextNode("");
//             parentNode.appendChild(finalNode);
//
//             let existingV;
//             let onch = (nv: UserNodeSpec) => {
//                 // check if nv is the same as before. if so, do nothing.s
//                 // this happens for example if {a ? <></> : <div></div>} changes
//                 // clear existing
//                 existingV && existingV.removeSelf();
//                 // add new
//                 nv.insertBefore(parentNode, finalNode);
//                 // set
//                 existingV = nv;
//             };
//             if (childv.watchable) {
//                 removalHandlers.push(childv.onChange(onch));
//                 onch(childv.getCurrent());
//             } else {
//                 onch(childv);
//             }
//         });
//
//         return {
//             insertBefore(parent, final) {
//                 parent.insertBefore(finalNode, final);
//             },
//             removeSelf() {
//                 finalNode.remove();
//             },
//         };
//     },
// };
