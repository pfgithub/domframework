import {
    WatchableBase,
    isWatch,
    $,
    List,
    objectShallowDiff,
    RemovalHandler,
} from "./watchable";

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

declare global {
    interface Window {
        onNodeUpdate: ((node: Node) => void) | undefined;
    }
}

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
                    prevUserNode = newUserNode;
                    // remove existing node
                    if (prevNode) prevNode.removeSelf();
                    // create real nodes
                    let newNode = createNode(newUserNode);
                    prevNode = newNode.createBefore(parent, nodeAfter);

                    window.onNodeUpdate && window.onNodeUpdate(parent);
                };
                let unregisterWatcher = spec.watch(onchange);
                console.log("watching", spec);
                onchange();

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
    onKeyPress: (e: KeyboardEvent & NodeEvent<T>) => void;
    dmfOnMount: (node: NodeTypeMap[T]) => void;
    dmfRest: Watch<NodeAttributes<T>>;
};

export type NodeName = "div" | "input" | "button" | "span" | "ul" | "li" | "h1";

export type NodeTypeMap = {
    div: HTMLDivElement;
    input: HTMLInputElement;
    button: HTMLButtonElement;
    span: HTMLSpanElement;
    ul: HTMLUListElement;
    li: HTMLLIElement;
    h1: HTMLHeadingElement;
};

type NodeAttributesMap<T extends NodeName> = {
    div: BaseNodeAttributes<T>;
    button: BaseNodeAttributes<T>;
    input: BaseNodeAttributes<T> & {
        value: string;
        type: string;
        checked: boolean;
        onInput: (e: Event & NodeEvent<T>) => void;
        placeholder: string;
    };
    span: BaseNodeAttributes<T>;
    ul: BaseNodeAttributes<T>;
    li: BaseNodeAttributes<T>;
    h1: BaseNodeAttributes<T>;
};

export type NodeAttributes<T extends NodeName> = NodeAttributesMap<T>[T];

type PossibleValues<T> = T extends { [key: string]: infer U } ? U : never;
function getInfer<T>(object: { [key: string]: T }, key: string) {
    return object[key] as T;
}

export function createHTMLNode<T extends NodeName>(
    type: NodeName,
    attrs: Partial<NodeAttributes<NodeName>>,
    // ^ Watchable<Partial<NodeAttributes<NodeName>>>
    child: CreatableNodeSpec,
): CreatableNodeSpec {
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            let node = document.createElement(type);

            // !!! TODO:: attrs is a normal (not watchable) object containing dmfRest which is a watchable object. when dmfRest changes, objectShallowDiff is used to choose what updates.

            let prevAttrs: Partial<NodeAttributes<NodeName>> = {};
            let eventHandlers = new Map<string, EventListener>();
            let removalHandlers = new Map<string, RemovalHandler>();
            // !!! memory: move this outside. no reason to make a new one with every node.

            let setAttribute = (
                key: string,
                value: PossibleValues<typeof attrs>,
            ) => {
                if (removalHandlers.has(key)) {
                    removalHandlers.get(key)!();
                    removalHandlers.delete(key);
                }
                if (value instanceof WatchableBase) {
                    removalHandlers.set(
                        key,
                        value.watch(() => {
                            if (!(value instanceof WatchableBase)) {
                                throw new Error("typescript");
                            }
                            let resv = value.$ref;
                            if (resv instanceof WatchableBase) {
                                throw new Error(
                                    "watchable is watchable. not good. this should never happen.",
                                );
                            }
                            setAttributeNotWatchable(key, resv as any);
                        }),
                    );
                    setAttributeNotWatchable(key, value.$ref as any);
                    return;
                }
                setAttributeNotWatchable(key, value);
            };
            let setAttributeNotWatchable = (
                key: string,
                value: PossibleValues<typeof attrs>,
            ) => {
                if (key.startsWith("on")) {
                    // !!! TODO support {capture: true} and {passive: true} and maybe even default to passive
                    let eventName = key.slice(2).toLowerCase();
                    let prevHandler = eventHandlers.get(eventName);
                    if (prevHandler) {
                        if (prevHandler) {
                            node.removeEventListener(eventName, prevHandler);
                        }
                    }
                    if (value !== undefined) {
                        let listener = value as EventListener;
                        eventHandlers.set(eventName, listener);
                        node.addEventListener(eventName, listener);
                    }
                } else if (key === "style") {
                    throw new Error("setting style is not supported yet");
                } else if (key === "dmfOnMount") {
                    (value as any)(node);
                } else if (key in node) {
                    (node as any)[key] = value;
                } else {
                    if (value === undefined) node.removeAttribute(key);
                    else node.setAttribute(key, "" + value);
                }
            };
            let onchange = (attrs: Partial<NodeAttributes<NodeName>>) => {
                let diff = objectShallowDiff(prevAttrs, attrs);
                for (let [key, state] of diff) {
                    if (state === "unchanged") continue;
                    let value = getInfer(attrs, key);
                    if (state === "removed") value = undefined;
                    if (key === "children" && state !== "added") {
                        throw new Error(
                            "children property cannot be changed in a real html node using the children attribute. pass an unchanging fragment instead that has children that change. (state was " +
                                state +
                                ")",
                        );
                    }
                    if (key === "children") {
                        continue;
                    }

                    setAttribute(key, value);
                }
            };
            let removeWatcher: RemovalHandler | undefined;

            if (attrs.dmfRest) {
                if (isWatch(attrs.dmfRest)) {
                    onchange({ ...attrs, ...attrs.dmfRest!.$ref });
                    removeWatcher = attrs.dmfRest.watch(() => {
                        onchange({ ...attrs, ...attrs.dmfRest!.$ref });
                    });
                } else {
                    onchange({ ...attrs, ...(attrs.dmfRest as any) });
                }
            } else {
                onchange(attrs);
            }

            let createdChild = child.createBefore(node, null);
            parent.insertBefore(node, ___afterOnce);

            return {
                removeSelf: () => {
                    removeWatcher && removeWatcher();
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
                        return; // onadd happens a tick delayed for performance (so that list .insert is fast in case lots of list manipulations are being done at once).
                    }
                    let resultElement = createNode(
                        cb((item as unknown) as T, symbol),
                    ); // pretend item is a t when it's actually watchable. users need to put $
                    let nodeAfter = document.createTextNode("");
                    parent.insertBefore(
                        nodeAfter,
                        after
                            ? elementToNodeAfterMap.get(after)?.nodeAfter ||
                                  finalNode
                            : finalNode,
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
