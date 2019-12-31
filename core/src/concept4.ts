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

type ExistingCreatedNodeSpec = {
    removeSelf: () => void;
};
type ExistingNodeSpec = {
    createBefore: (
        parentNode: Node,
        after: ChildNode | null,
    ) => ExistingCreatedNodeSpec;
    [isExistingNode]: true;
};
type NodeSpec = ExistingNodeSpec | Watch<ExistingNodeSpec>;
type UserNodeSpec = ExistingUserNodeSpec | Watch<ExistingUserNodeSpec>;

function createNode(spec: UserNodeSpec): ExistingNodeSpec {
    if (nodeIsExisting(spec)) {
        return spec; // already a node, no action to take
    }

    return {
        [isExistingNode]: true,
        createBefore(parent, after) {
            if (isWatch(spec)) {
                // OPTIMIZATION: if prev is text and next is text, just update node.nodeValue
                let nodeAfter = document.createTextNode("");
                parent.insertBefore(nodeAfter, after);

                let nodeExists = true;

                let prevUserNode: ExistingUserNodeSpec | undefined = undefined;
                let prevNode: ExistingCreatedNodeSpec | undefined = undefined;
                let onchange = () => {
                    if (!nodeExists) {
                        console.log(
                            "!!ERROR: Node updated after removal, even though the watcher was unregistered. This should never happen.!",
                        );
                        return;
                    }
                    // if equals previous value, do nothing
                    let newUserNode = spec.$ref;
                    if (prevUserNode === newUserNode) return; // nothing to do;
                    // remove existing node
                    if (prevNode) prevNode.removeSelf();
                    // create real nodes
                    let newNode = createNode(newUserNode);
                    prevNode = newNode.createBefore(parent, nodeAfter);
                };
                let unregisterWatcher = spec.watch(onchange);
                setTimeout(() => onchange(), 0);
                // it might be fine to onchange immediately;
                // next tick might not be great for performance when inserting large trees

                return {
                    removeSelf: () => {
                        // call removal handlers
                        prevNode && prevNode.removeSelf();
                        unregisterWatcher && unregisterWatcher();
                        nodeExists = false;
                        console.log("Node removing");
                    },
                };
            }
            if (typeof spec !== "object") {
                let node = document.createTextNode("" + spec);
                parent.insertBefore(node, after);

                return {
                    removeSelf: () => node.remove(),
                    [isExistingNode]: true,
                };
            }
            console.log("!err", spec);
            throw new Error("invalid node spec: (see previous log)");
        },
    };
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
    return {
        [isExistingNode]: true,
        createBefore(parent, after) {
            let node = document.createElement(type);
            parent.insertBefore(node, after);

            if (isWatch(attrs)) {
                throw new Error("rest attributes are not supported yet");
            }

            Object.entries(attrs).forEach(([key, value]) => {
                if (key.startsWith("on")) {
                    let eventName = key.slice(2).toLowerCase();
                    node.addEventListener(eventName, value as EventListener);
                    return;
                }
                if (key === "style") {
                    throw new Error(
                        "setting styles in js is not supported yet",
                    );
                }
                node.setAttribute(key, "" + value);
            });

            let createdChild = child.createBefore(node, null);

            return {
                removeSelf: () => {
                    createdChild.removeSelf();
                    node.remove();
                },
                [isExistingNode]: true,
            };
        },
    };
}

function createFragmentNode(children: ExistingNodeSpec[]): ExistingNodeSpec {
    return {
        [isExistingNode]: true,
        createBefore(parent, after) {
            let nodeAfter = document.createTextNode("");
            parent.insertBefore(nodeAfter, after);

            let createdChildren = children.map(child => {
                console.log(
                    "fragment inserting",
                    child,
                    "into",
                    parent,
                    "before",
                    nodeAfter,
                );
                return child.createBefore(parent, nodeAfter);
            });

            return {
                removeSelf: () => {
                    // call removal handlers
                    createdChildren.forEach(child => child.removeSelf());
                },
                [isExistingNode]: true,
            };
        },
    };
}

// function createSVGNode // no svg support for now, that seems complicated

{
    let watchableText = $.createWatchable("initial");

    let node = createNode(watchableText);

    watchableText.$ref = "updated";

    //@ts-ignore
    window.m = () => {
        watchableText.$ref = "second update";
        console.log(watchableText);
    };

    let children = createFragmentNode([node]);

    let encapsulatingNode = createHTMLNode("div", {}, children);

    encapsulatingNode.createBefore(document.body, null);
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
