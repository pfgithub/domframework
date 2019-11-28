console.log("It works!");

import "./debug/drawBoxAroundElement";

import {
    watchable_watch,
    watchable_value,
    WatchableBase,
    watchable_cb,
    watchable_data,
    watchable_cleanupfns,
    watchable_setup,
    watchable_emit,
    watchable_cleanup,
    Watchable,
    List,
    WatchableThing
} from "./watchable";

declare global {
    interface Window {
        onNodeUpdate: (node: Node) => void;
        startHighlightUpdates: () => void;
    }
}

window.onNodeUpdate = () => {};
// window.onNodeUpdate = (node: Node) => console.log("NODE UPDATED:", node);

// note that we are going to have problems with watchers not getting unregistered. elements need to return destructors and these need to be called on element removal.

export interface WatchableComponent extends Watchable<ComponentModel> {}

export type ExistingComponentModel = {
    node: ChildNode /*[]*/;
    removeSelf: () => void;
};
export type ComponentModel =
    | ExistingComponentModel
    | string
    | WatchableComponent;

export function isWatchable<T>(v: T | Watchable<T>): v is Watchable<T> {
    return !!(v as any)[watchable_watch];
}

export function createComponent(
    c: ComponentModel,
    insert: (node: Node) => void
): { finalNode: Node; removeSelf: () => void } {
    if (typeof c !== "object") {
        let textNode = document.createTextNode("" + c);
        insert(textNode);
        window.onNodeUpdate(textNode);
        return { finalNode: textNode, removeSelf: () => textNode.remove() };
    }
    if (isWatchable(c)) {
        let finalNode = document.createTextNode(""); // nodes are inserted before this node
        insert(finalNode);
        let removalFunctions: (() => void)[] = [];
        let o = 0;
        let updateValue = (model: ComponentModel) => {
            if (o++) console.log("UPDATE VALUE WAS CALLED BY WATCHABLE");
            // clear outdated nodes
            removalFunctions.map(rf => rf());
            removalFunctions = [];
            // create new nodes
            let { removeSelf } = createComponent(model, node =>
                finalNode.parentNode!.insertBefore(node, finalNode)
            );
            removalFunctions.push(removeSelf);
        };
        let unwatch = c[watchable_watch](updateValue);
        let currentModel = c[watchable_value]();
        updateValue(currentModel);
        window.onNodeUpdate(finalNode);
        return {
            finalNode,
            removeSelf: () => {
                unwatch();
                finalNode.remove();
                removalFunctions.map(rf => rf());
            }
        };
    }
    insert(c.node);
    window.onNodeUpdate(c.node);
    return {
        finalNode: c.node,
        removeSelf: () => {
            c.node.remove();
            c.removeSelf();
        }
    };
}

export const d = (
    componentName: string | ((props: {}) => ExistingComponentModel),
    props: {
        [key: string]:
            | string
            | number
            | ((...a: any[]) => void)
            | Watchable<string | number | ((...a: any[]) => void)>;
    },
    ...children: ComponentModel[]
): ExistingComponentModel => {
    if (typeof componentName === "function") {
        return componentName({ children, ...props });
    }
    let element = document.createElement(componentName);
    let removalHandlers: (() => void)[] = [];
    let nodeCreationHandler: Function | undefined;
    if (props)
        Object.keys(props).map(prop => {
            if (prop === "nodecreated") {
                nodeCreationHandler = props[prop] as Function;
                return;
            }
            let a: any = props[prop];
            if (a[watchable_watch]) {
                removalHandlers.push(
                    a[watchable_watch]((v: any) => {
                        if ((element as any)[prop] !== v)
                            (element as any)[prop] = v;
                        // notify prop update
                        window.onNodeUpdate(element);
                    })
                );
                let current = a[watchable_value]();
                (element as any)[prop] = current;
                return;
            }
            (element as any)[prop] = a;
        });
    if (children)
        children.map(c => {
            removalHandlers.push(
                createComponent(c, node => element.appendChild(node)).removeSelf
            );
        });
    window.onNodeUpdate(element);
    if (nodeCreationHandler) nodeCreationHandler(element); // maybe nodecreationhandler should return removal functions
    return {
        node: element,
        removeSelf: () => removalHandlers.forEach(h => h())
    };
    // children:map child addChild(...)
    // props:map prop // find watch() functions (these can change props based on values changing)
    // bind value changes to watch
};

export let React = { createElement: d };

// type RealOrWatchable<T> = T | Watchable<T>;

export function textNode(
    v: string | Watchable<string>
): ExistingComponentModel {
    let textValue = isWatchable(v) ? v[watchable_value]() : v;
    let node = document.createTextNode(textValue);
    let removalHandlers: (() => void)[] = [];
    if (isWatchable(v)) {
        removalHandlers.push(
            v[watchable_watch](nv => {
                if (node.nodeValue !== nv) node.nodeValue = nv;
                window.onNodeUpdate(node);
            })
        );
    }
    return {
        node,
        removeSelf: () => {
            console.log("removing", removalHandlers);
            removalHandlers.map(h => h());
        }
    };
}

export type RealOrWatchable<T> = T | Watchable<T>;

export type OptionalProps<T> = { [key in keyof T]?: RealOrWatchable<T[key]> };

export type TagNameToPropsMap = {
    [elemName in keyof HTMLElementTagNameMap]: OptionalProps<
        HTMLElementTagNameMap[elemName] & {
            children: ComponentModel[] | ComponentModel;
            nodecreated: (node: HTMLElementTagNameMap[elemName]) => void;
        }
    >;
};

declare global {
    namespace JSX {
        interface IntrinsicElements extends TagNameToPropsMap {}
        interface Element extends ExistingComponentModel {}
    }
}

export function ListRender<T>(list: List<T>, cb: (item: T) => JSX.Element) {
    let baseNode = d("div", {});
    let symbolToNodeAfterMap = {};
    let removalHandlers = [];
    removalHandlers.push(
        list.onAdd(
            (
                item: WatchableThing<T>,
                {
                    before,
                    symbol,
                    after
                }: { before: symbol; symbol: symbol; after: symbol }
            ) => {
                let resultElement = cb((item as unknown) as T);
                if (!symbolToNodeAfterMap[after])
                    baseNode.node.appendChild(resultElement.node);
                else
                    baseNode.node.insertBefore(
                        symbolToNodeAfterMap[after],
                        resultElement.node
                    );
                symbolToNodeAfterMap[symbol] = resultElement;
            }
        )
    );
    removalHandlers.push(
        list.onRemove(
            (
                item: WatchableThing<T>,
                {
                    before,
                    symbol,
                    after
                }: { before: symbol; symbol: symbol; after: symbol }
            ) => {
                let element = symbolToNodeAfterMap[symbol];
                element.removeSelf();
            }
        )
    );
    let existingRemove = baseNode.removeSelf;
    baseNode.removeSelf = () => {
        existingRemove();
        removalHandlers.forEach(rh => rh());
    };
    return baseNode;
}

// TODO componentmodel is:
// insert: (nodeAfter: Node) => {}
// remove: () => {}
