let is_watch = Symbol("is_watch");

class Watch<T> {
    _cb: () => T;
    _afterch: (() => void)[] = [];
    constructor(watchlist: Watchable[], cb: () => T) {
        this._cb = cb;
    }
    // watch(handler) -> removeHandler()
    watch(handler: () => void): () => void {
        // this should only get watched once so it shouldn't matter
        this._afterch.push(handler);
        return () => (this._afterch = this._afterch.filter(q => q !== handler));
    }
    getValue() {
        return this._cb();
    }
    get [is_watch]() {
        return true;
    }
}

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

type UserNodeSpec = primitive | ExistingNodeSpec;

type ExistingNodeSpec = {
    nodes: Node[];
    insertBefore: (parentNode: ChildNode, node: ChildNode) => void;
    removeSelf: () => void;
};
type NodeSpec = ExistingNodeSpec | Watch<NodeSpec>;

// <div>
//     <></> // Fragment returns UserNodeSpec
//     {a ? <></> : <div></div>} // Watchable returns UserNodeSpec
//     {a ? [<div></div>] : <div></div>} // Does not return array. If you need an array, use ...{}
// </div>

export let React = {
    Fragment(props, ...children) {
        let nodeAfter = document.createTextNode("");
        return {
            insertBefore(node: ChildNode) {}
        };
    },
    TextNode(text: primitive | Watch<primitive>) {
        let node = document.createTextNode("");
        let onch = (newtext: primitive) => {
            node.nodeValue = "" + newtext;
        };
        let removalHandlers: (() => void)[] = [];
        if (text.watchable) {
            removalHandlers.push(
                text.watch(nv => {
                    onch(nv);
                })
            );
            onch(text.getCurrent());
        } else {
            onch(text);
        }
        return {
            nodes: [node],
            insertBefore: (parent, before) => {
                parent.insertBefore(node, before);
            },
            removeSelf: () => removalHandlers.forEach(handler => handler())
        };
    },
    createElement(
        name: string,
        props: {},
        ...children: (UserNodeSpec | Watch<UserNodeSpec>)[]
    ) {
        let parentNode = document.createElement(name);

        let removalHandlers = [];

        // attributes (fun)

        children.forEach(childv_ => {
            let childv: NodeSpec | Watch<NodeSpec>;
            // maybe if array, childv = React.Fragment ?
            if (typeof childv_ !== "object") {
                childv = React.TextNode(childv);
            } else {
                childv = childv_;
            }

            let finalNode = document.createTextNode("");
            parentNode.appendChild(finalNode);

            let existingV;
            let onch = (nv: UserNodeSpec) => {
                // this happens for example if {a ? <></> : <div></div>} changes
                // clear existing
                existingV && existingV.removeSelf();
                // add new
                nv.insertBefore(parentNode, finalNode);
                // set
                existingV = nv;
            };
            if (childv.watchable) {
                removalHandlers.push(childv.onChange(onch));
                onch(childv.getCurrent());
            } else {
                onch(childv);
            }
        });

        return {
            insertBefore(parent, final) {
                parent.insertBefore(finalNode, final);
            },
            removeSelf() {
                finalNode.remove();
            }
        };
    }
};
