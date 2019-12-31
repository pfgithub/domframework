import * as dom from "./concept4";

type IntrinsicElementsMap = {
    [key in dom.NodeName]: Partial<dom.NodeAttributes<key>>;
};

declare global {
    namespace JSX {
        interface IntrinsicElements extends IntrinsicElementsMap {}
        type Element = dom.UserNodeSpec;
    }
}

export type GenericAttributes = any;

export type FunctionalComponent = (props: GenericAttributes) => JSX.Element;

export const React = {
    createElement: (
        componentCreator: dom.NodeName | FunctionalComponent,
        props: any, // !!! spread props
        ...children: JSX.Element[]
    ): JSX.Element => {
        console.log("creating element", componentCreator, props, children);
        if (!props) props = {};
        if (typeof componentCreator === "string") {
            let nodeName = componentCreator;
            componentCreator = (attrs: GenericAttributes) =>
                dom.createHTMLNode(nodeName, attrs, attrs.children);
        }
        let finalProps = {
            ...props,
            // !!! performance don't create a fragment if there are no children
            children: dom.createFragmentNode(
                children.map((child: JSX.Element) => {
                    console.log("adding", child, "to", "children");
                    return dom.createNode(child);
                }),
            ),
        }; // does not support spread props
        console.log("creating component using finalprops", finalProps);
        return componentCreator(finalProps);
    },
    Fragment: (props: { children?: JSX.Element[] }) => {
        let children = props.children || [];
        return dom.createFragmentNode(
            children.map(child => {
                return dom.createNode(child);
            }),
        );
    },
};

export function mount(
    element: JSX.Element,
    parent: Node,
    before?: ChildNode | null,
) {
    dom.createNode(element).createBefore(parent, before || null);
}

const CustomComponent: FunctionalComponent = props => {
    console.log(props);
    return (
        <input
            type="password"
            onInput={e => console.log(e.currentTarget.value)}
        />
    );
};

{
    let el = (
        <div>
            text. some more text. <CustomComponent /> <CustomComponent />
        </div>
    );
    mount(el, document.body);
    mount("hi", document.body);
}
