export { React, ListRender, mount } from "./react";
export { $, List } from "./watchable";
export let $Component: never[] = [];
($Component as any).__on = (fn: any) => {
    fn.__isComponent = true;
};
