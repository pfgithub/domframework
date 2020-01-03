import { WatchableBase, isWatch, $, List } from "./watchable";

export type Watch<T> = WatchableBase<T>;
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

export type primitive = string | number | boolean | bigint | null | undefined;

export type ExistingUserNodeSpec = primitive | CreatableNodeSpec;

const isExistingNode = Symbol("is_existing_node");
let nodeIsExisting = (node: UserNodeSpec): node is NodeSpec =>
    !!(node as any)[isExistingNode];

export type CreatedNodeSpec = {
    removeSelf: () => void;
};
export type CreatableNodeSpec = {
    createBefore: (
        parentNode: Node,
        ___afterOnce: ChildNode | null, // may change after creation. if you rely on this staying the same, make your own after node and use it instead.
    ) => CreatedNodeSpec;
    [isExistingNode]: true;
};
export type NodeSpec = CreatableNodeSpec | Watch<CreatableNodeSpec>;
export type UserNodeSpec = ExistingUserNodeSpec | Watch<ExistingUserNodeSpec>;

export function createNode(spec: UserNodeSpec): CreatableNodeSpec {
    if (nodeIsExisting(spec)) {
        return spec; // already a node, no action to take
    }

    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            if (isWatch(spec)) {
                // OPTIMIZATION: if prev is text and next is text, just update node.nodeValue
                let nodeAfter = document.createTextNode("");
                parent.insertBefore(nodeAfter, ___afterOnce);

                let nodeExists = true;

                let prevUserNode: ExistingUserNodeSpec | undefined = undefined;
                let prevNode: CreatedNodeSpec | undefined = undefined;
                let onchange = () => {
                    console.log("changed, updating", spec);
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
                console.log("watching", spec);
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
                parent.insertBefore(node, ___afterOnce);

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

export type NodeEvent<T extends NodeName> = {
    currentTarget: NodeTypeMap[T];
};

export type BaseNodeAttributes<T extends NodeName> = {
    class: string;
    onClick: (e: MouseEvent & NodeEvent<T>) => void;
    onMouseMove: (e: MouseEvent & NodeEvent<T>) => void;
};

export type NodeName = "div" | "input" | "button" | "span" | "ul" | "li";

export type NodeTypeMap = {
    div: HTMLDivElement;
    input: HTMLInputElement;
    button: HTMLButtonElement;
    span: HTMLSpanElement;
    ul: HTMLUListElement;
    li: HTMLLIElement;
};

type NodeAttributesMap<T extends NodeName> = {
    div: BaseNodeAttributes<T>;
    button: BaseNodeAttributes<T>;
    input: BaseNodeAttributes<T> & {
        value: string;
        type: string;
        checked: boolean;
        onInput: (e: Event & NodeEvent<T>) => void;
    };
    span: BaseNodeAttributes<T>;
    ul: BaseNodeAttributes<T>;
    li: BaseNodeAttributes<T>;
};

export type NodeAttributes<T extends NodeName> = NodeAttributesMap<T>[T];

export function createHTMLNode<T extends NodeName>(
    type: NodeName,
    attrs: Partial<NodeAttributes<NodeName>>,
    // ^ this requires every possible attribute to be predefined and does not allow for dynamically changing attributes. spread props might be complicated. for now, this is acceptable.
    child: CreatableNodeSpec,
): CreatableNodeSpec {
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            let node = document.createElement(type);
            parent.insertBefore(node, ___afterOnce);

            if (isWatch(attrs)) {
                throw new Error("rest attributes are not supported yet");
            }

            Object.entries(attrs).forEach(([key, value]) => {
                if (isWatch(value)) {
                    console.log("watchable attributes are not supported yet");
                    return;
                }
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
                if (key === "children") {
                    return; // skip
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

export function createFragmentNode(
    children: CreatableNodeSpec[],
): CreatableNodeSpec {
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            let nodeAfter = document.createTextNode("");
            parent.insertBefore(nodeAfter, ___afterOnce);

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

export function createListRender<T>(
    list: List<T>,
    cb: (item: /*$*/ T, symbol: symbol) => JSX.Element,
): CreatableNodeSpec {
    return {
        [isExistingNode]: true,
        createBefore(parent, after) {
            let finalNode = document.createTextNode("");
            parent.insertBefore(finalNode, after);

            // let elementToNodeAfterMap = new Map<
            //     T,
            //     { nodeAfter: ChildNode; node: CreatedNodeSpec }
            // >();
            let elementToNodeAfterMap = new Map<
                symbol,
                { nodeAfter: ChildNode; node: CreatedNodeSpec }
            >();
            let removalHandlers: (() => void)[] = [];
            list.forEach((item, symbol) => {
                let resultElement = cb(item, symbol);
                let nodeAfter = document.createTextNode("");
                parent.insertBefore(nodeAfter, finalNode);
                let createdNode = createNode(resultElement).createBefore(
                    parent,
                    nodeAfter,
                );
                elementToNodeAfterMap.set(symbol, {
                    nodeAfter,
                    node: createdNode,
                });
            });
            removalHandlers.push(
                list.onAdd((item, { before, symbol, after }) => {
                    if (elementToNodeAfterMap.get(symbol)) {
                        throw new Error(
                            "was requested to insert an element that already has been inserted",
                        );
                    }
                    let resultElement = createNode(
                        cb((item as unknown) as T, symbol),
                    ); // pretend item is a t when it's actually watchable. users need to put $
                    let nodeAfter = document.createTextNode("");
                    parent.insertBefore(
                        nodeAfter,
                        after
                            ? elementToNodeAfterMap.get(after)?.nodeAfter ||
                                  null
                            : null,
                    );
                    let createdNode = resultElement.createBefore(
                        parent,
                        nodeAfter,
                    );
                    elementToNodeAfterMap.set(symbol, {
                        nodeAfter,
                        node: createdNode,
                    });
                }),
            );
            removalHandlers.push(
                list.onRemove(({ before, symbol, after }) => {
                    let element = elementToNodeAfterMap.get(symbol);
                    if (!element)
                        throw new Error(
                            "was requested to remove an element that doesn't exist",
                        );
                    element.node.removeSelf();
                    element.nodeAfter.remove();
                }),
            );
            return {
                removeSelf: () => {
                    removalHandlers.forEach(rh => rh());
                    elementToNodeAfterMap.forEach((value, key) => {
                        value.node.removeSelf();
                        value.nodeAfter.remove();
                    });
                },
            };
        },
    };
}
