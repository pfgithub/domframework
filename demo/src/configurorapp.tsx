"dmf prefix $";

import { React, ListRender, $, $bind, List, mount } from "dmf";

$;
React;

declare let $Component: void;

// ---

export type i3ConfigurationItem = {
	type: keyof i3ConfigurationItem;
	bindsym?: {
		keybind: string;
		action: string;
	};
	exec?: {
		startupId: boolean;
		program: string;
	};
};

export function I3Config(){
	const $configurationItems: i3ConfigurationItem[] = []; // we need array support. lists are ok but arrays are necessary, even if that means some very minimal diffing (O(n) new instead of O(1) old on inserts, O(0) dmf instead of O(n) react on child change)
	
	$Component;
	return <div>{$configurationItems.map(item => {
		// how?
		// conditions are checked to see if they change
		// if they are unchanged, the dom array insert algorithm won't recreate them
		// dom array insert will be stateful (it will keep a map of previous items or something and use it to create, delete, and reposition items)
		// list will be removed (it is better for performance but not useable in real code)
		
		// re-explanation:
		// what will happen is that because this is a component, most of the time it will be returning its saved value and not executing any code
		// that way the map is basically looping over the array and returning the same thing it did last time (unless there are some ifs or new items)
		// dmf dom.ts will know that last time this node was an array and use an array diffing function to find what changed. then it will update the dom based on that.
		// if dom.ts didn't have an array before, it will create it as new.
		// if it had an array and got a new item, it will do standard remove and create.
		
		// potential issues:
		// tracking list changes
		// .push(), .pop(), v = [], ...
		// initially let's only support v = [] and then we can add impure functions later like sort and push and ...
		
		$Component;
		return <ConfigItem item={item} />
	})}</div>
}