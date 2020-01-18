type Traverse$<T> = {[key in keyof T]: Traverse$<T[key]>} & {$: Watch<T>}
type Watch<T> = {ref: Traverse$<T>}

declare let abc: Watch<{a: 5, b: "6"}>
let number = abc.ref.a
number++;

declare let quadStateLoader: Watch<{
	state: "init"
} | {
	state: "load",
	progress: number
} | {
	state: "done",
	result: {a: 1}
} | {
	state: "error",
	message: string
}>

if(quadStateLoader.ref.state === "done"){
	console.log(quadStateLoader.ref.)
}

// no, this will not work.

// what if we remove .ref?

type WatchNoRef<T> = Traverse$<T>

declare let quadStateLoader2: WatchNoRef<{
	state: "init"
} | {
	state: "load",
	progress: number
} | {
	state: "done",
	result: {a: 1}
} | {
	state: "error",
	message: string
}>

if(quadStateLoader2.state === "done"){
	console.log(quadStateLoader2.)
	// nope.
	// this type of guard is really important.
}