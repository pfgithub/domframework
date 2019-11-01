// /*
//
// model ExampleComponent = (data) => <><button onClick={() => data.v.ref++}>Incr.</button> v: {data.v}</>
//
// let data = watchify({v: 5});
// setup(ExampleComponent, data);
//
// */
//
// class Component{
//
// }
//
// class ExampleComponent extends Component{
// 	root: HTMLDivElement
// 	count: number;
// 	constructor(point: HTMLElement){
// 		super();
// 		this.count = 0;
// 		// builds the element and adds it to dom
// 		this.root = document.createElement("div");
// 		let paragraph = document.createElement("p");
// 		paragraph.innerText = "clicked ";
// 		// clicked, () => this.count, times
// 		// when this.count changes, paragraph.innertext will change.
// 		let button = document.createElement("button");
// 		button.addEventListener("click", () => this.increment());
//
// 		this.root.appendChild(paragraph);
// 		this.root.appendChild(button);
// 	}
// 	mount(point: HTMLElement){
// 		// mounts ourself to the point
// 		point.appendChild(this.root);
// 	}
// 	increment(){
//
// 	}
//
// }
//
//
// /*
//
//
// class Modal{
//
// <div className="modal">
//
// </div>
//
//
//
// }
//
//
// class App{
//
// <div>
// <div classname='modalspace'>
// this.modalInsertionPoint
// </div>
// <button onclick={() => this.modalOpenClicked()}>Open Modal</button>
// </div>
//
//
// modalOpenClicked(){
//
// this.modalInsertionPoint.insert(new Modal());
//
// }
//
// }
//
// */
//
//
// /*
//
// <AceEditor onchange={() => this.editorChanged} />
// <Toggleable ip={this.loadingIndicator}></Toggleable>
// <ShortcutPreview ip={this.shortcutPreview}>
//
//
//
// editorChanged()
//  this.loadingIndicator.enable()
//
//  this.shortcutPreview.update(newData)
//
//
//
//
// */
//
//
// /*
//
// // The editor you build yourself
// How it works:
// By defualt there are two keybinds:
// - Press a letter without a modifier to insert that letter
// - Press an unbound key to assign it a binding
// As you use the editor, you define the bindings you need the way you are used to them.
// For example, if you press ctrl s you can set it to save
//
// // default bindings
// [letter]: [insertCharacter char=$key]
// *: [assignKeybind key=$keyBind]
//
//
//
// */
