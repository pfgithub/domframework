export class WatchableObject<T> {
	actualObject: T;
	constructor(initialValue: T){
		this.actualObject = initialValue;
	}
	get value(){
		return this.actualObject;
	}
	set value(nv: T){
		this.actualObject = nv;
		// notify change.
	}
}

/*
example usage:

let $a = new WatchableObject({a: 1});
$a.watchGet("a").onChange(() => {
	console.log("watchget triggers");
});
// defer $0.remove();
$a.onChange(() => {
	console.log("global change listener triggers");
});
// defer $0.remove();

$a.update({b: 2});
// global change listener triggers
// watchget DOES NOT trigger.

$a.diffUpdate({b: 2});
// global change listener triggers
// watchget triggers

example usage (transformed)

let $obj = {state: "loading", progress: 5};

$.update(() => {
	if($obj.state === "loading"){
		return <div>Progress: {$obj.progress}</div>
	}
	return <div>Done loading!</div>;
})

$obj.progress++;
// the progress updates and passes because the value is different. the main triggers but because it finds the same path, it short-circuits.
// the main does not trigger (it is watching for $obj.state changes, not $obj.progress or $obj).

$obj = {state: "loading", progress: 10};
// progress is not called to update. the main triggers but because it finds the same path, short-circuits and does not update. That's not ok. FIX.
// what should happen is that the main updates and rerenders the whole div.

$obj.watchGet("progress").value ++;

// or we could replicate the old one but store real data


*/