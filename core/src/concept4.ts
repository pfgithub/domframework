import { WatchableBase, isWatch, $ } from "./watchable";

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
    insertBefore: (parentNode: Node, node: ChildNode | null) => void;
    removeSelf: () => void;
    [isExistingNode]: true;
};
type NodeSpec = ExistingNodeSpec | Watch<ExistingNodeSpec>;
type UserNodeSpec = ExistingUserNodeSpec | Watch<ExistingUserNodeSpec>; // a nodespec provided by the user. auto converted into text nodes and fragments as needed.

/*

concept v5
not sure what concept v5 is
ok that's it for concept v5

concept v6
<></>
node removeSelf method DOES NOT node.remove
instead, the parent does if(nodeAfter.parent) node.remove() and childNodeList = childNodeList.filter(...) // watch out with filter

WAIT WHAT
document.createDocumentFragment();
Browser compatibility: literally every browser
oh nvm
let f1 = document.createDocumentFragment();
let f2 = document.createDocumentFragment();
f1.appendChild(document.createTextNode("1"));
f2.appendChild(document.createTextNode("2"));
document.body.appendChild(f1);
document.body.appendChild(f2);
f1.appendChild(document.createTextNode("3")); // does nothing unforunately

// maybe we can use a fragment element until the element has a real parent, then switch to insertBefore

*/

function createNode(spec: UserNodeSpec): ExistingNodeSpec {
    if (nodeIsExisting(spec)) {
        return spec; // already a node, no action to take
    }
    if (isWatch(spec)) {
        // OPTIMIZATION: if prev is text and next is text, just update node.nodeValue
        // OPTIMIZATION: use virtual dom diffing to update nodes wait...
        //               ^< virtual dom is ok as long as updates are very limited in size, which is the whole point of dmf. don't do something like virtual dom diff for updating an entire array.
        let nodeAfter = document.createTextNode("");
        let parentNode: Node = document.createDocumentFragment();
        parentNode.appendChild(nodeAfter);

        let prevUserNode: ExistingUserNodeSpec | undefined = undefined;
        let prevNode: ExistingNodeSpec | undefined = undefined;
        let onchange = () => {
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
        let unregisterWatcher: (() => void) | undefined;
        setTimeout(() => onchange(), 0);
        // it might be fine to onchange immediately;
        // next tick might not be great for performance when inserting large trees

        let nodeHasBeenInserted = false;

        return {
            insertBefore: (parent, after) => {
                if (nodeHasBeenInserted) {
                    throw new Error(
                        "Attempting to insert a node multiple times. This may happen if nodes are reused. This is not supported.",
                    );
                }
                nodeHasBeenInserted = true;
                parent.insertBefore(parentNode, after);
                parentNode = parent;
                unregisterWatcher = spec.watch(onchange);
            },
            removeSelf: () => {
                // call removal handlers
                prevNode && prevNode.removeSelf();
                unregisterWatcher && unregisterWatcher();
                parentNode = document.createDocumentFragment();
                // removeSelf should handle potential reinsertion at a later date
                // however it does not do that right now because the node is removed immediately
                // there is nothing that can be done about that
            },
            [isExistingNode]: true,
        };
    }
    if (typeof spec !== "object") {
        let node = document.createTextNode("" + spec);

        return {
            insertBefore: (parent, after) => {
                console.log("inserting", node, "before", after, "in", parent);
                parent.insertBefore(node, after);
                console.log("...OK");
            },
            removeSelf: () => node.remove(),
            [isExistingNode]: true,
        };
    }
    console.log("!err", spec);
    throw new Error("invalid node spec: (see previous log)");
}

type NodeName = "div" | "input";

type NodeTypeMap = {
    div: HTMLDivElement;
    input: HTMLInputElement;
};

type NodeEvent<T extends NodeName> = Event & { currentTarget: NodeTypeMap[T] };

type BaseNodeAttributes<T extends NodeName> = {
    onInput: (e: NodeEvent<T>) => void;
};

type NodeAttributesMap<T extends NodeName> = {
    div: BaseNodeAttributes<T>;
    input: BaseNodeAttributes<T> & { value: string };
};

type NodeAttributes<T extends NodeName> = BaseNodeAttributes<T>;

function createHTMLNode<T extends NodeName>(
    type: NodeName,
    attrs: Partial<NodeAttributes<NodeName>>,
    // ^ this requires every possible attribute to be predefined and does not allow for dynamically changing attributes. spread props might be complicated. for now, this is acceptable.
    child: ExistingNodeSpec,
): ExistingNodeSpec {
    let node = document.createElement(type);

    if (isWatch(attrs)) {
        throw new Error("rest attributes are not supported yet");
    }

    Object.entries(attrs).forEach(([key, value]) => {
        if (key.startsWith("on")) {
            let eventName = key.slice(2).toLowerCase();
            node.addEventListener(eventName, value as EventListener);
        }
        if (key === "style") {
            throw new Error("setting styles in js is not supported yet");
        }
        node.setAttribute(key, "" + value);
    });

    child.insertBefore(node, null);

    return {
        insertBefore: (parent, after) => parent.insertBefore(node, after),
        removeSelf: () => {
            child.removeSelf();
            node.remove();
        },
        [isExistingNode]: true,
    };
}

function createFragmentNode(children: ExistingNodeSpec[]): ExistingNodeSpec {
    let nodeAfter = document.createTextNode("");
    let parentNode: Node = document.createDocumentFragment();
    parentNode.appendChild(nodeAfter);

    children.forEach(child => {
        console.log(
            "fragment inserting",
            child,
            "into",
            parentNode,
            "before",
            nodeAfter,
        );
        child.insertBefore(parentNode, nodeAfter);
    });

    let nodeHasBeenInserted = false;

    return {
        insertBefore: (parent, after) => {
            console.log("inserting", parentNode, "in", parent, "before", after);
            if (nodeHasBeenInserted) {
                throw new Error(
                    "Attempting to insert a node multiple times. This may happen if nodes are reused. This is not supported.",
                );
            }
            nodeHasBeenInserted = true;
            parent.insertBefore(parentNode, after);
            parentNode = parent;
            console.log("finished insertion. parent is now", parentNode);
        },
        removeSelf: () => {
            // call removal handlers
            children.forEach(child => child.removeSelf());
            parentNode = document.createDocumentFragment();
        },
        [isExistingNode]: true,
    };
}

// function createSVGNode // no svg support for now, that seems complicated

{
    let watchableText = $.createWatchable("initial");

    let node = createNode(watchableText);

    watchableText.$ref = "updated";

    //@ts-ignore
    window.m = () => (watchableText.$ref = "second update");

    let children = createFragmentNode([node]);

    let encapsulatingNode = createHTMLNode("div", {}, children);

    encapsulatingNode.insertBefore(document.body, null);
    console.log("hola");
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
