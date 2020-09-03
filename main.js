/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.tsx");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../core/dist/dom.js":
/*!***************************!*\
  !*** ../core/dist/dom.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const watchable_1 = __webpack_require__(/*! ./watchable */ "../core/dist/watchable.js");
// or WatchableDependencyList but why restrict it?
// watchabledependencylist is the only thing that will actually be used
// real fragments should be possible
// nodes should return
let q;
const isExistingNode = Symbol("is_existing_node");
let nodeIsExisting = (node) => !!node[isExistingNode];
function createNode(spec) {
    if (nodeIsExisting(spec)) {
        return spec; // already a node, no action to take
    }
    if (Array.isArray(spec)) {
        return createFragmentNode(spec.map(it => createNode(it)));
    }
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            if (watchable_1.isWatch(spec)) {
                // OPTIMIZATION: if prev is text and next is text, just update node.nodeValue
                let nodeAfter = document.createTextNode("");
                parent.insertBefore(nodeAfter, ___afterOnce);
                let nodeExists = true;
                let prevUserNode = undefined;
                let prevNode = undefined;
                let onchange = () => {
                    console.log("changed, updating", spec);
                    if (!nodeExists) {
                        console.log("!!ERROR: Node updated after removal, even though the watcher was unregistered. This should never happen.!");
                        return;
                    }
                    // if equals previous value, do nothing
                    let newUserNode = spec.$ref;
                    if (prevUserNode === newUserNode)
                        return; // nothing to do;
                    prevUserNode = newUserNode;
                    // remove existing node
                    if (prevNode)
                        prevNode.removeSelf();
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
exports.createNode = createNode;
function getInfer(object, key) {
    return object[key];
}
function createHTMLNode(type, attrs, 
// ^ Watchable<Partial<NodeAttributes<NodeName>>>
child) {
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            let node = document.createElement(type);
            // !!! TODO:: attrs is a normal (not watchable) object containing dmfRest which is a watchable object. when dmfRest changes, objectShallowDiff is used to choose what updates.
            let prevAttrs = {};
            let eventHandlers = new Map();
            let removalHandlers = new Map();
            // !!! memory: move this outside. no reason to make a new one with every node.
            let setAttribute = (key, value) => {
                if (removalHandlers.has(key)) {
                    removalHandlers.get(key)();
                    removalHandlers.delete(key);
                }
                if (value instanceof watchable_1.WatchableBase) {
                    removalHandlers.set(key, value.watch(() => {
                        if (!(value instanceof watchable_1.WatchableBase)) {
                            throw new Error("typescript");
                        }
                        let resv = value.$ref;
                        if (resv instanceof watchable_1.WatchableBase) {
                            throw new Error("watchable is watchable. not good. this should never happen.");
                        }
                        setAttributeNotWatchable(key, resv);
                    }));
                    setAttributeNotWatchable(key, value.$ref);
                    return;
                }
                setAttributeNotWatchable(key, value);
            };
            let setAttributeNotWatchable = (key, value) => {
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
                        let listener = value;
                        eventHandlers.set(eventName, listener);
                        node.addEventListener(eventName, listener);
                    }
                }
                else if (key === "style") {
                    throw new Error("setting style is not supported yet");
                }
                else if (key === "dmfOnMount") {
                    value(node);
                }
                else if (key in node) {
                    node[key] = value;
                }
                else {
                    if (value === undefined)
                        node.removeAttribute(key);
                    else
                        node.setAttribute(key, "" + value);
                }
            };
            let onchange = (attrs) => {
                let diff = watchable_1.objectShallowDiff(prevAttrs, attrs);
                for (let [key, state] of diff) {
                    if (state === "unchanged")
                        continue;
                    let value = getInfer(attrs, key);
                    if (state === "removed")
                        value = undefined;
                    if (key === "children" && state !== "added") {
                        throw new Error("children property cannot be changed in a real html node using the children attribute. pass an unchanging fragment instead that has children that change. (state was " +
                            state +
                            ")");
                    }
                    if (key === "children") {
                        continue;
                    }
                    setAttribute(key, value);
                }
            };
            let removeWatcher;
            if (attrs.dmfRest) {
                if (watchable_1.isWatch(attrs.dmfRest)) {
                    onchange(Object.assign(Object.assign({}, attrs), attrs.dmfRest.$ref));
                    removeWatcher = attrs.dmfRest.watch(() => {
                        onchange(Object.assign(Object.assign({}, attrs), attrs.dmfRest.$ref));
                    });
                }
                else {
                    onchange(Object.assign(Object.assign({}, attrs), attrs.dmfRest));
                }
            }
            else {
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
exports.createHTMLNode = createHTMLNode;
function createFragmentNode(children) {
    return {
        [isExistingNode]: true,
        createBefore(parent, ___afterOnce) {
            let nodeAfter = document.createTextNode("");
            parent.insertBefore(nodeAfter, ___afterOnce);
            let createdChildren = children.map(child => {
                console.log("fragment inserting", child, "into", parent, "before", nodeAfter);
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
exports.createFragmentNode = createFragmentNode;
function createPortal(node, portalTo, insertBefore) {
    return {
        [isExistingNode]: true,
        createBefore(_parent, ___afterOnce) {
            let insertedNode = node.createBefore(portalTo, insertBefore);
            return {
                removeSelf: () => {
                    insertedNode.removeSelf();
                },
                [isExistingNode]: true,
            };
        },
    };
}
exports.createPortal = createPortal;
function createListRender(list, cb) {
    return {
        [isExistingNode]: true,
        createBefore(parent, after) {
            let finalNode = document.createTextNode("");
            parent.insertBefore(finalNode, after);
            // let elementToNodeAfterMap = new Map<
            //     T,
            //     { nodeAfter: ChildNode; node: CreatedNodeSpec }
            // >();
            let elementToNodeAfterMap = new Map();
            let removalHandlers = [];
            list.forEach((item, symbol) => {
                let resultElement = cb(item, symbol);
                let nodeAfter = document.createTextNode("");
                let nodeBefore = document.createTextNode("");
                parent.insertBefore(nodeAfter, finalNode);
                parent.insertBefore(nodeBefore, nodeAfter);
                let createdNode = createNode(resultElement).createBefore(parent, nodeAfter);
                elementToNodeAfterMap.set(symbol, {
                    nodeBefore,
                    node: createdNode,
                });
            });
            removalHandlers.push(list.onAdd((item, { before, symbol, after }) => {
                var _a;
                if (elementToNodeAfterMap.get(symbol)) {
                    return; // onadd happens a tick delayed for performance (so that list .insert is fast in case lots of list manipulations are being done at once).
                }
                let resultElement = createNode(cb(item, symbol)); // pretend item is a t when it's actually watchable. users need to put $
                let nodeAfter = document.createTextNode("");
                let nodeBefore = document.createTextNode("");
                console.log(";:onadd was called to insert after", after, "(value)", elementToNodeAfterMap.get(after));
                parent.insertBefore(nodeAfter, after
                    ? ((_a = elementToNodeAfterMap.get(after)) === null || _a === void 0 ? void 0 : _a.nodeBefore) ||
                        finalNode
                    : finalNode);
                parent.insertBefore(nodeBefore, nodeAfter);
                let createdNode = resultElement.createBefore(parent, nodeAfter);
                elementToNodeAfterMap.set(symbol, {
                    nodeBefore,
                    node: createdNode,
                });
            }));
            removalHandlers.push(list.onRemove(({ before, symbol, after }) => {
                let element = elementToNodeAfterMap.get(symbol);
                if (!element)
                    throw new Error("was requested to remove an element that doesn't exist");
                element.node.removeSelf();
                element.nodeBefore.remove();
            }));
            return {
                removeSelf: () => {
                    removalHandlers.forEach(rh => rh());
                    elementToNodeAfterMap.forEach((value, key) => {
                        value.node.removeSelf();
                        value.nodeBefore.remove();
                    });
                },
            };
        },
    };
}
exports.createListRender = createListRender;


/***/ }),

/***/ "../core/dist/index.js":
/*!*****************************!*\
  !*** ../core/dist/index.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __webpack_require__(/*! ./react */ "../core/dist/react.js");
exports.React = react_1.React;
exports.ListRender = react_1.ListRender;
exports.Portal = react_1.Portal;
exports.mount = react_1.mount;
var watchable_1 = __webpack_require__(/*! ./watchable */ "../core/dist/watchable.js");
exports.$ = watchable_1.$;
exports.$bind = watchable_1.$bind;
exports.List = watchable_1.List;


/***/ }),

/***/ "../core/dist/react.js":
/*!*****************************!*\
  !*** ../core/dist/react.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const dom = __webpack_require__(/*! ./dom */ "../core/dist/dom.js");
exports.React = {
    createElement: (componentCreator, props, // !!! spread props
    ...children) => {
        console.log("creating element", componentCreator, props, children);
        if (!props)
            props = {};
        if (typeof componentCreator === "string") {
            let nodeName = componentCreator;
            componentCreator = (attrs) => dom.createHTMLNode(nodeName, attrs, attrs.children);
        }
        // !!! PERFORMANCE for creating html nodes, don't make all the props watchable
        let finalProps = Object.assign(Object.assign({}, props), { 
            // !!! performance don't create a fragment if there are no children
            children: dom.createFragmentNode(children.map((child) => {
                console.log("adding", child, "to", "children");
                return dom.createNode(child);
            })) }); // does not support spread props
        console.log("creating component using finalprops", finalProps);
        return componentCreator(finalProps);
    },
    Fragment: (props) => {
        let children = Array.isArray(props.children)
            ? props.children
            : props.children == null
                ? []
                : [props.children];
        return dom.createFragmentNode(children.map(child => {
            return dom.createNode(child);
        }));
    },
};
function mountSlow(element, parent, before) {
    dom.createNode(element).createBefore(parent, before || null);
}
exports.mountSlow = mountSlow;
function mount(element, parent) {
    let parentEl = document.createElement("div");
    dom.createNode(element).createBefore(parentEl, null);
    parent.appendChild(parentEl);
}
exports.mount = mount;
exports.ListRender = dom.createListRender;
function Portal(node, portalTo, insertBefore = null) {
    return dom.createPortal(dom.createNode(node), portalTo, insertBefore);
}
exports.Portal = Portal;


/***/ }),

/***/ "../core/dist/watchable.js":
/*!*********************************!*\
  !*** ../core/dist/watchable.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// diffing tutorial (to prevent the use of keys)
// : each item (set [Symbol.diffhelper] =Symbol("v"))
// now they can be added to a list properly
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
function nextTick(cb) {
    setTimeout(() => cb(), 0);
}
exports.is_watchable = Symbol("is watchable");
exports.should_be_raw = Symbol("should be raw");
class WatchableBase {
    constructor() {
        this.watchers = [];
    }
    watch(watcher, deep) {
        if (this.watchers.length === 0) {
            // setup
            this._setup && this._setup();
        }
        this.watchers.push(watcher);
        return (() => {
            this.watchers = this.watchers.filter(e => e !== watcher);
            if (this.watchers.length === 0) {
                // cleanup
                this._teardown && this._teardown();
            }
        });
    }
    emit() {
        console.log("emitting for watchers", this.watchers);
        // this.watchers.forEach(w => w());
        nextTick(() => this.watchers.forEach(w => w()));
    }
    get [exports.is_watchable]() {
        return true;
    }
}
exports.WatchableBase = WatchableBase;
// !!!!!!!!!!!!!! possible memory leak: unused fakewatchables need to be removed when no one is watching them anymore
class FakeWatchable extends WatchableBase {
    constructor(thing, parent) {
        super();
        if (typeof thing === "function") {
            thing = thing.bind(parent.$ref);
        }
        this.thing = thing;
        this.parent = parent;
    }
    get $ref() {
        return this.thing;
    }
    set $ref(_nv) {
        throw new Error("Cannot set ref value of fakewatchable");
    }
    $get(v) {
        return new FakeWatchable(this.thing[v], this);
    }
    watch(watcher) {
        return this.parent.watch(watcher);
    }
}
exports.FakeWatchable = FakeWatchable;
// TODO deep emit. things that watch should short circuit quickly so it *shouldn't* be a performance issue.
class WatchableThing extends WatchableBase {
    constructor(v, isUnused = false) {
        super();
        this.$ref = v;
        this.isUnused = isUnused;
        // !!!!! if(isWatchable(v)) {
        //   watch[v] and add to watchable_cleanup
        // }
    }
    set $ref(nv) {
        // !!!!!!!!!!!!!!!!!!!!!!!! emit to any above us (highest first)
        // !!!!!!!!!!!!!!!!!!!!!!!! ^ the above should only happen to special watchers (forex a.b || $deep)
        this.emit(); // emit before anything under us potentially emits
        this.isUnused = false;
        // if(self instanceof list) // do stuff
        if (nv && nv[exports.should_be_raw]) {
            // instead of manual if statements, why not have a proprety that says things
            // this.__v.$ref = nv;
            this.__v = nv;
            return;
        }
        if (typeof this.__v === "object" && typeof nv === "object") {
            // if is array, good luck...
            let existingKeys = Object.assign({}, this.__v);
            Object.keys(nv).forEach(key => {
                let value = nv[key];
                this.$get(key).$ref = value;
                delete existingKeys[key];
            });
            Object.keys(existingKeys).forEach(key => {
                let value = existingKeys[key];
                value.$ref = undefined;
                value.isUnused = true;
            });
            return;
        }
        if (typeof nv === "object") {
            this.__v = {};
            Object.keys(nv).forEach(key => {
                let value = nv[key];
                this.$get(key).$ref = value;
            });
            return;
        }
        this.__v = nv;
    }
    get $ref() {
        console.log("DID GET VALUE OF ", this);
        if (this.__v && this.__v[exports.should_be_raw]) {
            // if this.__v[some_property]
            return this.__v;
        }
        if (typeof this.__v === "object") {
            let newObject = {};
            Object.keys(this.__v).forEach(key => {
                let value = this.__v[key].$ref;
                newObject[key] = value; // !!!!!!! if value is temporary, ignore it
            });
            return newObject;
        }
        return this.__v;
    }
    $get(v) {
        console.log("$get was used with ", v);
        if (this.__v && this.__v[exports.should_be_raw]) {
            return new FakeWatchable(this.__v[v], this);
        }
        if (typeof this.__v === "object") {
            if (!(v in this.__v)) {
                this.__v[v] = new WatchableThing(undefined, true);
                return this.__v[v];
            }
            let value = this.__v[v];
            return value;
        }
        else {
            let val = this.__v[v];
            if (val[exports.is_watchable]) {
                return val;
            }
            let value = new FakeWatchable(val, this);
            return value;
        }
    }
    toJSON() {
        return this.$ref;
    }
}
exports.WatchableThing = WatchableThing;
exports.symbolKey = (v) => v;
// make a real array wrapper that uses maps to diff update
// let $a = [1,2,3,1];
// $a = $a.filter(q => q === 1);
// emit remove 2 with Array[1,1]
// emit remove 3 with Array[1,1]
// TODO guess what maps exist
// use the object itself as keys
// will be helpful for diff set and remove the requirement to use symbol keys so you can just pass the object (list.forEach(el => list.remove(el))) and still have constant time. might make more work for the garbage collecter but I don't know anything about how the javascript garbage collector works so idk
class List {
    constructor(items) {
        this[_a] = true;
        this.__items = {};
        this.__onAdd = [];
        this.__onRemove = [];
        this.__length = exports.$.createWatchable(0);
        items.forEach(item => this.push(item));
    }
    onAdd(cb) {
        this.__onAdd.push(cb);
        return () => (this.__onAdd = this.__onAdd.filter(v => v !== cb));
    }
    onRemove(cb) {
        this.__onRemove.push(cb);
        return () => (this.__onRemove = this.__onRemove.filter(v => v !== cb));
    }
    insert(o, item) {
        let thisItemSymbol = Symbol("new item");
        let watchableItem = exports.$.createWatchable(item);
        let beforeItemSymbol = "after" in o
            ? o.after
            : o.before
                ? this.__items[exports.symbolKey(o.before)].prev
                : this.__last;
        let beforeItem = beforeItemSymbol
            ? this.__items[exports.symbolKey(beforeItemSymbol)]
            : undefined;
        let afterItemSymbol = beforeItem ? beforeItem.next : this.__first;
        let afterItem = afterItemSymbol
            ? this.__items[exports.symbolKey(afterItemSymbol)]
            : undefined;
        let thisItem = {
            prev: beforeItemSymbol,
            next: afterItemSymbol,
            self: watchableItem,
            symbol: thisItemSymbol,
            removeSelf: (() => { }),
        };
        if (beforeItem) {
            beforeItem.next = thisItemSymbol;
        }
        else {
            this.__first = thisItemSymbol;
        }
        if (afterItem) {
            afterItem.prev = thisItemSymbol;
        }
        else {
            this.__last = thisItemSymbol;
        }
        this.__items[exports.symbolKey(thisItemSymbol)] = thisItem;
        this.__length.$ref++;
        nextTick(() => this.__onAdd.forEach(oa => oa(watchableItem, {
            before: beforeItemSymbol,
            after: afterItemSymbol,
            symbol: thisItemSymbol,
        })));
        // next tick, emit add event
    }
    remove(itemSymbol) {
        let item = this.__items[exports.symbolKey(itemSymbol)];
        let prevItem = this.__items[exports.symbolKey(item.prev)];
        let nextItem = this.__items[exports.symbolKey(item.next)];
        if (prevItem)
            prevItem.next = item.next;
        if (nextItem)
            nextItem.prev = item.prev;
        if (!prevItem)
            this.__first = item.next;
        if (!nextItem)
            this.__last = item.prev;
        nextTick(() => this.__onRemove.forEach(or => or({
            before: item.prev,
            after: item.next,
            symbol: item.symbol,
        })));
    }
    forEach(cb) {
        let currentSymbol = this.__first;
        while (currentSymbol) {
            let item = this.__items[exports.symbolKey(currentSymbol)];
            cb(item.self, item.symbol);
            currentSymbol = item.next;
        }
        return;
    }
    array() {
        let resarr = [];
        this.forEach(item => resarr.push(item));
        return resarr;
    }
    updateDiff(_nv) {
        // setHelperSymbol = Symbol("set helper")
        // on each item, set a sethelpersymbol
        // use this to store values in a {} and diff
        // o(n) probably whatever that means. or o(3n) if that exists.
        throw new Error("list diff set is not supported yet");
    }
    push(item) {
        this.insert({ after: this.__last }, item);
    }
    unshift(item) {
        this.insert({ before: this.__first }, item);
    }
    get length() {
        return this.__length;
    }
    toJSON() {
        return this.array();
    }
}
exports.List = List;
_a = exports.should_be_raw;
class WatchableDependencyList extends WatchableBase {
    constructor(dependencyList, getValue) {
        super();
        this.previousData = { ref: {} };
        this.removalHandlers = [];
        this.savedReturnValue = undefined;
        this.dependencyList = dependencyList;
        this.getValue = getValue;
    }
    _setup() {
        this.dependencyList.forEach(item => this.removalHandlers.push(item.watch(() => {
            console.log("item watch emitted");
            nextTick(() => this.emit()); // !!! remove this
        })));
    }
    _teardown() {
        console.log("tearing down up watcher for", this.removalHandlers);
        this.removalHandlers.forEach(rh => rh());
    }
    get $ref() {
        let value = this.getValue(this.previousData, this.savedReturnValue);
        this.savedReturnValue = { ref: value };
        return value; // dom will check strict equality so if a new node is created it will know there is nothing to do // <-- the opposite
    }
    set $ref(v) {
        throw new Error("Cannot set value of watchable dependency list.");
    }
}
exports.WatchableDependencyList = WatchableDependencyList;
exports.$ = {
    createWatchable: (v) => new WatchableThing(v),
    list(items) {
        return new List(items);
    },
    watch(dependencyList, getValue) {
        return new WatchableDependencyList(dependencyList, getValue);
    },
};
function isWatch(v) {
    // return v == null ? false : !!(v as any)[is_watchable];
    return v instanceof WatchableBase;
}
exports.isWatch = isWatch;
// export interface Watchable {
//     watch(v: () => void): () => void; // watch(watcher) returns unwatcher
// }
function objectShallowDiff(prev, curr) {
    let propertyChangeMap = new Map();
    Object.entries(curr).forEach(([key, value]) => {
        propertyChangeMap.set(key, { state: "added", value });
    });
    Object.entries(prev).forEach(([key, value]) => {
        let cm = propertyChangeMap.get(key);
        if (cm) {
            if (cm.value === value)
                cm.state = "unchanged";
            else
                cm.state = "changed";
        }
        else {
            propertyChangeMap.set(key, {
                state: "removed",
                value: undefined,
            });
        }
    });
    let resultMap = new Map();
    // it might be nice to return propertyChangeMap directly but that would require lots of typescript stuff so that this function knows the types of the objects
    for (let [key, value] of propertyChangeMap) {
        resultMap.set(key, value.state);
    }
    return resultMap;
}
exports.objectShallowDiff = objectShallowDiff;
// console.log(
//     "@@@ SHALLOW DIFF TEST:::",
//     objectShallowDiff(
//         { a: "removed", b: "changed", c: "unchanged" },
//         { b: "changed-", c: "unchanged", d: "addedd" },
//     ),
// );


/***/ }),

/***/ "./src/ClickerEditor.tsx":
/*!*******************************!*\
  !*** ./src/ClickerEditor.tsx ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ClickerEditor; });
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dmf */ "../core/dist/index.js");
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dmf__WEBPACK_IMPORTED_MODULE_0__);

dmf__WEBPACK_IMPORTED_MODULE_0__["$"];
dmf__WEBPACK_IMPORTED_MODULE_0__["React"]; // ---

function SelectList(choices, $value) {
  const choiceDataMap = new Map();
  let currentChoice = choices[0][0];
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, choices.map(([a, b]) => dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => {
      choiceDataMap.set(currentChoice, $value.$ref);
      currentChoice = a;

      if (choiceDataMap.has(a)) {
        $value.$ref = choiceDataMap.get(a);
      } else {
        $value.$ref = b;
      }
    }
  }, a)));
}

function ResourceEditor($item) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($item.$ref, ($resource, symbol) => {
      return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
        type: "text",
        value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$resource.$get("resource")], (____prev, ____saved) => {
          const ____curr = {};
          ____prev.ref = ____curr;
          return $resource.$get("resource").$ref;
        }),
        onInput: e => $resource.$get("resource").$ref = e.currentTarget.value
      }), " ", ">=", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
        type: "text",
        value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$resource.$get("cost")], (____prev, ____saved) => {
          const ____curr = {};
          ____prev.ref = ____curr;
          return $resource.$get("cost").$ref;
        }),
        onInput: e => $resource.$get("cost").$ref = e.currentTarget.value
      }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
        onClick: () => $item.$get("remove").$ref(symbol)
      }, "-"));
    });
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $item.$get("push").$ref({
      resource: "",
      cost: "0.00"
    })
  }, "+"));
}

function ItemEditor($item, removeSelf) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, SelectList([["none", {
    type: "none"
  }], ["spacer", {
    type: "spacer"
  }], ["separator", {
    type: "separator"
  }], ["counter", {
    type: "counter",
    name: "",
    description: ""
  }], ["button", {
    type: "button",
    data: {
      name: ""
    }
  }]], $item), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => removeSelf()
  }, "-")), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("h1", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("type")], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return $item.$get("type").$ref;
  })), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("type")], (____prev, ____saved) => {
    const ____curr = {
      _0: $item.$get("type").$ref === "none"
    };

    if (____curr._0 && ____prev.ref._0) {
      if (____saved) {
        console.log("Skipping because saved value", ____saved.ref);
        return ____saved.ref;
      }
    }

    ____prev.ref = ____curr;
    return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "No options to configure") : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("type"), $item.$get("type"), $item.$get("type"), $item.$get("type")], (____prev, ____saved) => {
      const ____curr = {
        _0: true,
        _1: $item.$get("type").$ref === "button",
        _2: $item.$get("type").$ref === "counter",
        _3: $item.$get("type").$ref === "separator",
        _4: $item.$get("type").$ref === "spacer"
      };

      if (____curr._0 && ____prev.ref._0) {
        if (____saved) {
          console.log("Skipping because saved value", ____saved.ref);
          return ____saved.ref;
        }
      }

      if (____curr._1 && ____prev.ref._1) {
        if (____saved) {
          console.log("Skipping because saved value", ____saved.ref);
          return ____saved.ref;
        }
      }

      if (____curr._2 && ____prev.ref._2) {
        if (____saved) {
          console.log("Skipping because saved value", ____saved.ref);
          return ____saved.ref;
        }
      }

      if (____curr._3 && ____prev.ref._3) {
        if (____saved) {
          console.log("Skipping because saved value", ____saved.ref);
          return ____saved.ref;
        }
      }

      if (____curr._4 && ____prev.ref._4) {
        if (____saved) {
          console.log("Skipping because saved value", ____saved.ref);
          return ____saved.ref;
        }
      }

      ____prev.ref = ____curr;
      return ____curr._4 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "No options to configure for spacer") : ____curr._3 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "No options to configure for separator") : ____curr._2 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("label", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Resource:"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
        type: "text",
        value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("name")], (____prev, ____saved) => {
          const ____curr = {};
          ____prev.ref = ____curr;
          return $item.$get("name").$ref;
        }),
        onInput: e => $item.$get("name").$ref = e.currentTarget.value
      })), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("label", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Description:"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("textarea", {
        value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("description")], (____prev, ____saved) => {
          const ____curr = {};
          ____prev.ref = ____curr;
          return $item.$get("description").$ref;
        }),
        onInput: e => $item.$get("description").$ref = e.currentTarget.value
      }))) : ____curr._1 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("label", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Button Label:"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
        type: "text",
        value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("data").$get("name")], (____prev, ____saved) => {
          const ____curr = {};
          ____prev.ref = ____curr;
          return $item.$get("data").$get("name").$ref;
        })
      })), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Requires:", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("data").$get("requirements")], (____prev, ____saved) => {
        const ____curr = {
          _0: $item.$get("data").$get("requirements").$ref
        };

        if (____curr._0 && ____prev.ref._0) {
          if (____saved) {
            console.log("Skipping because saved value", ____saved.ref);
            return ____saved.ref;
          }
        }

        ____prev.ref = ____curr;
        return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, ResourceEditor($item.$get("data").$get("requirements")), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("requirements").$ref = undefined
        }, "-")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("requirements").$ref = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([])
        }, "+");
      })), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Price:", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("data").$get("price")], (____prev, ____saved) => {
        const ____curr = {
          _0: $item.$get("data").$get("price").$ref
        };

        if (____curr._0 && ____prev.ref._0) {
          if (____saved) {
            console.log("Skipping because saved value", ____saved.ref);
            return ____saved.ref;
          }
        }

        ____prev.ref = ____curr;
        return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, ResourceEditor($item.$get("data").$get("price")), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("price").$ref = undefined
        }, "-")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("price").$ref = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([])
        }, "+");
      })), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Effects:", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("data").$get("effects")], (____prev, ____saved) => {
        const ____curr = {
          _0: $item.$get("data").$get("effects").$ref
        };

        if (____curr._0 && ____prev.ref._0) {
          if (____saved) {
            console.log("Skipping because saved value", ____saved.ref);
            return ____saved.ref;
          }
        }

        ____prev.ref = ____curr;
        return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, ResourceEditor($item.$get("data").$get("effects")), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("effects").$ref = undefined
        }, "x")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $item.$get("data").$get("effects").$ref = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([])
        }, "+");
      }))) : ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Unknown item type") : null;
    }));
  }));
}

function ClickerEditor() {
  const $items = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
    type: "counter",
    name: "achivement",
    description: "number of achivements you have recieved"
  }, {
    type: "button",
    data: {
      name: "collect 100 gold",
      requirements: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "gold",
        cost: "100"
      }]),
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "_ach1",
        cost: "1"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "achivement",
        cost: "1"
      }])
    }
  }, {
    type: "button",
    data: {
      name: "eat apple",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "apple",
        cost: "1"
      }, {
        resource: "_ach2",
        cost: "1"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "achivement",
        cost: "1"
      }])
    }
  }, {
    type: "separator"
  }, {
    type: "counter",
    name: "stamina",
    description: "stamina increases 0.01 per tick, max 1"
  }, {
    type: "counter",
    name: "gold",
    description: "gold lets you purchase things"
  }, {
    type: "button",
    data: {
      name: "fish gold from wishing well",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "stamina",
        cost: "0.1"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "gold",
        cost: "1"
      }])
    }
  }, {
    type: "counter",
    name: "market",
    description: "markets aquire 0.01 gold per tick"
  }, {
    type: "button",
    data: {
      name: "purchase market",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "gold",
        cost: "25"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "market",
        cost: "1"
      }])
    }
  }, {
    type: "spacer"
  }, {
    type: "counter",
    name: "apple",
    description: "an apple"
  }, {
    type: "counter",
    name: "water",
    description: "water grows trees"
  }, {
    type: "counter",
    name: "tree",
    description: "each full tree requires 2 water each tick to live and drops 1 apple per 10 ticks."
  }, {
    type: "counter",
    name: "seed",
    description: "an apple seed. uses 1 water each tick to grow"
  }, {
    type: "button",
    data: {
      name: "purchase seed from market",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "gold",
        cost: "50"
      }]),
      requirements: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "market",
        cost: "5"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "seed",
        cost: "1"
      }])
    }
  }, {
    type: "button",
    data: {
      name: "take water from wishing well",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "stamina",
        cost: "1"
      }]),
      requirements: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "market",
        cost: "5"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "water",
        cost: "100"
      }])
    }
  }, {
    type: "counter",
    name: "bucket",
    description: "a bucket"
  }, {
    type: "button",
    data: {
      name: "make bucket",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "tree",
        cost: "1"
      }, {
        resource: "gold",
        cost: "100"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "bucket",
        cost: "1"
      }])
    }
  }, {
    type: "button",
    data: {
      name: "use bucket on wishing well",
      price: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "bucket",
        cost: "1"
      }, {
        resource: "stamina",
        cost: "1"
      }]),
      effects: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([{
        resource: "water",
        cost: "1000"
      }, {
        resource: "gold",
        cost: "10"
      }])
    }
  }]));
  let $update = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(0); // once deep events are used, this won't be needed

  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("textarea", {
    value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$update, $items], (____prev, ____saved) => {
      const ____curr = {};
      ____prev.ref = ____curr;
      return "" + $update.$ref && JSON.stringify(JSON.parse(JSON.stringify($items.$ref)).map(v => {
        if (v.type === "counter") return [v.type, v.name, v.description];

        if (v.type === "button") {
          const fix = name => {
            if (v.data[name]) {
              const reso = {};

              for (const det of v.data[name]) {
                if (!reso[det.resource]) reso[det.resource] = 0;
                reso[det.resource] += +det.cost;
              }

              v.data[name] = reso;
            }
          };

          fix("requirements");
          fix("effects");
          fix("price");
          return [v.type, v.data];
        }

        return [v.type];
      }));
    })
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $update.$ref++
  }, "update")), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("ul", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $items.$get("insert").$ref({
      after: undefined
    }, {
      type: "none"
    })
  }, "+")), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$items], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($items.$ref, ($item, symbol) => {
      console.log("##Rendering item editor", $item, symbol);
      return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, ItemEditor($item, () => $items.$get("remove").$ref(symbol))), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
        onClick: () => $items.$get("insert").$ref({
          after: symbol
        }, {
          type: "none"
        })
      }, "+")));
    });
  })));
}

/***/ }),

/***/ "./src/TodoList.tsx":
/*!**************************!*\
  !*** ./src/TodoList.tsx ***!
  \**************************/
/*! exports provided: TodoListApp */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TodoListApp", function() { return TodoListApp; });
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dmf */ "../core/dist/index.js");
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dmf__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./drawBoxAroundElement */ "./src/drawBoxAroundElement.js");
/* harmony import */ var _drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1__);


dmf__WEBPACK_IMPORTED_MODULE_0__["$"];
dmf__WEBPACK_IMPORTED_MODULE_0__["React"];

function ManagedTextInput($text, props) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
    value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$text], (____prev, ____saved) => {
      const ____curr = {};
      ____prev.ref = ____curr;
      return $text.$ref;
    }),
    onInput: e => $text.$ref = e.currentTarget.value,
    dmfRest: props
  });
}

function TodoList($list) {
  let $wipItem = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable("");
  const $filter = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable("");
  let thisShouldFocus = false;
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("h1", null, "Todo List"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("ul", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, ManagedTextInput($wipItem, {
    type: "text",
    placeholder: "What to do...",
    onKeyPress: e => {
      if (e.code === "Enter") {
        $list.$get("unshift").$ref({
          checked: false,
          contents: $wipItem.$ref
        });
        $wipItem.$ref = "";
      }
    }
  }), ManagedTextInput($filter, {
    type: "text",
    placeholder: "Filter..."
  })), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$list], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($list.$ref, ($item, symbol) => {
      console.log("rendering", $item.$ref, "for listrender");
      let $showRemoveConfirm = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(false);
      return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("contents").$get("includes"), $filter], (____prev, ____saved) => {
        const ____curr = {
          _0: $item.$get("contents").$get("includes").$ref($filter.$ref)
        };

        if (____curr._0 && ____prev.ref._0) {
          if (____saved) {
            console.log("Skipping because saved value", ____saved.ref);
            return ____saved.ref;
          }
        }

        ____prev.ref = ____curr;
        return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
          type: "checkbox",
          checked: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("checked")], (____prev, ____saved) => {
            const ____curr = {};
            ____prev.ref = ____curr;
            return $item.$get("checked").$ref;
          }),
          onInput: e => $item.$get("checked").$ref = e.currentTarget.checked
        }), " ", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
          type: "text",
          value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item.$get("contents")], (____prev, ____saved) => {
            const ____curr = {};
            ____prev.ref = ____curr;
            return $item.$get("contents").$ref;
          }),
          dmfOnMount: node => setTimeout(() => thisShouldFocus ? (node.focus(), thisShouldFocus = false) : 0, 0),
          onInput: e => $item.$get("contents").$ref = e.currentTarget.value,
          onKeyPress: e => {
            if (e.code === "Enter") {
              thisShouldFocus = true;
              $list.$get("insert").$ref({
                after: symbol
              }, {
                checked: false,
                contents: ""
              });
            }
          }
        }), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$showRemoveConfirm], (____prev, ____saved) => {
          const ____curr = {
            _0: $showRemoveConfirm.$ref
          };

          if (____curr._0 && ____prev.ref._0) {
            if (____saved) {
              console.log("Skipping because saved value", ____saved.ref);
              return ____saved.ref;
            }
          }

          ____prev.ref = ____curr;
          return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, "Are you sure?", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
            onClick: () => $list.$get("remove").$ref(symbol)
          }, "Remove"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
            onClick: () => $showRemoveConfirm.$ref = false
          }, "Cancel")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
            onClick: () => $showRemoveConfirm.$ref = true
          }, "x");
        })) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, "does not match filter");
      }));
    });
  })));
}

function TodoListApp() {
  const $list = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([]));
  const $listOfTodoLists = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([0]));
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$listOfTodoLists], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($listOfTodoLists.$ref, ($item, symbol) => {
      let $confirmVisible = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(false);
      return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, TodoList($list), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$confirmVisible], (____prev, ____saved) => {
        const ____curr = {
          _0: $confirmVisible.$ref
        };

        if (____curr._0 && ____prev.ref._0) {
          if (____saved) {
            console.log("Skipping because saved value", ____saved.ref);
            return ____saved.ref;
          }
        }

        ____prev.ref = ____curr;
        return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].Fragment, null, "Are you sure?", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $listOfTodoLists.$get("remove").$ref(symbol)
        }, "Remove"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $confirmVisible.$ref = false
        }, "Cancel")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
          onClick: () => $confirmVisible.$ref = true
        }, "x");
      })));
    });
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $listOfTodoLists.$get("push").$ref(0)
  }, "+"));
}

/***/ }),

/***/ "./src/drawBoxAroundElement.js":
/*!*************************************!*\
  !*** ./src/drawBoxAroundElement.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// https://github.com/facebook/react

const nodeToData = new Map(); // How long the rect should be shown for?

const DISPLAY_DURATION = 250; // What's the longest we are willing to show the overlay for?
// This can be important if we're getting a flurry of events (e.g. scroll update).

const MAX_DISPLAY_DURATION = 3000; // How long should a rect be considered valid for?

const REMEASUREMENT_AFTER_DURATION = 250; // Some environments (e.g. React Native / Hermes) don't support the performace API yet.

const getCurrentTime =
    typeof performance === "object" && typeof performance.now === "function"
        ? () => performance.now()
        : () => Date.now();
let agent = null;
let drawAnimationFrameID = null;
let isEnabled = true;
let redrawTimeoutID = null;
const OUTLINE_COLOR = "#f0f0f0"; // Note these colors are in sync with DevTools Profiler chart colors.

const COLORS = [
    "#37afa9",
    "#63b19e",
    "#80b393",
    "#97b488",
    "#abb67d",
    "#beb771",
    "#cfb965",
    "#dfba57",
    "#efbb49",
    "#febc38",
];
let canvas = null;

function draw(nodeToData) {
    if (canvas === null) {
        initialize();
    }

    const canvasFlow = canvas;
    canvasFlow.width = window.screen.availWidth;
    canvasFlow.height = window.screen.availHeight;
    const context = canvasFlow.getContext("2d");
    context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);
    nodeToData.forEach(({ count, rect }) => {
        if (rect !== null) {
            const colorIndex = Math.min(COLORS.length - 1, count - 1);
            const color = COLORS[colorIndex];
            drawBorder(context, rect, color);
        }
    });
}

function drawBorder(context, rect, color) {
    const { height, left, top, width } = rect; // outline

    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left - 1, top - 1, width + 2, height + 2); // inset

    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left + 1, top + 1, width - 1, height - 1);
    context.strokeStyle = color;
    context.setLineDash([0]); // border

    context.lineWidth = 1;
    context.strokeRect(left, top, width - 1, height - 1);
    context.setLineDash([0]);
}

function destroy() {
    if (canvas !== null) {
        if (canvas.parentNode != null) {
            canvas.parentNode.removeChild(canvas);
        }

        canvas = null;
    }
}

function initialize() {
    canvas = window.document.createElement("canvas");
    canvas.style.cssText = `
    xx-background-color: red;
    xx-opacity: 0.5;
    bottom: 0;
    left: 0;
    pointer-events: none;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000000000;
  `;
    const root = window.document.documentElement;
    root.insertBefore(canvas, root.firstChild);
    console.log(canvas);
}

function measureNode(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
        return null;
    }

    let currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;
    return getNestedBoundingClientRect(node, currentWindow);
}

function prepareToDraw() {
    drawAnimationFrameID = null;
    redrawTimeoutID = null;
    const now = getCurrentTime();
    let earliestExpiration = Number.MAX_VALUE; // Remove any items that have already expired.

    nodeToData.forEach((data, node) => {
        if (data.expirationTime < now) {
            nodeToData.delete(node);
        } else {
            earliestExpiration = Math.min(
                earliestExpiration,
                data.expirationTime,
            );
        }
    });
    draw(nodeToData);
    redrawTimeoutID = setTimeout(prepareToDraw, earliestExpiration - now);
}

function traceUpdates(nodes) {
    if (!isEnabled) {
        return;
    }

    nodes.forEach(node => {
        const data = nodeToData.get(node);
        const now = getCurrentTime();
        let lastMeasuredAt = data != null ? data.lastMeasuredAt : 0;
        let rect = data != null ? data.rect : null;

        if (
            rect === null ||
            lastMeasuredAt + REMEASUREMENT_AFTER_DURATION < now
        ) {
            lastMeasuredAt = now;
            rect = measureNode(node);
        }

        nodeToData.set(node, {
            count: data != null ? data.count + 1 : 1,
            expirationTime:
                data != null
                    ? Math.min(
                          now + MAX_DISPLAY_DURATION,
                          data.expirationTime + DISPLAY_DURATION,
                      )
                    : now + DISPLAY_DURATION,
            lastMeasuredAt,
            rect,
        });
    });

    if (redrawTimeoutID !== null) {
        clearTimeout(redrawTimeoutID);
        redrawTimeoutID = null;
    }

    if (drawAnimationFrameID === null) {
        drawAnimationFrameID = requestAnimationFrame(prepareToDraw);
    }
} // Get the window object for the document that a node belongs to,
// or return null if it cannot be found (node not attached to DOM,
// etc).

function getOwnerWindow(node) {
    if (!node.ownerDocument) {
        return null;
    }

    return node.ownerDocument.defaultView;
} // Get the iframe containing a node, or return null if it cannot
// be found (node not within iframe, etc).

function getOwnerIframe(node) {
    const nodeWindow = getOwnerWindow(node);

    if (nodeWindow) {
        return nodeWindow.frameElement;
    }

    return null;
} // Get a bounding client rect for a node, with an
// offset added to compensate for its border.

function getBoundingClientRectWithBorderOffset(node) {
    const dimensions = getElementDimensions(node);
    return mergeRectOffsets([
        node.getBoundingClientRect(),
        {
            top: dimensions.borderTop,
            left: dimensions.borderLeft,
            bottom: dimensions.borderBottom,
            right: dimensions.borderRight,
            // This width and height won't get used by mergeRectOffsets (since this
            // is not the first rect in the array), but we set them so that this
            // object typechecks as a ClientRect.
            width: 0,
            height: 0,
        },
    ]);
} // Add together the top, left, bottom, and right properties of
// each ClientRect, but keep the width and height of the first one.

function mergeRectOffsets(rects) {
    return rects.reduce((previousRect, rect) => {
        if (previousRect == null) {
            return rect;
        }

        return {
            top: previousRect.top + rect.top,
            left: previousRect.left + rect.left,
            width: previousRect.width,
            height: previousRect.height,
            bottom: previousRect.bottom + rect.bottom,
            right: previousRect.right + rect.right,
        };
    });
} // Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.

function getNestedBoundingClientRect(node, boundaryWindow) {
    const ownerIframe = getOwnerIframe(node);

    if (ownerIframe && ownerIframe !== boundaryWindow) {
        const rects = [node.getBoundingClientRect()];
        let currentIframe = ownerIframe;
        let onlyOneMore = false;

        while (currentIframe) {
            const rect = getBoundingClientRectWithBorderOffset(currentIframe);
            rects.push(rect);
            currentIframe = getOwnerIframe(currentIframe);

            if (onlyOneMore) {
                break;
            } // We don't want to calculate iframe offsets upwards beyond
            // the iframe containing the boundaryWindow, but we
            // need to calculate the offset relative to the boundaryWindow.

            if (
                currentIframe &&
                getOwnerWindow(currentIframe) === boundaryWindow
            ) {
                onlyOneMore = true;
            }
        }

        return mergeRectOffsets(rects);
    } else {
        return node.getBoundingClientRect();
    }
}

function getElementDimensions(domElement) {
    const calculatedStyle = window.getComputedStyle(domElement);
    return {
        borderLeft: parseInt(calculatedStyle.borderLeftWidth, 10),
        borderRight: parseInt(calculatedStyle.borderRightWidth, 10),
        borderTop: parseInt(calculatedStyle.borderTopWidth, 10),
        borderBottom: parseInt(calculatedStyle.borderBottomWidth, 10),
        marginLeft: parseInt(calculatedStyle.marginLeft, 10),
        marginRight: parseInt(calculatedStyle.marginRight, 10),
        marginTop: parseInt(calculatedStyle.marginTop, 10),
        marginBottom: parseInt(calculatedStyle.marginBottom, 10),
        paddingLeft: parseInt(calculatedStyle.paddingLeft, 10),
        paddingRight: parseInt(calculatedStyle.paddingRight, 10),
        paddingTop: parseInt(calculatedStyle.paddingTop, 10),
        paddingBottom: parseInt(calculatedStyle.paddingBottom, 10),
    };
}

function drawBoxAroundElement(...elements) {
    traceUpdates(elements);
}

window.startHighlightUpdates = () => {
    initialize();

    let nodesUpdatedThisTick = [];
    let nextTickTimeout;
    window.onNodeUpdate = node => {
        nodesUpdatedThisTick.push(node);
        if (nextTickTimeout) {
            clearTimeout(nextTickTimeout);
        }
        nextTickTimeout = setTimeout(() => {
            drawBoxAroundElement(
                ...nodesUpdatedThisTick.map(node =>
                    node instanceof Text ? node.parentElement : node,
                ),
            );
            nodesUpdatedThisTick = [];
        }, 0);
    };
};


/***/ }),

/***/ "./src/index.tsx":
/*!***********************!*\
  !*** ./src/index.tsx ***!
  \***********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dmf */ "../core/dist/index.js");
/* harmony import */ var dmf__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dmf__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./drawBoxAroundElement */ "./src/drawBoxAroundElement.js");
/* harmony import */ var _drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_drawBoxAroundElement__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _TodoList__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./TodoList */ "./src/TodoList.tsx");
/* harmony import */ var _ClickerEditor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ClickerEditor */ "./src/ClickerEditor.tsx");



dmf__WEBPACK_IMPORTED_MODULE_0__["$"];
dmf__WEBPACK_IMPORTED_MODULE_0__["React"];

const $num = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(5);
let $x = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(0);
let $y = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(0);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(Object(_ClickerEditor__WEBPACK_IMPORTED_MODULE_3__["default"])(), document.body);

function ToggleView(children) {
  let $isVisible = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(true);
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $isVisible.$ref = !$isVisible.$ref
  }, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$isVisible], (____prev, ____saved) => {
    const ____curr = {
      _0: $isVisible.$ref
    };

    if (____curr._0 && ____prev.ref._0) {
      if (____saved) {
        console.log("Skipping because saved value", ____saved.ref);
        return ____saved.ref;
      }
    }

    ____prev.ref = ____curr;
    return ____curr._0 ? "Hide" : "Show";
  })), " ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$isVisible], (____prev, ____saved) => {
    const ____curr = {
      _0: $isVisible.$ref
    };

    if (____curr._0 && ____prev.ref._0) {
      if (____saved) {
        console.log("Skipping because saved value", ____saved.ref);
        return ____saved.ref;
      }
    }

    ____prev.ref = ____curr;
    return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, children()) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Nothing to see here.");
  }));
}

const portalResult = document.createElement("div");
const startResult = document.createTextNode("---start portal---");
const endResult = document.createTextNode("---end portal---");
portalResult.appendChild(startResult);
portalResult.appendChild(endResult);
document.body.appendChild(portalResult);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, ToggleView(() => Object(dmf__WEBPACK_IMPORTED_MODULE_0__["Portal"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "hi! this node was made inside a portal! it even has a toggleview:", " ", ToggleView(() => dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Here's the content!"))), portalResult, endResult))), document.body);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, ToggleView(() => dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, NumberThing($num), NumberThing($num), NumberThing($num), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", {
  class: "box",
  onMouseMove: e => {
    $x.$ref = e.clientX;
    $y.$ref = e.clientY;
  }
}, "Mouse position: x: ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$x], (____prev, ____saved) => {
  const ____curr = {};
  ____prev.ref = ____curr;
  return $x.$ref;
}), ", y: ", dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$y], (____prev, ____saved) => {
  const ____curr = {};
  ____prev.ref = ____curr;
  return $y.$ref;
}))))), document.body);

function NumberThing($q) {
  // for functionalcomponents, every argument should get auto converted to a watchable whether it is or not
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $q.$ref--
  }, "--"), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$q.$get("toFixed")], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return $q.$get("toFixed").$ref();
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$q], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return console.log("value is", $q.$ref);
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $q.$ref++
  }, "++"));
}

let $obj = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(undefined);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$obj], (____prev, ____saved) => {
  const ____curr = {
    _0: $obj.$ref === undefined
  };

  if (____curr._0 && ____prev.ref._0) {
    if (____saved) {
      console.log("Skipping because saved value", ____saved.ref);
      return ____saved.ref;
    }
  }

  ____prev.ref = ____curr;
  return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, "not defined") : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("span", null, NumberThing($obj.$get("a")), " ", NumberThing($obj.$get("b")));
}), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
  onClick: () => $obj.$ref = undefined
}, "set undefined"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
  onClick: () => $obj.$ref = {
    a: 5,
    b: 6
  }
}, "set 5, 6")), document.body);
const $globalCounter = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(0);

function NestedTest($o) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$o], (____prev, ____saved) => {
    const ____curr = {
      _0: $o.$ref
    };

    if (____curr._0 && ____prev.ref._0) {
      if (____saved) {
        console.log("Skipping because saved value", ____saved.ref);
        return ____saved.ref;
      }
    }

    ____prev.ref = ____curr;
    return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
      onClick: () => $o.$ref = undefined
    }, "Remove"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
      type: "text",
      value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$o.$get("text")], (____prev, ____saved) => {
        const ____curr = {};
        ____prev.ref = ____curr;
        return $o.$get("text").$ref;
      }),
      onInput: e => $o.$get("text").$ref = e.currentTarget.value
    }), NumberThing($o.$get("counter")), NumberThing($globalCounter), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("ul", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, "a: ", NestedTest($o.$get("a"))), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, "b: ", NestedTest($o.$get("b"))))) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
      onClick: () => $o.$ref = {
        a: undefined,
        b: undefined,
        text: "",
        counter: 0
      }
    }, "Create"));
  })); // $o ? isn't great because it updates every time $o or anything under it changes... not sure how to fix.
  // maybe there should be some way of specifying that we don't need deep values on this one because we're just comparing it against true or false
}

let $nestedO = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(undefined);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(NestedTest($nestedO), document.body);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(ToggleView(() => NestedTest($nestedO)), document.body);
let $showSection = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(true);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$showSection], (____prev, ____saved) => {
  const ____curr = {
    _0: $showSection.$ref
  };

  if (____curr._0 && ____prev.ref._0) {
    if (____saved) {
      console.log("Skipping because saved value", ____saved.ref);
      return ____saved.ref;
    }
  }

  ____prev.ref = ____curr;
  return ____curr._0 ? dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => {
      window.startHighlightUpdates();
      $showSection.$ref = false;
    }
  }, "highlight updates"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => window.onNodeUpdate = n => console.log(n)
  }, "log updates"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => window.onNodeUpdate = () => {}
  }, "ignore updates")) : dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null);
})), document.body);

function TodoList($list) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "StartTodoList"), dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$list], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($list.$ref, $item => dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "Item:", " ", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("input", {
      type: "text",
      value: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$item], (____prev, ____saved) => {
        const ____curr = {};
        ____prev.ref = ____curr;
        return $item.$ref;
      }),
      onInput: e => $item.$ref = e.currentTarget.value
    })));
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $list.$get("push").$ref("hmm")
  }, "+"), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "EndTodoList"));
}

const $list = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list(["hi"]));
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(TodoList($list), document.body);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(TodoList($list), document.body);

function NodeTestThing($list) {
  return dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("ul", null, dmf__WEBPACK_IMPORTED_MODULE_0__["$"].watch([$list], (____prev, ____saved) => {
    const ____curr = {};
    ____prev.ref = ____curr;
    return Object(dmf__WEBPACK_IMPORTED_MODULE_0__["ListRender"])($list.$ref, $node => dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, NumberThing($node.$get("num")), ",", " ", NodeTestThing($node.$get("subitems")))));
  }), dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("li", null, " ", dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("button", {
    onClick: () => $list.$get("push").$ref({
      num: 5,
      subitems: dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([])
    })
  }, "+"))));
}

const $listTest = dmf__WEBPACK_IMPORTED_MODULE_0__["$"].createWatchable(dmf__WEBPACK_IMPORTED_MODULE_0__["$"].list([]));
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(NodeTestThing($listTest), document.body);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(NodeTestThing($listTest), document.body);
Object(dmf__WEBPACK_IMPORTED_MODULE_0__["mount"])(dmf__WEBPACK_IMPORTED_MODULE_0__["React"].createElement("div", null, "---RealTodoList:", Object(_TodoList__WEBPACK_IMPORTED_MODULE_2__["TodoListApp"])()), document.body);

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4uL2NvcmUvZGlzdC9kb20uanMiLCJ3ZWJwYWNrOi8vLy4uL2NvcmUvZGlzdC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi4vY29yZS9kaXN0L3JlYWN0LmpzIiwid2VicGFjazovLy8uLi9jb3JlL2Rpc3Qvd2F0Y2hhYmxlLmpzIiwid2VicGFjazovLy8uL3NyYy9DbGlja2VyRWRpdG9yLnRzeCIsIndlYnBhY2s6Ly8vLi9zcmMvVG9kb0xpc3QudHN4Iiwid2VicGFjazovLy8uL3NyYy9kcmF3Qm94QXJvdW5kRWxlbWVudC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXgudHN4Il0sIm5hbWVzIjpbIiQiLCJSZWFjdCIsIlNlbGVjdExpc3QiLCJjaG9pY2VzIiwiJHZhbHVlIiwiY2hvaWNlRGF0YU1hcCIsIk1hcCIsImN1cnJlbnRDaG9pY2UiLCJtYXAiLCJhIiwiYiIsInNldCIsImhhcyIsImdldCIsIlJlc291cmNlRWRpdG9yIiwiJGl0ZW0iLCJMaXN0UmVuZGVyIiwiJHJlc291cmNlIiwic3ltYm9sIiwiZSIsImN1cnJlbnRUYXJnZXQiLCJ2YWx1ZSIsInJlc291cmNlIiwiY29zdCIsIkl0ZW1FZGl0b3IiLCJyZW1vdmVTZWxmIiwidHlwZSIsIm5hbWUiLCJkZXNjcmlwdGlvbiIsImRhdGEiLCJ1bmRlZmluZWQiLCJsaXN0IiwiQ2xpY2tlckVkaXRvciIsIiRpdGVtcyIsInJlcXVpcmVtZW50cyIsInByaWNlIiwiZWZmZWN0cyIsIiR1cGRhdGUiLCJKU09OIiwic3RyaW5naWZ5IiwicGFyc2UiLCJ2IiwiZml4IiwicmVzbyIsImRldCIsImFmdGVyIiwiY29uc29sZSIsImxvZyIsIk1hbmFnZWRUZXh0SW5wdXQiLCIkdGV4dCIsInByb3BzIiwiVG9kb0xpc3QiLCIkbGlzdCIsIiR3aXBJdGVtIiwiJGZpbHRlciIsInRoaXNTaG91bGRGb2N1cyIsInBsYWNlaG9sZGVyIiwib25LZXlQcmVzcyIsImNvZGUiLCJjaGVja2VkIiwiY29udGVudHMiLCIkc2hvd1JlbW92ZUNvbmZpcm0iLCJub2RlIiwic2V0VGltZW91dCIsImZvY3VzIiwiVG9kb0xpc3RBcHAiLCIkbGlzdE9mVG9kb0xpc3RzIiwiJGNvbmZpcm1WaXNpYmxlIiwiJG51bSIsIiR4IiwiJHkiLCJtb3VudCIsImRvY3VtZW50IiwiYm9keSIsIlRvZ2dsZVZpZXciLCJjaGlsZHJlbiIsIiRpc1Zpc2libGUiLCJwb3J0YWxSZXN1bHQiLCJjcmVhdGVFbGVtZW50Iiwic3RhcnRSZXN1bHQiLCJjcmVhdGVUZXh0Tm9kZSIsImVuZFJlc3VsdCIsImFwcGVuZENoaWxkIiwiUG9ydGFsIiwiTnVtYmVyVGhpbmciLCJjbGllbnRYIiwiY2xpZW50WSIsIiRxIiwiJG9iaiIsIiRnbG9iYWxDb3VudGVyIiwiTmVzdGVkVGVzdCIsIiRvIiwidGV4dCIsImNvdW50ZXIiLCIkbmVzdGVkTyIsIiRzaG93U2VjdGlvbiIsIndpbmRvdyIsInN0YXJ0SGlnaGxpZ2h0VXBkYXRlcyIsIm9uTm9kZVVwZGF0ZSIsIm4iLCJOb2RlVGVzdFRoaW5nIiwiJG5vZGUiLCJudW0iLCJzdWJpdGVtcyIsIiRsaXN0VGVzdCJdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQjtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtDQUErQztBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLEVBQUU7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDOztBQUU5QztBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxDQUFDO0FBQ0Q7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxDQUFDO0FBQ0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLENBQUM7QUFDRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsQ0FBQztBQUNEOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNB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Q3VDLEdBRHZDLEVBRUtELGFBQWEsQ0FBQ0MsS0FBRCxrQkFGbEIsQ0FESixDQURPLENBRGY7QUFBQSxNQVNJLG9FQUNLLEdBREwsRUFFSTtBQUNJLFdBQU8sRUFBRSxNQUNMakQsS0FBSyxLQUFMLGNBQVc7QUFBRWtELFNBQUcsRUFBRSxDQUFQO0FBQVVDLGNBQVEsRUFBRXZHLHFDQUFDLENBQUMrQixJQUFGLENBQU8sRUFBUDtBQUFwQixLQUFYO0FBRlIsU0FGSixDQVRKLENBREosQ0FESjtBQXdCSDs7QUFFRCxNQUFNeUUsU0FBUyxHQUFHLHFDQUFDLGlCQUFEeEcscUNBQUMsQ0FBQytCLElBQUYsQ0FBaUIsRUFBakIsQ0FBSCxDQUFmO0FBQ0F3QyxpREFBSyxDQUFDNkIsYUFBYSxDQUFDSSxTQUFELENBQWQsRUFBb0NoQyxRQUFRLENBQUNDLElBQTdDLENBQUw7QUFDQUYsaURBQUssQ0FBQzZCLGFBQWEsQ0FBQ0ksU0FBRCxDQUFkLEVBQW9DaEMsUUFBUSxDQUFDQyxJQUE3QyxDQUFMO0FBRUFGLGlEQUFLLENBQUMseUZBQXNCTiw2REFBVyxFQUFqQyxDQUFELEVBQTZDTyxRQUFRLENBQUNDLElBQXRELENBQUwsQyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvaW5kZXgudHN4XCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCB3YXRjaGFibGVfMSA9IHJlcXVpcmUoXCIuL3dhdGNoYWJsZVwiKTtcbi8vIG9yIFdhdGNoYWJsZURlcGVuZGVuY3lMaXN0IGJ1dCB3aHkgcmVzdHJpY3QgaXQ/XG4vLyB3YXRjaGFibGVkZXBlbmRlbmN5bGlzdCBpcyB0aGUgb25seSB0aGluZyB0aGF0IHdpbGwgYWN0dWFsbHkgYmUgdXNlZFxuLy8gcmVhbCBmcmFnbWVudHMgc2hvdWxkIGJlIHBvc3NpYmxlXG4vLyBub2RlcyBzaG91bGQgcmV0dXJuXG5sZXQgcTtcbmNvbnN0IGlzRXhpc3RpbmdOb2RlID0gU3ltYm9sKFwiaXNfZXhpc3Rpbmdfbm9kZVwiKTtcbmxldCBub2RlSXNFeGlzdGluZyA9IChub2RlKSA9PiAhIW5vZGVbaXNFeGlzdGluZ05vZGVdO1xuZnVuY3Rpb24gY3JlYXRlTm9kZShzcGVjKSB7XG4gICAgaWYgKG5vZGVJc0V4aXN0aW5nKHNwZWMpKSB7XG4gICAgICAgIHJldHVybiBzcGVjOyAvLyBhbHJlYWR5IGEgbm9kZSwgbm8gYWN0aW9uIHRvIHRha2VcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3BlYykpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUZyYWdtZW50Tm9kZShzcGVjLm1hcChpdCA9PiBjcmVhdGVOb2RlKGl0KSkpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBbaXNFeGlzdGluZ05vZGVdOiB0cnVlLFxuICAgICAgICBjcmVhdGVCZWZvcmUocGFyZW50LCBfX19hZnRlck9uY2UpIHtcbiAgICAgICAgICAgIGlmICh3YXRjaGFibGVfMS5pc1dhdGNoKHNwZWMpKSB7XG4gICAgICAgICAgICAgICAgLy8gT1BUSU1JWkFUSU9OOiBpZiBwcmV2IGlzIHRleHQgYW5kIG5leHQgaXMgdGV4dCwganVzdCB1cGRhdGUgbm9kZS5ub2RlVmFsdWVcbiAgICAgICAgICAgICAgICBsZXQgbm9kZUFmdGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlQWZ0ZXIsIF9fX2FmdGVyT25jZSk7XG4gICAgICAgICAgICAgICAgbGV0IG5vZGVFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxldCBwcmV2VXNlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgbGV0IHByZXZOb2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGxldCBvbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjaGFuZ2VkLCB1cGRhdGluZ1wiLCBzcGVjKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFub2RlRXhpc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiEhRVJST1I6IE5vZGUgdXBkYXRlZCBhZnRlciByZW1vdmFsLCBldmVuIHRob3VnaCB0aGUgd2F0Y2hlciB3YXMgdW5yZWdpc3RlcmVkLiBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBlcXVhbHMgcHJldmlvdXMgdmFsdWUsIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld1VzZXJOb2RlID0gc3BlYy4kcmVmO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldlVzZXJOb2RlID09PSBuZXdVc2VyTm9kZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gbm90aGluZyB0byBkbztcbiAgICAgICAgICAgICAgICAgICAgcHJldlVzZXJOb2RlID0gbmV3VXNlck5vZGU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBleGlzdGluZyBub2RlXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZOb2RlLnJlbW92ZVNlbGYoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHJlYWwgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld05vZGUgPSBjcmVhdGVOb2RlKG5ld1VzZXJOb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcHJldk5vZGUgPSBuZXdOb2RlLmNyZWF0ZUJlZm9yZShwYXJlbnQsIG5vZGVBZnRlcik7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5vbk5vZGVVcGRhdGUgJiYgd2luZG93Lm9uTm9kZVVwZGF0ZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbGV0IHVucmVnaXN0ZXJXYXRjaGVyID0gc3BlYy53YXRjaChvbmNoYW5nZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ3YXRjaGluZ1wiLCBzcGVjKTtcbiAgICAgICAgICAgICAgICBvbmNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIC8vIGl0IG1pZ2h0IGJlIGZpbmUgdG8gb25jaGFuZ2UgaW1tZWRpYXRlbHk7XG4gICAgICAgICAgICAgICAgLy8gbmV4dCB0aWNrIG1pZ2h0IG5vdCBiZSBncmVhdCBmb3IgcGVyZm9ybWFuY2Ugd2hlbiBpbnNlcnRpbmcgbGFyZ2UgdHJlZXNcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVTZWxmOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxsIHJlbW92YWwgaGFuZGxlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZOb2RlICYmIHByZXZOb2RlLnJlbW92ZVNlbGYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVucmVnaXN0ZXJXYXRjaGVyICYmIHVucmVnaXN0ZXJXYXRjaGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlRXhpc3RzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vZGUgcmVtb3ZpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3BlYyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIGxldCBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIiArIHNwZWMpO1xuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgX19fYWZ0ZXJPbmNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVTZWxmOiAoKSA9PiBub2RlLnJlbW92ZSgpLFxuICAgICAgICAgICAgICAgICAgICBbaXNFeGlzdGluZ05vZGVdOiB0cnVlLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIiFlcnJcIiwgc3BlYyk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG5vZGUgc3BlYzogKHNlZSBwcmV2aW91cyBsb2cpXCIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZU5vZGUgPSBjcmVhdGVOb2RlO1xuZnVuY3Rpb24gZ2V0SW5mZXIob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gb2JqZWN0W2tleV07XG59XG5mdW5jdGlvbiBjcmVhdGVIVE1MTm9kZSh0eXBlLCBhdHRycywgXG4vLyBeIFdhdGNoYWJsZTxQYXJ0aWFsPE5vZGVBdHRyaWJ1dGVzPE5vZGVOYW1lPj4+XG5jaGlsZCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIFtpc0V4aXN0aW5nTm9kZV06IHRydWUsXG4gICAgICAgIGNyZWF0ZUJlZm9yZShwYXJlbnQsIF9fX2FmdGVyT25jZSkge1xuICAgICAgICAgICAgbGV0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpO1xuICAgICAgICAgICAgLy8gISEhIFRPRE86OiBhdHRycyBpcyBhIG5vcm1hbCAobm90IHdhdGNoYWJsZSkgb2JqZWN0IGNvbnRhaW5pbmcgZG1mUmVzdCB3aGljaCBpcyBhIHdhdGNoYWJsZSBvYmplY3QuIHdoZW4gZG1mUmVzdCBjaGFuZ2VzLCBvYmplY3RTaGFsbG93RGlmZiBpcyB1c2VkIHRvIGNob29zZSB3aGF0IHVwZGF0ZXMuXG4gICAgICAgICAgICBsZXQgcHJldkF0dHJzID0ge307XG4gICAgICAgICAgICBsZXQgZXZlbnRIYW5kbGVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGxldCByZW1vdmFsSGFuZGxlcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICAvLyAhISEgbWVtb3J5OiBtb3ZlIHRoaXMgb3V0c2lkZS4gbm8gcmVhc29uIHRvIG1ha2UgYSBuZXcgb25lIHdpdGggZXZlcnkgbm9kZS5cbiAgICAgICAgICAgIGxldCBzZXRBdHRyaWJ1dGUgPSAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZW1vdmFsSGFuZGxlcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZhbEhhbmRsZXJzLmdldChrZXkpKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92YWxIYW5kbGVycy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2Ygd2F0Y2hhYmxlXzEuV2F0Y2hhYmxlQmFzZSkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmFsSGFuZGxlcnMuc2V0KGtleSwgdmFsdWUud2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEodmFsdWUgaW5zdGFuY2VvZiB3YXRjaGFibGVfMS5XYXRjaGFibGVCYXNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInR5cGVzY3JpcHRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdiA9IHZhbHVlLiRyZWY7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdiBpbnN0YW5jZW9mIHdhdGNoYWJsZV8xLldhdGNoYWJsZUJhc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ3YXRjaGFibGUgaXMgd2F0Y2hhYmxlLiBub3QgZ29vZC4gdGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZU5vdFdhdGNoYWJsZShrZXksIHJlc3YpO1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZU5vdFdhdGNoYWJsZShrZXksIHZhbHVlLiRyZWYpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZU5vdFdhdGNoYWJsZShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgc2V0QXR0cmlidXRlTm90V2F0Y2hhYmxlID0gKGtleSwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoXCJvblwiKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAhISEgVE9ETyBzdXBwb3J0IHtjYXB0dXJlOiB0cnVlfSBhbmQge3Bhc3NpdmU6IHRydWV9IGFuZCBtYXliZSBldmVuIGRlZmF1bHQgdG8gcGFzc2l2ZVxuICAgICAgICAgICAgICAgICAgICBsZXQgZXZlbnROYW1lID0ga2V5LnNsaWNlKDIpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcmV2SGFuZGxlciA9IGV2ZW50SGFuZGxlcnMuZ2V0KGV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2SGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgcHJldkhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdGVuZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcnMuc2V0KGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInNldHRpbmcgc3R5bGUgaXMgbm90IHN1cHBvcnRlZCB5ZXRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkbWZPbk1vdW50XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleSBpbiBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShrZXksIFwiXCIgKyB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBvbmNoYW5nZSA9IChhdHRycykgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBkaWZmID0gd2F0Y2hhYmxlXzEub2JqZWN0U2hhbGxvd0RpZmYocHJldkF0dHJzLCBhdHRycyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgW2tleSwgc3RhdGVdIG9mIGRpZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBcInVuY2hhbmdlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGdldEluZmVyKGF0dHJzLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IFwicmVtb3ZlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IFwiY2hpbGRyZW5cIiAmJiBzdGF0ZSAhPT0gXCJhZGRlZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjaGlsZHJlbiBwcm9wZXJ0eSBjYW5ub3QgYmUgY2hhbmdlZCBpbiBhIHJlYWwgaHRtbCBub2RlIHVzaW5nIHRoZSBjaGlsZHJlbiBhdHRyaWJ1dGUuIHBhc3MgYW4gdW5jaGFuZ2luZyBmcmFnbWVudCBpbnN0ZWFkIHRoYXQgaGFzIGNoaWxkcmVuIHRoYXQgY2hhbmdlLiAoc3RhdGUgd2FzIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIpXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IFwiY2hpbGRyZW5cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgcmVtb3ZlV2F0Y2hlcjtcbiAgICAgICAgICAgIGlmIChhdHRycy5kbWZSZXN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhdGNoYWJsZV8xLmlzV2F0Y2goYXR0cnMuZG1mUmVzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2UoT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBhdHRycyksIGF0dHJzLmRtZlJlc3QuJHJlZikpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVXYXRjaGVyID0gYXR0cnMuZG1mUmVzdC53YXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZShPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGF0dHJzKSwgYXR0cnMuZG1mUmVzdC4kcmVmKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2UoT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBhdHRycyksIGF0dHJzLmRtZlJlc3QpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvbmNoYW5nZShhdHRycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgY3JlYXRlZENoaWxkID0gY2hpbGQuY3JlYXRlQmVmb3JlKG5vZGUsIG51bGwpO1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBfX19hZnRlck9uY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICByZW1vdmVTZWxmOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVdhdGNoZXIgJiYgcmVtb3ZlV2F0Y2hlcigpO1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQ2hpbGQucmVtb3ZlU2VsZigpO1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgW2lzRXhpc3RpbmdOb2RlXTogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlSFRNTE5vZGUgPSBjcmVhdGVIVE1MTm9kZTtcbmZ1bmN0aW9uIGNyZWF0ZUZyYWdtZW50Tm9kZShjaGlsZHJlbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIFtpc0V4aXN0aW5nTm9kZV06IHRydWUsXG4gICAgICAgIGNyZWF0ZUJlZm9yZShwYXJlbnQsIF9fX2FmdGVyT25jZSkge1xuICAgICAgICAgICAgbGV0IG5vZGVBZnRlciA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlQWZ0ZXIsIF9fX2FmdGVyT25jZSk7XG4gICAgICAgICAgICBsZXQgY3JlYXRlZENoaWxkcmVuID0gY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImZyYWdtZW50IGluc2VydGluZ1wiLCBjaGlsZCwgXCJpbnRvXCIsIHBhcmVudCwgXCJiZWZvcmVcIiwgbm9kZUFmdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGQuY3JlYXRlQmVmb3JlKHBhcmVudCwgbm9kZUFmdGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICByZW1vdmVTZWxmOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgcmVtb3ZhbCBoYW5kbGVyc1xuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQ2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiBjaGlsZC5yZW1vdmVTZWxmKCkpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgW2lzRXhpc3RpbmdOb2RlXTogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlRnJhZ21lbnROb2RlID0gY3JlYXRlRnJhZ21lbnROb2RlO1xuZnVuY3Rpb24gY3JlYXRlUG9ydGFsKG5vZGUsIHBvcnRhbFRvLCBpbnNlcnRCZWZvcmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBbaXNFeGlzdGluZ05vZGVdOiB0cnVlLFxuICAgICAgICBjcmVhdGVCZWZvcmUoX3BhcmVudCwgX19fYWZ0ZXJPbmNlKSB7XG4gICAgICAgICAgICBsZXQgaW5zZXJ0ZWROb2RlID0gbm9kZS5jcmVhdGVCZWZvcmUocG9ydGFsVG8sIGluc2VydEJlZm9yZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHJlbW92ZVNlbGY6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0ZWROb2RlLnJlbW92ZVNlbGYoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFtpc0V4aXN0aW5nTm9kZV06IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZVBvcnRhbCA9IGNyZWF0ZVBvcnRhbDtcbmZ1bmN0aW9uIGNyZWF0ZUxpc3RSZW5kZXIobGlzdCwgY2IpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBbaXNFeGlzdGluZ05vZGVdOiB0cnVlLFxuICAgICAgICBjcmVhdGVCZWZvcmUocGFyZW50LCBhZnRlcikge1xuICAgICAgICAgICAgbGV0IGZpbmFsTm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShmaW5hbE5vZGUsIGFmdGVyKTtcbiAgICAgICAgICAgIC8vIGxldCBlbGVtZW50VG9Ob2RlQWZ0ZXJNYXAgPSBuZXcgTWFwPFxuICAgICAgICAgICAgLy8gICAgIFQsXG4gICAgICAgICAgICAvLyAgICAgeyBub2RlQWZ0ZXI6IENoaWxkTm9kZTsgbm9kZTogQ3JlYXRlZE5vZGVTcGVjIH1cbiAgICAgICAgICAgIC8vID4oKTtcbiAgICAgICAgICAgIGxldCBlbGVtZW50VG9Ob2RlQWZ0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBsZXQgcmVtb3ZhbEhhbmRsZXJzID0gW107XG4gICAgICAgICAgICBsaXN0LmZvckVhY2goKGl0ZW0sIHN5bWJvbCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHRFbGVtZW50ID0gY2IoaXRlbSwgc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBsZXQgbm9kZUFmdGVyID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgICAgICAgICAgICAgbGV0IG5vZGVCZWZvcmUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGVBZnRlciwgZmluYWxOb2RlKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGVCZWZvcmUsIG5vZGVBZnRlcik7XG4gICAgICAgICAgICAgICAgbGV0IGNyZWF0ZWROb2RlID0gY3JlYXRlTm9kZShyZXN1bHRFbGVtZW50KS5jcmVhdGVCZWZvcmUocGFyZW50LCBub2RlQWZ0ZXIpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRUb05vZGVBZnRlck1hcC5zZXQoc3ltYm9sLCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVCZWZvcmUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGU6IGNyZWF0ZWROb2RlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZW1vdmFsSGFuZGxlcnMucHVzaChsaXN0Lm9uQWRkKChpdGVtLCB7IGJlZm9yZSwgc3ltYm9sLCBhZnRlciB9KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50VG9Ob2RlQWZ0ZXJNYXAuZ2V0KHN5bWJvbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBvbmFkZCBoYXBwZW5zIGEgdGljayBkZWxheWVkIGZvciBwZXJmb3JtYW5jZSAoc28gdGhhdCBsaXN0IC5pbnNlcnQgaXMgZmFzdCBpbiBjYXNlIGxvdHMgb2YgbGlzdCBtYW5pcHVsYXRpb25zIGFyZSBiZWluZyBkb25lIGF0IG9uY2UpLlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0RWxlbWVudCA9IGNyZWF0ZU5vZGUoY2IoaXRlbSwgc3ltYm9sKSk7IC8vIHByZXRlbmQgaXRlbSBpcyBhIHQgd2hlbiBpdCdzIGFjdHVhbGx5IHdhdGNoYWJsZS4gdXNlcnMgbmVlZCB0byBwdXQgJFxuICAgICAgICAgICAgICAgIGxldCBub2RlQWZ0ZXIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICAgICAgICAgICAgICBsZXQgbm9kZUJlZm9yZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiOzpvbmFkZCB3YXMgY2FsbGVkIHRvIGluc2VydCBhZnRlclwiLCBhZnRlciwgXCIodmFsdWUpXCIsIGVsZW1lbnRUb05vZGVBZnRlck1hcC5nZXQoYWZ0ZXIpKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGVBZnRlciwgYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgPyAoKF9hID0gZWxlbWVudFRvTm9kZUFmdGVyTWFwLmdldChhZnRlcikpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5ub2RlQmVmb3JlKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgZmluYWxOb2RlXG4gICAgICAgICAgICAgICAgICAgIDogZmluYWxOb2RlKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGVCZWZvcmUsIG5vZGVBZnRlcik7XG4gICAgICAgICAgICAgICAgbGV0IGNyZWF0ZWROb2RlID0gcmVzdWx0RWxlbWVudC5jcmVhdGVCZWZvcmUocGFyZW50LCBub2RlQWZ0ZXIpO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRUb05vZGVBZnRlck1hcC5zZXQoc3ltYm9sLCB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVCZWZvcmUsXG4gICAgICAgICAgICAgICAgICAgIG5vZGU6IGNyZWF0ZWROb2RlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmVtb3ZhbEhhbmRsZXJzLnB1c2gobGlzdC5vblJlbW92ZSgoeyBiZWZvcmUsIHN5bWJvbCwgYWZ0ZXIgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gZWxlbWVudFRvTm9kZUFmdGVyTWFwLmdldChzeW1ib2wpO1xuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwid2FzIHJlcXVlc3RlZCB0byByZW1vdmUgYW4gZWxlbWVudCB0aGF0IGRvZXNuJ3QgZXhpc3RcIik7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5ub2RlLnJlbW92ZVNlbGYoKTtcbiAgICAgICAgICAgICAgICBlbGVtZW50Lm5vZGVCZWZvcmUucmVtb3ZlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHJlbW92ZVNlbGY6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZhbEhhbmRsZXJzLmZvckVhY2gocmggPT4gcmgoKSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRUb05vZGVBZnRlck1hcC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5ub2RlLnJlbW92ZVNlbGYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLm5vZGVCZWZvcmUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZUxpc3RSZW5kZXIgPSBjcmVhdGVMaXN0UmVuZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVhY3RfMSA9IHJlcXVpcmUoXCIuL3JlYWN0XCIpO1xuZXhwb3J0cy5SZWFjdCA9IHJlYWN0XzEuUmVhY3Q7XG5leHBvcnRzLkxpc3RSZW5kZXIgPSByZWFjdF8xLkxpc3RSZW5kZXI7XG5leHBvcnRzLlBvcnRhbCA9IHJlYWN0XzEuUG9ydGFsO1xuZXhwb3J0cy5tb3VudCA9IHJlYWN0XzEubW91bnQ7XG52YXIgd2F0Y2hhYmxlXzEgPSByZXF1aXJlKFwiLi93YXRjaGFibGVcIik7XG5leHBvcnRzLiQgPSB3YXRjaGFibGVfMS4kO1xuZXhwb3J0cy4kYmluZCA9IHdhdGNoYWJsZV8xLiRiaW5kO1xuZXhwb3J0cy5MaXN0ID0gd2F0Y2hhYmxlXzEuTGlzdDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpO1xuZXhwb3J0cy5SZWFjdCA9IHtcbiAgICBjcmVhdGVFbGVtZW50OiAoY29tcG9uZW50Q3JlYXRvciwgcHJvcHMsIC8vICEhISBzcHJlYWQgcHJvcHNcbiAgICAuLi5jaGlsZHJlbikgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0aW5nIGVsZW1lbnRcIiwgY29tcG9uZW50Q3JlYXRvciwgcHJvcHMsIGNoaWxkcmVuKTtcbiAgICAgICAgaWYgKCFwcm9wcylcbiAgICAgICAgICAgIHByb3BzID0ge307XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50Q3JlYXRvciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgbGV0IG5vZGVOYW1lID0gY29tcG9uZW50Q3JlYXRvcjtcbiAgICAgICAgICAgIGNvbXBvbmVudENyZWF0b3IgPSAoYXR0cnMpID0+IGRvbS5jcmVhdGVIVE1MTm9kZShub2RlTmFtZSwgYXR0cnMsIGF0dHJzLmNoaWxkcmVuKTtcbiAgICAgICAgfVxuICAgICAgICAvLyAhISEgUEVSRk9STUFOQ0UgZm9yIGNyZWF0aW5nIGh0bWwgbm9kZXMsIGRvbid0IG1ha2UgYWxsIHRoZSBwcm9wcyB3YXRjaGFibGVcbiAgICAgICAgbGV0IGZpbmFsUHJvcHMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHByb3BzKSwgeyBcbiAgICAgICAgICAgIC8vICEhISBwZXJmb3JtYW5jZSBkb24ndCBjcmVhdGUgYSBmcmFnbWVudCBpZiB0aGVyZSBhcmUgbm8gY2hpbGRyZW5cbiAgICAgICAgICAgIGNoaWxkcmVuOiBkb20uY3JlYXRlRnJhZ21lbnROb2RlKGNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImFkZGluZ1wiLCBjaGlsZCwgXCJ0b1wiLCBcImNoaWxkcmVuXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkb20uY3JlYXRlTm9kZShjaGlsZCk7XG4gICAgICAgICAgICB9KSkgfSk7IC8vIGRvZXMgbm90IHN1cHBvcnQgc3ByZWFkIHByb3BzXG4gICAgICAgIGNvbnNvbGUubG9nKFwiY3JlYXRpbmcgY29tcG9uZW50IHVzaW5nIGZpbmFscHJvcHNcIiwgZmluYWxQcm9wcyk7XG4gICAgICAgIHJldHVybiBjb21wb25lbnRDcmVhdG9yKGZpbmFsUHJvcHMpO1xuICAgIH0sXG4gICAgRnJhZ21lbnQ6IChwcm9wcykgPT4ge1xuICAgICAgICBsZXQgY2hpbGRyZW4gPSBBcnJheS5pc0FycmF5KHByb3BzLmNoaWxkcmVuKVxuICAgICAgICAgICAgPyBwcm9wcy5jaGlsZHJlblxuICAgICAgICAgICAgOiBwcm9wcy5jaGlsZHJlbiA9PSBudWxsXG4gICAgICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgICAgIDogW3Byb3BzLmNoaWxkcmVuXTtcbiAgICAgICAgcmV0dXJuIGRvbS5jcmVhdGVGcmFnbWVudE5vZGUoY2hpbGRyZW4ubWFwKGNoaWxkID0+IHtcbiAgICAgICAgICAgIHJldHVybiBkb20uY3JlYXRlTm9kZShjaGlsZCk7XG4gICAgICAgIH0pKTtcbiAgICB9LFxufTtcbmZ1bmN0aW9uIG1vdW50U2xvdyhlbGVtZW50LCBwYXJlbnQsIGJlZm9yZSkge1xuICAgIGRvbS5jcmVhdGVOb2RlKGVsZW1lbnQpLmNyZWF0ZUJlZm9yZShwYXJlbnQsIGJlZm9yZSB8fCBudWxsKTtcbn1cbmV4cG9ydHMubW91bnRTbG93ID0gbW91bnRTbG93O1xuZnVuY3Rpb24gbW91bnQoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgbGV0IHBhcmVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkb20uY3JlYXRlTm9kZShlbGVtZW50KS5jcmVhdGVCZWZvcmUocGFyZW50RWwsIG51bGwpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChwYXJlbnRFbCk7XG59XG5leHBvcnRzLm1vdW50ID0gbW91bnQ7XG5leHBvcnRzLkxpc3RSZW5kZXIgPSBkb20uY3JlYXRlTGlzdFJlbmRlcjtcbmZ1bmN0aW9uIFBvcnRhbChub2RlLCBwb3J0YWxUbywgaW5zZXJ0QmVmb3JlID0gbnVsbCkge1xuICAgIHJldHVybiBkb20uY3JlYXRlUG9ydGFsKGRvbS5jcmVhdGVOb2RlKG5vZGUpLCBwb3J0YWxUbywgaW5zZXJ0QmVmb3JlKTtcbn1cbmV4cG9ydHMuUG9ydGFsID0gUG9ydGFsO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyBkaWZmaW5nIHR1dG9yaWFsICh0byBwcmV2ZW50IHRoZSB1c2Ugb2Yga2V5cylcbi8vIDogZWFjaCBpdGVtIChzZXQgW1N5bWJvbC5kaWZmaGVscGVyXSA9U3ltYm9sKFwidlwiKSlcbi8vIG5vdyB0aGV5IGNhbiBiZSBhZGRlZCB0byBhIGxpc3QgcHJvcGVybHlcbnZhciBfYTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIG5leHRUaWNrKGNiKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiBjYigpLCAwKTtcbn1cbmV4cG9ydHMuaXNfd2F0Y2hhYmxlID0gU3ltYm9sKFwiaXMgd2F0Y2hhYmxlXCIpO1xuZXhwb3J0cy5zaG91bGRfYmVfcmF3ID0gU3ltYm9sKFwic2hvdWxkIGJlIHJhd1wiKTtcbmNsYXNzIFdhdGNoYWJsZUJhc2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLndhdGNoZXJzID0gW107XG4gICAgfVxuICAgIHdhdGNoKHdhdGNoZXIsIGRlZXApIHtcbiAgICAgICAgaWYgKHRoaXMud2F0Y2hlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAvLyBzZXR1cFxuICAgICAgICAgICAgdGhpcy5fc2V0dXAgJiYgdGhpcy5fc2V0dXAoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndhdGNoZXJzLnB1c2god2F0Y2hlcik7XG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy53YXRjaGVycyA9IHRoaXMud2F0Y2hlcnMuZmlsdGVyKGUgPT4gZSAhPT0gd2F0Y2hlcik7XG4gICAgICAgICAgICBpZiAodGhpcy53YXRjaGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBjbGVhbnVwXG4gICAgICAgICAgICAgICAgdGhpcy5fdGVhcmRvd24gJiYgdGhpcy5fdGVhcmRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVtaXQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZW1pdHRpbmcgZm9yIHdhdGNoZXJzXCIsIHRoaXMud2F0Y2hlcnMpO1xuICAgICAgICAvLyB0aGlzLndhdGNoZXJzLmZvckVhY2godyA9PiB3KCkpO1xuICAgICAgICBuZXh0VGljaygoKSA9PiB0aGlzLndhdGNoZXJzLmZvckVhY2godyA9PiB3KCkpKTtcbiAgICB9XG4gICAgZ2V0IFtleHBvcnRzLmlzX3dhdGNoYWJsZV0oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmV4cG9ydHMuV2F0Y2hhYmxlQmFzZSA9IFdhdGNoYWJsZUJhc2U7XG4vLyAhISEhISEhISEhISEhISBwb3NzaWJsZSBtZW1vcnkgbGVhazogdW51c2VkIGZha2V3YXRjaGFibGVzIG5lZWQgdG8gYmUgcmVtb3ZlZCB3aGVuIG5vIG9uZSBpcyB3YXRjaGluZyB0aGVtIGFueW1vcmVcbmNsYXNzIEZha2VXYXRjaGFibGUgZXh0ZW5kcyBXYXRjaGFibGVCYXNlIHtcbiAgICBjb25zdHJ1Y3Rvcih0aGluZywgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpbmcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpbmcgPSB0aGluZy5iaW5kKHBhcmVudC4kcmVmKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoaW5nID0gdGhpbmc7XG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIH1cbiAgICBnZXQgJHJlZigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhpbmc7XG4gICAgfVxuICAgIHNldCAkcmVmKF9udikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgc2V0IHJlZiB2YWx1ZSBvZiBmYWtld2F0Y2hhYmxlXCIpO1xuICAgIH1cbiAgICAkZ2V0KHYpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGYWtlV2F0Y2hhYmxlKHRoaXMudGhpbmdbdl0sIHRoaXMpO1xuICAgIH1cbiAgICB3YXRjaCh3YXRjaGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC53YXRjaCh3YXRjaGVyKTtcbiAgICB9XG59XG5leHBvcnRzLkZha2VXYXRjaGFibGUgPSBGYWtlV2F0Y2hhYmxlO1xuLy8gVE9ETyBkZWVwIGVtaXQuIHRoaW5ncyB0aGF0IHdhdGNoIHNob3VsZCBzaG9ydCBjaXJjdWl0IHF1aWNrbHkgc28gaXQgKnNob3VsZG4ndCogYmUgYSBwZXJmb3JtYW5jZSBpc3N1ZS5cbmNsYXNzIFdhdGNoYWJsZVRoaW5nIGV4dGVuZHMgV2F0Y2hhYmxlQmFzZSB7XG4gICAgY29uc3RydWN0b3IodiwgaXNVbnVzZWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLiRyZWYgPSB2O1xuICAgICAgICB0aGlzLmlzVW51c2VkID0gaXNVbnVzZWQ7XG4gICAgICAgIC8vICEhISEhIGlmKGlzV2F0Y2hhYmxlKHYpKSB7XG4gICAgICAgIC8vICAgd2F0Y2hbdl0gYW5kIGFkZCB0byB3YXRjaGFibGVfY2xlYW51cFxuICAgICAgICAvLyB9XG4gICAgfVxuICAgIHNldCAkcmVmKG52KSB7XG4gICAgICAgIC8vICEhISEhISEhISEhISEhISEhISEhISEhISBlbWl0IHRvIGFueSBhYm92ZSB1cyAoaGlnaGVzdCBmaXJzdClcbiAgICAgICAgLy8gISEhISEhISEhISEhISEhISEhISEhISEhIF4gdGhlIGFib3ZlIHNob3VsZCBvbmx5IGhhcHBlbiB0byBzcGVjaWFsIHdhdGNoZXJzIChmb3JleCBhLmIgfHwgJGRlZXApXG4gICAgICAgIHRoaXMuZW1pdCgpOyAvLyBlbWl0IGJlZm9yZSBhbnl0aGluZyB1bmRlciB1cyBwb3RlbnRpYWxseSBlbWl0c1xuICAgICAgICB0aGlzLmlzVW51c2VkID0gZmFsc2U7XG4gICAgICAgIC8vIGlmKHNlbGYgaW5zdGFuY2VvZiBsaXN0KSAvLyBkbyBzdHVmZlxuICAgICAgICBpZiAobnYgJiYgbnZbZXhwb3J0cy5zaG91bGRfYmVfcmF3XSkge1xuICAgICAgICAgICAgLy8gaW5zdGVhZCBvZiBtYW51YWwgaWYgc3RhdGVtZW50cywgd2h5IG5vdCBoYXZlIGEgcHJvcHJldHkgdGhhdCBzYXlzIHRoaW5nc1xuICAgICAgICAgICAgLy8gdGhpcy5fX3YuJHJlZiA9IG52O1xuICAgICAgICAgICAgdGhpcy5fX3YgPSBudjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX192ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBudiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gaWYgaXMgYXJyYXksIGdvb2QgbHVjay4uLlxuICAgICAgICAgICAgbGV0IGV4aXN0aW5nS2V5cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX192KTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG52KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gbnZba2V5XTtcbiAgICAgICAgICAgICAgICB0aGlzLiRnZXQoa2V5KS4kcmVmID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGV4aXN0aW5nS2V5c1trZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhleGlzdGluZ0tleXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBleGlzdGluZ0tleXNba2V5XTtcbiAgICAgICAgICAgICAgICB2YWx1ZS4kcmVmID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhbHVlLmlzVW51c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbnYgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRoaXMuX192ID0ge307XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhudikuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IG52W2tleV07XG4gICAgICAgICAgICAgICAgdGhpcy4kZ2V0KGtleSkuJHJlZiA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX3YgPSBudjtcbiAgICB9XG4gICAgZ2V0ICRyZWYoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRElEIEdFVCBWQUxVRSBPRiBcIiwgdGhpcyk7XG4gICAgICAgIGlmICh0aGlzLl9fdiAmJiB0aGlzLl9fdltleHBvcnRzLnNob3VsZF9iZV9yYXddKSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzLl9fdltzb21lX3Byb3BlcnR5XVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX192O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fX3YgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGxldCBuZXdPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX192KS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5fX3Zba2V5XS4kcmVmO1xuICAgICAgICAgICAgICAgIG5ld09iamVjdFtrZXldID0gdmFsdWU7IC8vICEhISEhISEgaWYgdmFsdWUgaXMgdGVtcG9yYXJ5LCBpZ25vcmUgaXRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5ld09iamVjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fX3Y7XG4gICAgfVxuICAgICRnZXQodikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIiRnZXQgd2FzIHVzZWQgd2l0aCBcIiwgdik7XG4gICAgICAgIGlmICh0aGlzLl9fdiAmJiB0aGlzLl9fdltleHBvcnRzLnNob3VsZF9iZV9yYXddKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZha2VXYXRjaGFibGUodGhpcy5fX3Zbdl0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fX3YgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGlmICghKHYgaW4gdGhpcy5fX3YpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3Zbdl0gPSBuZXcgV2F0Y2hhYmxlVGhpbmcodW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fX3Zbdl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLl9fdlt2XTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB2YWwgPSB0aGlzLl9fdlt2XTtcbiAgICAgICAgICAgIGlmICh2YWxbZXhwb3J0cy5pc193YXRjaGFibGVdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IG5ldyBGYWtlV2F0Y2hhYmxlKHZhbCwgdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kcmVmO1xuICAgIH1cbn1cbmV4cG9ydHMuV2F0Y2hhYmxlVGhpbmcgPSBXYXRjaGFibGVUaGluZztcbmV4cG9ydHMuc3ltYm9sS2V5ID0gKHYpID0+IHY7XG4vLyBtYWtlIGEgcmVhbCBhcnJheSB3cmFwcGVyIHRoYXQgdXNlcyBtYXBzIHRvIGRpZmYgdXBkYXRlXG4vLyBsZXQgJGEgPSBbMSwyLDMsMV07XG4vLyAkYSA9ICRhLmZpbHRlcihxID0+IHEgPT09IDEpO1xuLy8gZW1pdCByZW1vdmUgMiB3aXRoIEFycmF5WzEsMV1cbi8vIGVtaXQgcmVtb3ZlIDMgd2l0aCBBcnJheVsxLDFdXG4vLyBUT0RPIGd1ZXNzIHdoYXQgbWFwcyBleGlzdFxuLy8gdXNlIHRoZSBvYmplY3QgaXRzZWxmIGFzIGtleXNcbi8vIHdpbGwgYmUgaGVscGZ1bCBmb3IgZGlmZiBzZXQgYW5kIHJlbW92ZSB0aGUgcmVxdWlyZW1lbnQgdG8gdXNlIHN5bWJvbCBrZXlzIHNvIHlvdSBjYW4ganVzdCBwYXNzIHRoZSBvYmplY3QgKGxpc3QuZm9yRWFjaChlbCA9PiBsaXN0LnJlbW92ZShlbCkpKSBhbmQgc3RpbGwgaGF2ZSBjb25zdGFudCB0aW1lLiBtaWdodCBtYWtlIG1vcmUgd29yayBmb3IgdGhlIGdhcmJhZ2UgY29sbGVjdGVyIGJ1dCBJIGRvbid0IGtub3cgYW55dGhpbmcgYWJvdXQgaG93IHRoZSBqYXZhc2NyaXB0IGdhcmJhZ2UgY29sbGVjdG9yIHdvcmtzIHNvIGlka1xuY2xhc3MgTGlzdCB7XG4gICAgY29uc3RydWN0b3IoaXRlbXMpIHtcbiAgICAgICAgdGhpc1tfYV0gPSB0cnVlO1xuICAgICAgICB0aGlzLl9faXRlbXMgPSB7fTtcbiAgICAgICAgdGhpcy5fX29uQWRkID0gW107XG4gICAgICAgIHRoaXMuX19vblJlbW92ZSA9IFtdO1xuICAgICAgICB0aGlzLl9fbGVuZ3RoID0gZXhwb3J0cy4kLmNyZWF0ZVdhdGNoYWJsZSgwKTtcbiAgICAgICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHRoaXMucHVzaChpdGVtKSk7XG4gICAgfVxuICAgIG9uQWRkKGNiKSB7XG4gICAgICAgIHRoaXMuX19vbkFkZC5wdXNoKGNiKTtcbiAgICAgICAgcmV0dXJuICgpID0+ICh0aGlzLl9fb25BZGQgPSB0aGlzLl9fb25BZGQuZmlsdGVyKHYgPT4gdiAhPT0gY2IpKTtcbiAgICB9XG4gICAgb25SZW1vdmUoY2IpIHtcbiAgICAgICAgdGhpcy5fX29uUmVtb3ZlLnB1c2goY2IpO1xuICAgICAgICByZXR1cm4gKCkgPT4gKHRoaXMuX19vblJlbW92ZSA9IHRoaXMuX19vblJlbW92ZS5maWx0ZXIodiA9PiB2ICE9PSBjYikpO1xuICAgIH1cbiAgICBpbnNlcnQobywgaXRlbSkge1xuICAgICAgICBsZXQgdGhpc0l0ZW1TeW1ib2wgPSBTeW1ib2woXCJuZXcgaXRlbVwiKTtcbiAgICAgICAgbGV0IHdhdGNoYWJsZUl0ZW0gPSBleHBvcnRzLiQuY3JlYXRlV2F0Y2hhYmxlKGl0ZW0pO1xuICAgICAgICBsZXQgYmVmb3JlSXRlbVN5bWJvbCA9IFwiYWZ0ZXJcIiBpbiBvXG4gICAgICAgICAgICA/IG8uYWZ0ZXJcbiAgICAgICAgICAgIDogby5iZWZvcmVcbiAgICAgICAgICAgICAgICA/IHRoaXMuX19pdGVtc1tleHBvcnRzLnN5bWJvbEtleShvLmJlZm9yZSldLnByZXZcbiAgICAgICAgICAgICAgICA6IHRoaXMuX19sYXN0O1xuICAgICAgICBsZXQgYmVmb3JlSXRlbSA9IGJlZm9yZUl0ZW1TeW1ib2xcbiAgICAgICAgICAgID8gdGhpcy5fX2l0ZW1zW2V4cG9ydHMuc3ltYm9sS2V5KGJlZm9yZUl0ZW1TeW1ib2wpXVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBhZnRlckl0ZW1TeW1ib2wgPSBiZWZvcmVJdGVtID8gYmVmb3JlSXRlbS5uZXh0IDogdGhpcy5fX2ZpcnN0O1xuICAgICAgICBsZXQgYWZ0ZXJJdGVtID0gYWZ0ZXJJdGVtU3ltYm9sXG4gICAgICAgICAgICA/IHRoaXMuX19pdGVtc1tleHBvcnRzLnN5bWJvbEtleShhZnRlckl0ZW1TeW1ib2wpXVxuICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB0aGlzSXRlbSA9IHtcbiAgICAgICAgICAgIHByZXY6IGJlZm9yZUl0ZW1TeW1ib2wsXG4gICAgICAgICAgICBuZXh0OiBhZnRlckl0ZW1TeW1ib2wsXG4gICAgICAgICAgICBzZWxmOiB3YXRjaGFibGVJdGVtLFxuICAgICAgICAgICAgc3ltYm9sOiB0aGlzSXRlbVN5bWJvbCxcbiAgICAgICAgICAgIHJlbW92ZVNlbGY6ICgoKSA9PiB7IH0pLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoYmVmb3JlSXRlbSkge1xuICAgICAgICAgICAgYmVmb3JlSXRlbS5uZXh0ID0gdGhpc0l0ZW1TeW1ib2w7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9fZmlyc3QgPSB0aGlzSXRlbVN5bWJvbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWZ0ZXJJdGVtKSB7XG4gICAgICAgICAgICBhZnRlckl0ZW0ucHJldiA9IHRoaXNJdGVtU3ltYm9sO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fX2xhc3QgPSB0aGlzSXRlbVN5bWJvbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9faXRlbXNbZXhwb3J0cy5zeW1ib2xLZXkodGhpc0l0ZW1TeW1ib2wpXSA9IHRoaXNJdGVtO1xuICAgICAgICB0aGlzLl9fbGVuZ3RoLiRyZWYrKztcbiAgICAgICAgbmV4dFRpY2soKCkgPT4gdGhpcy5fX29uQWRkLmZvckVhY2gob2EgPT4gb2Eod2F0Y2hhYmxlSXRlbSwge1xuICAgICAgICAgICAgYmVmb3JlOiBiZWZvcmVJdGVtU3ltYm9sLFxuICAgICAgICAgICAgYWZ0ZXI6IGFmdGVySXRlbVN5bWJvbCxcbiAgICAgICAgICAgIHN5bWJvbDogdGhpc0l0ZW1TeW1ib2wsXG4gICAgICAgIH0pKSk7XG4gICAgICAgIC8vIG5leHQgdGljaywgZW1pdCBhZGQgZXZlbnRcbiAgICB9XG4gICAgcmVtb3ZlKGl0ZW1TeW1ib2wpIHtcbiAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLl9faXRlbXNbZXhwb3J0cy5zeW1ib2xLZXkoaXRlbVN5bWJvbCldO1xuICAgICAgICBsZXQgcHJldkl0ZW0gPSB0aGlzLl9faXRlbXNbZXhwb3J0cy5zeW1ib2xLZXkoaXRlbS5wcmV2KV07XG4gICAgICAgIGxldCBuZXh0SXRlbSA9IHRoaXMuX19pdGVtc1tleHBvcnRzLnN5bWJvbEtleShpdGVtLm5leHQpXTtcbiAgICAgICAgaWYgKHByZXZJdGVtKVxuICAgICAgICAgICAgcHJldkl0ZW0ubmV4dCA9IGl0ZW0ubmV4dDtcbiAgICAgICAgaWYgKG5leHRJdGVtKVxuICAgICAgICAgICAgbmV4dEl0ZW0ucHJldiA9IGl0ZW0ucHJldjtcbiAgICAgICAgaWYgKCFwcmV2SXRlbSlcbiAgICAgICAgICAgIHRoaXMuX19maXJzdCA9IGl0ZW0ubmV4dDtcbiAgICAgICAgaWYgKCFuZXh0SXRlbSlcbiAgICAgICAgICAgIHRoaXMuX19sYXN0ID0gaXRlbS5wcmV2O1xuICAgICAgICBuZXh0VGljaygoKSA9PiB0aGlzLl9fb25SZW1vdmUuZm9yRWFjaChvciA9PiBvcih7XG4gICAgICAgICAgICBiZWZvcmU6IGl0ZW0ucHJldixcbiAgICAgICAgICAgIGFmdGVyOiBpdGVtLm5leHQsXG4gICAgICAgICAgICBzeW1ib2w6IGl0ZW0uc3ltYm9sLFxuICAgICAgICB9KSkpO1xuICAgIH1cbiAgICBmb3JFYWNoKGNiKSB7XG4gICAgICAgIGxldCBjdXJyZW50U3ltYm9sID0gdGhpcy5fX2ZpcnN0O1xuICAgICAgICB3aGlsZSAoY3VycmVudFN5bWJvbCkge1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLl9faXRlbXNbZXhwb3J0cy5zeW1ib2xLZXkoY3VycmVudFN5bWJvbCldO1xuICAgICAgICAgICAgY2IoaXRlbS5zZWxmLCBpdGVtLnN5bWJvbCk7XG4gICAgICAgICAgICBjdXJyZW50U3ltYm9sID0gaXRlbS5uZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXJyYXkoKSB7XG4gICAgICAgIGxldCByZXNhcnIgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGl0ZW0gPT4gcmVzYXJyLnB1c2goaXRlbSkpO1xuICAgICAgICByZXR1cm4gcmVzYXJyO1xuICAgIH1cbiAgICB1cGRhdGVEaWZmKF9udikge1xuICAgICAgICAvLyBzZXRIZWxwZXJTeW1ib2wgPSBTeW1ib2woXCJzZXQgaGVscGVyXCIpXG4gICAgICAgIC8vIG9uIGVhY2ggaXRlbSwgc2V0IGEgc2V0aGVscGVyc3ltYm9sXG4gICAgICAgIC8vIHVzZSB0aGlzIHRvIHN0b3JlIHZhbHVlcyBpbiBhIHt9IGFuZCBkaWZmXG4gICAgICAgIC8vIG8obikgcHJvYmFibHkgd2hhdGV2ZXIgdGhhdCBtZWFucy4gb3IgbygzbikgaWYgdGhhdCBleGlzdHMuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImxpc3QgZGlmZiBzZXQgaXMgbm90IHN1cHBvcnRlZCB5ZXRcIik7XG4gICAgfVxuICAgIHB1c2goaXRlbSkge1xuICAgICAgICB0aGlzLmluc2VydCh7IGFmdGVyOiB0aGlzLl9fbGFzdCB9LCBpdGVtKTtcbiAgICB9XG4gICAgdW5zaGlmdChpdGVtKSB7XG4gICAgICAgIHRoaXMuaW5zZXJ0KHsgYmVmb3JlOiB0aGlzLl9fZmlyc3QgfSwgaXRlbSk7XG4gICAgfVxuICAgIGdldCBsZW5ndGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbGVuZ3RoO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFycmF5KCk7XG4gICAgfVxufVxuZXhwb3J0cy5MaXN0ID0gTGlzdDtcbl9hID0gZXhwb3J0cy5zaG91bGRfYmVfcmF3O1xuY2xhc3MgV2F0Y2hhYmxlRGVwZW5kZW5jeUxpc3QgZXh0ZW5kcyBXYXRjaGFibGVCYXNlIHtcbiAgICBjb25zdHJ1Y3RvcihkZXBlbmRlbmN5TGlzdCwgZ2V0VmFsdWUpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wcmV2aW91c0RhdGEgPSB7IHJlZjoge30gfTtcbiAgICAgICAgdGhpcy5yZW1vdmFsSGFuZGxlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5zYXZlZFJldHVyblZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmRlcGVuZGVuY3lMaXN0ID0gZGVwZW5kZW5jeUxpc3Q7XG4gICAgICAgIHRoaXMuZ2V0VmFsdWUgPSBnZXRWYWx1ZTtcbiAgICB9XG4gICAgX3NldHVwKCkge1xuICAgICAgICB0aGlzLmRlcGVuZGVuY3lMaXN0LmZvckVhY2goaXRlbSA9PiB0aGlzLnJlbW92YWxIYW5kbGVycy5wdXNoKGl0ZW0ud2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJpdGVtIHdhdGNoIGVtaXR0ZWRcIik7XG4gICAgICAgICAgICBuZXh0VGljaygoKSA9PiB0aGlzLmVtaXQoKSk7IC8vICEhISByZW1vdmUgdGhpc1xuICAgICAgICB9KSkpO1xuICAgIH1cbiAgICBfdGVhcmRvd24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwidGVhcmluZyBkb3duIHVwIHdhdGNoZXIgZm9yXCIsIHRoaXMucmVtb3ZhbEhhbmRsZXJzKTtcbiAgICAgICAgdGhpcy5yZW1vdmFsSGFuZGxlcnMuZm9yRWFjaChyaCA9PiByaCgpKTtcbiAgICB9XG4gICAgZ2V0ICRyZWYoKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUodGhpcy5wcmV2aW91c0RhdGEsIHRoaXMuc2F2ZWRSZXR1cm5WYWx1ZSk7XG4gICAgICAgIHRoaXMuc2F2ZWRSZXR1cm5WYWx1ZSA9IHsgcmVmOiB2YWx1ZSB9O1xuICAgICAgICByZXR1cm4gdmFsdWU7IC8vIGRvbSB3aWxsIGNoZWNrIHN0cmljdCBlcXVhbGl0eSBzbyBpZiBhIG5ldyBub2RlIGlzIGNyZWF0ZWQgaXQgd2lsbCBrbm93IHRoZXJlIGlzIG5vdGhpbmcgdG8gZG8gLy8gPC0tIHRoZSBvcHBvc2l0ZVxuICAgIH1cbiAgICBzZXQgJHJlZih2KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBzZXQgdmFsdWUgb2Ygd2F0Y2hhYmxlIGRlcGVuZGVuY3kgbGlzdC5cIik7XG4gICAgfVxufVxuZXhwb3J0cy5XYXRjaGFibGVEZXBlbmRlbmN5TGlzdCA9IFdhdGNoYWJsZURlcGVuZGVuY3lMaXN0O1xuZXhwb3J0cy4kID0ge1xuICAgIGNyZWF0ZVdhdGNoYWJsZTogKHYpID0+IG5ldyBXYXRjaGFibGVUaGluZyh2KSxcbiAgICBsaXN0KGl0ZW1zKSB7XG4gICAgICAgIHJldHVybiBuZXcgTGlzdChpdGVtcyk7XG4gICAgfSxcbiAgICB3YXRjaChkZXBlbmRlbmN5TGlzdCwgZ2V0VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBXYXRjaGFibGVEZXBlbmRlbmN5TGlzdChkZXBlbmRlbmN5TGlzdCwgZ2V0VmFsdWUpO1xuICAgIH0sXG59O1xuZnVuY3Rpb24gaXNXYXRjaCh2KSB7XG4gICAgLy8gcmV0dXJuIHYgPT0gbnVsbCA/IGZhbHNlIDogISEodiBhcyBhbnkpW2lzX3dhdGNoYWJsZV07XG4gICAgcmV0dXJuIHYgaW5zdGFuY2VvZiBXYXRjaGFibGVCYXNlO1xufVxuZXhwb3J0cy5pc1dhdGNoID0gaXNXYXRjaDtcbi8vIGV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hhYmxlIHtcbi8vICAgICB3YXRjaCh2OiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZDsgLy8gd2F0Y2god2F0Y2hlcikgcmV0dXJucyB1bndhdGNoZXJcbi8vIH1cbmZ1bmN0aW9uIG9iamVjdFNoYWxsb3dEaWZmKHByZXYsIGN1cnIpIHtcbiAgICBsZXQgcHJvcGVydHlDaGFuZ2VNYXAgPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXMoY3VycikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHByb3BlcnR5Q2hhbmdlTWFwLnNldChrZXksIHsgc3RhdGU6IFwiYWRkZWRcIiwgdmFsdWUgfSk7XG4gICAgfSk7XG4gICAgT2JqZWN0LmVudHJpZXMocHJldikuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIGxldCBjbSA9IHByb3BlcnR5Q2hhbmdlTWFwLmdldChrZXkpO1xuICAgICAgICBpZiAoY20pIHtcbiAgICAgICAgICAgIGlmIChjbS52YWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgICAgICAgY20uc3RhdGUgPSBcInVuY2hhbmdlZFwiO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNtLnN0YXRlID0gXCJjaGFuZ2VkXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm9wZXJ0eUNoYW5nZU1hcC5zZXQoa2V5LCB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFwicmVtb3ZlZFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGxldCByZXN1bHRNYXAgPSBuZXcgTWFwKCk7XG4gICAgLy8gaXQgbWlnaHQgYmUgbmljZSB0byByZXR1cm4gcHJvcGVydHlDaGFuZ2VNYXAgZGlyZWN0bHkgYnV0IHRoYXQgd291bGQgcmVxdWlyZSBsb3RzIG9mIHR5cGVzY3JpcHQgc3R1ZmYgc28gdGhhdCB0aGlzIGZ1bmN0aW9uIGtub3dzIHRoZSB0eXBlcyBvZiB0aGUgb2JqZWN0c1xuICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBwcm9wZXJ0eUNoYW5nZU1hcCkge1xuICAgICAgICByZXN1bHRNYXAuc2V0KGtleSwgdmFsdWUuc3RhdGUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0TWFwO1xufVxuZXhwb3J0cy5vYmplY3RTaGFsbG93RGlmZiA9IG9iamVjdFNoYWxsb3dEaWZmO1xuLy8gY29uc29sZS5sb2coXG4vLyAgICAgXCJAQEAgU0hBTExPVyBESUZGIFRFU1Q6OjpcIixcbi8vICAgICBvYmplY3RTaGFsbG93RGlmZihcbi8vICAgICAgICAgeyBhOiBcInJlbW92ZWRcIiwgYjogXCJjaGFuZ2VkXCIsIGM6IFwidW5jaGFuZ2VkXCIgfSxcbi8vICAgICAgICAgeyBiOiBcImNoYW5nZWQtXCIsIGM6IFwidW5jaGFuZ2VkXCIsIGQ6IFwiYWRkZWRkXCIgfSxcbi8vICAgICApLFxuLy8gKTtcbiIsIlwiZG1mIHByZWZpeCAkXCI7XG5cbmltcG9ydCB7IFJlYWN0LCBMaXN0UmVuZGVyLCAkLCAkYmluZCwgTGlzdCwgbW91bnQgfSBmcm9tIFwiZG1mXCI7XG5cbiQ7XG5SZWFjdDtcblxuLy8gLS0tXG5cbnR5cGUgUmVzb3VyY2VzU3BlYyA9IExpc3Q8eyByZXNvdXJjZTogc3RyaW5nOyBjb3N0OiBzdHJpbmcgfT47XG5cbnR5cGUgQ2xpY2tlclNwZWNJdGVtID1cbiAgICB8IHsgdHlwZTogXCJub25lXCIgfVxuICAgIHwgeyB0eXBlOiBcInNwYWNlclwiIH1cbiAgICB8IHsgdHlwZTogXCJzZXBhcmF0b3JcIiB9XG4gICAgfCB7IHR5cGU6IFwiY291bnRlclwiOyBuYW1lOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmcgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCI7XG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICAgIHByaWNlPzogUmVzb3VyY2VzU3BlYztcbiAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzPzogUmVzb3VyY2VzU3BlYztcbiAgICAgICAgICAgICAgZWZmZWN0cz86IFJlc291cmNlc1NwZWM7XG4gICAgICAgICAgfTtcbiAgICAgIH07XG5cbmZ1bmN0aW9uIFNlbGVjdExpc3Q8VD4oY2hvaWNlczogW3N0cmluZywgVF1bXSwgJHZhbHVlOiBUKSB7XG4gICAgY29uc3QgY2hvaWNlRGF0YU1hcCA9IG5ldyBNYXA8c3RyaW5nLCBUPigpO1xuICAgIGxldCBjdXJyZW50Q2hvaWNlID0gY2hvaWNlc1swXVswXTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgIHtjaG9pY2VzLm1hcCgoW2EsIGJdKSA9PiAoXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaG9pY2VEYXRhTWFwLnNldChjdXJyZW50Q2hvaWNlLCAkdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENob2ljZSA9IGE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hvaWNlRGF0YU1hcC5oYXMoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdmFsdWUgPSBjaG9pY2VEYXRhTWFwLmdldChhKSE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR2YWx1ZSA9IGI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7YX1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICA8L3NwYW4+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gUmVzb3VyY2VFZGl0b3IoJGl0ZW06IFJlc291cmNlc1NwZWMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgIHtMaXN0UmVuZGVyKCRpdGVtLCAoJHJlc291cmNlLCBzeW1ib2wpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17JHJlc291cmNlLnJlc291cmNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXQ9e2UgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRyZXNvdXJjZS5yZXNvdXJjZSA9IGUuY3VycmVudFRhcmdldC52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPntcIiBcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHtcIj49XCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9eyRyZXNvdXJjZS5jb3N0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXQ9e2UgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRyZXNvdXJjZS5jb3N0ID0gZS5jdXJyZW50VGFyZ2V0LnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+ICRpdGVtLnJlbW92ZShzeW1ib2wpfT4tPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+ICRpdGVtLnB1c2goeyByZXNvdXJjZTogXCJcIiwgY29zdDogXCIwLjAwXCIgfSl9PlxuICAgICAgICAgICAgICAgICtcbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L3NwYW4+XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gSXRlbUVkaXRvcigkaXRlbTogQ2xpY2tlclNwZWNJdGVtLCByZW1vdmVTZWxmOiAoKSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAge1NlbGVjdExpc3Q8Q2xpY2tlclNwZWNJdGVtPihcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgW1wibm9uZVwiLCB7IHR5cGU6IFwibm9uZVwiIH1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgW1wic3BhY2VyXCIsIHsgdHlwZTogXCJzcGFjZXJcIiB9XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcInNlcGFyYXRvclwiLCB7IHR5cGU6IFwic2VwYXJhdG9yXCIgfV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjb3VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiBcImNvdW50ZXJcIiwgbmFtZTogXCJcIiwgZGVzY3JpcHRpb246IFwiXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbXCJidXR0b25cIiwgeyB0eXBlOiBcImJ1dHRvblwiLCBkYXRhOiB7IG5hbWU6IFwiXCIgfSB9XSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgJGl0ZW0gfHwgJGJpbmQsXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHJlbW92ZVNlbGYoKX0+LTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8aDE+eyRpdGVtLnR5cGV9PC9oMT5cbiAgICAgICAgICAgIHskaXRlbS50eXBlID09PSBcIm5vbmVcIiA/IChcbiAgICAgICAgICAgICAgICA8ZGl2Pk5vIG9wdGlvbnMgdG8gY29uZmlndXJlPC9kaXY+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgIHskaXRlbS50eXBlID09PSBcInNwYWNlclwiID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5ObyBvcHRpb25zIHRvIGNvbmZpZ3VyZSBmb3Igc3BhY2VyPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICkgOiAkaXRlbS50eXBlID09PSBcInNlcGFyYXRvclwiID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5ObyBvcHRpb25zIHRvIGNvbmZpZ3VyZSBmb3Igc2VwYXJhdG9yPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICkgOiAkaXRlbS50eXBlID09PSBcImNvdW50ZXJcIiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlJlc291cmNlOjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXskaXRlbS5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25JbnB1dD17ZSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgkaXRlbS5uYW1lID0gZS5jdXJyZW50VGFyZ2V0LnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PkRlc2NyaXB0aW9uOjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXskaXRlbS5kZXNjcmlwdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXQ9e2UgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJGl0ZW0uZGVzY3JpcHRpb24gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApIDogJGl0ZW0udHlwZSA9PT0gXCJidXR0b25cIiA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PkJ1dHRvbiBMYWJlbDo8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdmFsdWU9eyRpdGVtLmRhdGEubmFtZX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlcXVpcmVzOntcIiBcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyRpdGVtLmRhdGEucmVxdWlyZW1lbnRzID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7UmVzb3VyY2VFZGl0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpdGVtLmRhdGEucmVxdWlyZW1lbnRzIHx8ICRiaW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRpdGVtLmRhdGEucmVxdWlyZW1lbnRzID0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJGl0ZW0uZGF0YS5yZXF1aXJlbWVudHMgPSAkLmxpc3QoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJpY2U6e1wiIFwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7JGl0ZW0uZGF0YS5wcmljZSA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1Jlc291cmNlRWRpdG9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaXRlbS5kYXRhLnByaWNlIHx8ICRiaW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRpdGVtLmRhdGEucHJpY2UgPSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgkaXRlbS5kYXRhLnByaWNlID0gJC5saXN0KFtdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWZmZWN0czp7XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHskaXRlbS5kYXRhLmVmZmVjdHMgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtSZXNvdXJjZUVkaXRvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGl0ZW0uZGF0YS5lZmZlY3RzIHx8ICRiaW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRpdGVtLmRhdGEuZWZmZWN0cyA9IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRpdGVtLmRhdGEuZWZmZWN0cyA9ICQubGlzdChbXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICkgOiB0cnVlID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5Vbmtub3duIGl0ZW0gdHlwZTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApIDogbnVsbH1cbiAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICl9XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENsaWNrZXJFZGl0b3IoKSB7XG4gICAgY29uc3QgJGl0ZW1zID0gJC5saXN0PENsaWNrZXJTcGVjSXRlbT4oW1xuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImNvdW50ZXJcIixcbiAgICAgICAgICAgIG5hbWU6IFwiYWNoaXZlbWVudFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwibnVtYmVyIG9mIGFjaGl2ZW1lbnRzIHlvdSBoYXZlIHJlY2lldmVkXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJjb2xsZWN0IDEwMCBnb2xkXCIsXG4gICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwiZ29sZFwiLCBjb3N0OiBcIjEwMFwiIH1dKSxcbiAgICAgICAgICAgICAgICBwcmljZTogJC5saXN0KFt7IHJlc291cmNlOiBcIl9hY2gxXCIsIGNvc3Q6IFwiMVwiIH1dKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwiYWNoaXZlbWVudFwiLCBjb3N0OiBcIjFcIiB9XSksXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiZWF0IGFwcGxlXCIsXG4gICAgICAgICAgICAgICAgcHJpY2U6ICQubGlzdChbXG4gICAgICAgICAgICAgICAgICAgIHsgcmVzb3VyY2U6IFwiYXBwbGVcIiwgY29zdDogXCIxXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyByZXNvdXJjZTogXCJfYWNoMlwiLCBjb3N0OiBcIjFcIiB9LFxuICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICAgIGVmZmVjdHM6ICQubGlzdChbeyByZXNvdXJjZTogXCJhY2hpdmVtZW50XCIsIGNvc3Q6IFwiMVwiIH1dKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgdHlwZTogXCJzZXBhcmF0b3JcIiB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImNvdW50ZXJcIixcbiAgICAgICAgICAgIG5hbWU6IFwic3RhbWluYVwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwic3RhbWluYSBpbmNyZWFzZXMgMC4wMSBwZXIgdGljaywgbWF4IDFcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJjb3VudGVyXCIsXG4gICAgICAgICAgICBuYW1lOiBcImdvbGRcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImdvbGQgbGV0cyB5b3UgcHVyY2hhc2UgdGhpbmdzXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJmaXNoIGdvbGQgZnJvbSB3aXNoaW5nIHdlbGxcIixcbiAgICAgICAgICAgICAgICBwcmljZTogJC5saXN0KFt7IHJlc291cmNlOiBcInN0YW1pbmFcIiwgY29zdDogXCIwLjFcIiB9XSksXG4gICAgICAgICAgICAgICAgZWZmZWN0czogJC5saXN0KFt7IHJlc291cmNlOiBcImdvbGRcIiwgY29zdDogXCIxXCIgfV0pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJjb3VudGVyXCIsXG4gICAgICAgICAgICBuYW1lOiBcIm1hcmtldFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwibWFya2V0cyBhcXVpcmUgMC4wMSBnb2xkIHBlciB0aWNrXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJwdXJjaGFzZSBtYXJrZXRcIixcbiAgICAgICAgICAgICAgICBwcmljZTogJC5saXN0KFt7IHJlc291cmNlOiBcImdvbGRcIiwgY29zdDogXCIyNVwiIH1dKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwibWFya2V0XCIsIGNvc3Q6IFwiMVwiIH1dKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgdHlwZTogXCJzcGFjZXJcIiB9LFxuICAgICAgICB7IHR5cGU6IFwiY291bnRlclwiLCBuYW1lOiBcImFwcGxlXCIsIGRlc2NyaXB0aW9uOiBcImFuIGFwcGxlXCIgfSxcbiAgICAgICAgeyB0eXBlOiBcImNvdW50ZXJcIiwgbmFtZTogXCJ3YXRlclwiLCBkZXNjcmlwdGlvbjogXCJ3YXRlciBncm93cyB0cmVlc1wiIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiY291bnRlclwiLFxuICAgICAgICAgICAgbmFtZTogXCJ0cmVlXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgICBcImVhY2ggZnVsbCB0cmVlIHJlcXVpcmVzIDIgd2F0ZXIgZWFjaCB0aWNrIHRvIGxpdmUgYW5kIGRyb3BzIDEgYXBwbGUgcGVyIDEwIHRpY2tzLlwiLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImNvdW50ZXJcIixcbiAgICAgICAgICAgIG5hbWU6IFwic2VlZFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiYW4gYXBwbGUgc2VlZC4gdXNlcyAxIHdhdGVyIGVhY2ggdGljayB0byBncm93XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJwdXJjaGFzZSBzZWVkIGZyb20gbWFya2V0XCIsXG4gICAgICAgICAgICAgICAgcHJpY2U6ICQubGlzdChbeyByZXNvdXJjZTogXCJnb2xkXCIsIGNvc3Q6IFwiNTBcIiB9XSksXG4gICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwibWFya2V0XCIsIGNvc3Q6IFwiNVwiIH1dKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwic2VlZFwiLCBjb3N0OiBcIjFcIiB9XSksXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwidGFrZSB3YXRlciBmcm9tIHdpc2hpbmcgd2VsbFwiLFxuICAgICAgICAgICAgICAgIHByaWNlOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwic3RhbWluYVwiLCBjb3N0OiBcIjFcIiB9XSksXG4gICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwibWFya2V0XCIsIGNvc3Q6IFwiNVwiIH1dKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwid2F0ZXJcIiwgY29zdDogXCIxMDBcIiB9XSksXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHR5cGU6IFwiY291bnRlclwiLCBuYW1lOiBcImJ1Y2tldFwiLCBkZXNjcmlwdGlvbjogXCJhIGJ1Y2tldFwiIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJtYWtlIGJ1Y2tldFwiLFxuICAgICAgICAgICAgICAgIHByaWNlOiAkLmxpc3QoW1xuICAgICAgICAgICAgICAgICAgICB7IHJlc291cmNlOiBcInRyZWVcIiwgY29zdDogXCIxXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyByZXNvdXJjZTogXCJnb2xkXCIsIGNvc3Q6IFwiMTAwXCIgfSxcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW3sgcmVzb3VyY2U6IFwiYnVja2V0XCIsIGNvc3Q6IFwiMVwiIH1dKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJ1c2UgYnVja2V0IG9uIHdpc2hpbmcgd2VsbFwiLFxuICAgICAgICAgICAgICAgIHByaWNlOiAkLmxpc3QoW1xuICAgICAgICAgICAgICAgICAgICB7IHJlc291cmNlOiBcImJ1Y2tldFwiLCBjb3N0OiBcIjFcIiB9LFxuICAgICAgICAgICAgICAgICAgICB7IHJlc291cmNlOiBcInN0YW1pbmFcIiwgY29zdDogXCIxXCIgfSxcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgICBlZmZlY3RzOiAkLmxpc3QoW1xuICAgICAgICAgICAgICAgICAgICB7IHJlc291cmNlOiBcIndhdGVyXCIsIGNvc3Q6IFwiMTAwMFwiIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgcmVzb3VyY2U6IFwiZ29sZFwiLCBjb3N0OiBcIjEwXCIgfSxcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgXSk7XG4gICAgbGV0ICR1cGRhdGUgPSAwOyAvLyBvbmNlIGRlZXAgZXZlbnRzIGFyZSB1c2VkLCB0aGlzIHdvbid0IGJlIG5lZWRlZFxuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICB2YWx1ZT17XG4gICAgICAgICAgICAgICAgICAgIFwiXCIgKyAkdXBkYXRlICYmXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSgkaXRlbXMpKS5tYXAoKHY6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LnR5cGUgPT09IFwiY291bnRlclwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3YudHlwZSwgdi5uYW1lLCB2LmRlc2NyaXB0aW9uXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodi50eXBlID09PSBcImJ1dHRvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpeCA9IChuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LmRhdGFbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtrZXk6IHN0cmluZ106IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBkZXQgb2Ygdi5kYXRhW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb1tkZXQucmVzb3VyY2VdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb1tkZXQucmVzb3VyY2VdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb1tkZXQucmVzb3VyY2VdICs9ICtkZXQuY29zdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5kYXRhW25hbWVdID0gcmVzbztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZml4KFwicmVxdWlyZW1lbnRzXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXgoXCJlZmZlY3RzXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXgoXCJwcmljZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt2LnR5cGUsIHYuZGF0YV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdi50eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiAkdXBkYXRlKyt9PnVwZGF0ZTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpdGVtcy5pbnNlcnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYWZ0ZXI6IHVuZGVmaW5lZCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6IFwibm9uZVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICArXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAge0xpc3RSZW5kZXIoJGl0ZW1zLCAoJGl0ZW0sIHN5bWJvbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiIyNSZW5kZXJpbmcgaXRlbSBlZGl0b3JcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICRpdGVtIHx8ICRiaW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtJdGVtRWRpdG9yKCRpdGVtIHx8ICRiaW5kLCAoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGl0ZW1zLnJlbW92ZShzeW1ib2wpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRpdGVtcy5pbnNlcnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgYWZ0ZXI6IHN5bWJvbCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6IFwibm9uZVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG4iLCJcImRtZiBwcmVmaXggJFwiO1xuXG5pbXBvcnQgeyBSZWFjdCwgTGlzdFJlbmRlciwgJCwgJGJpbmQsIExpc3QsIG1vdW50IH0gZnJvbSBcImRtZlwiO1xuaW1wb3J0IFwiLi9kcmF3Qm94QXJvdW5kRWxlbWVudFwiO1xuaW1wb3J0IHsgTm9kZUF0dHJpYnV0ZXMgfSBmcm9tIFwiZG1mL2Rpc3QvZG9tXCI7XG5cbiQ7XG5SZWFjdDtcblxudHlwZSBUb2RvSXRlbSA9IHsgY2hlY2tlZDogYm9vbGVhbjsgY29udGVudHM6IHN0cmluZyB9O1xuXG5mdW5jdGlvbiBNYW5hZ2VkVGV4dElucHV0KFxuICAgICR0ZXh0OiBzdHJpbmcsXG4gICAgcHJvcHM6IFBhcnRpYWw8Tm9kZUF0dHJpYnV0ZXM8XCJpbnB1dFwiPj4sXG4pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIHZhbHVlPXskdGV4dH1cbiAgICAgICAgICAgIG9uSW5wdXQ9e2UgPT4gKCR0ZXh0ID0gZS5jdXJyZW50VGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIHsuLi5wcm9wc31cbiAgICAgICAgLz5cbiAgICApO1xufVxuXG5mdW5jdGlvbiBUb2RvTGlzdCgkbGlzdDogTGlzdDxUb2RvSXRlbT4pIHtcbiAgICBsZXQgJHdpcEl0ZW0gPSBcIlwiO1xuICAgIGNvbnN0ICRmaWx0ZXIgPSBcIlwiO1xuICAgIGxldCB0aGlzU2hvdWxkRm9jdXMgPSBmYWxzZTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgICAgPGgxPlRvZG8gTGlzdDwvaDE+XG4gICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICB7TWFuYWdlZFRleHRJbnB1dCgkd2lwSXRlbSB8fCAkYmluZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogXCJXaGF0IHRvIGRvLi4uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbktleVByZXNzOiBlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5jb2RlID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxpc3QudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRzOiAkd2lwSXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR3aXBJdGVtID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAge01hbmFnZWRUZXh0SW5wdXQoJGZpbHRlciB8fCAkYmluZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogXCJGaWx0ZXIuLi5cIixcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICB7TGlzdFJlbmRlcigkbGlzdCwgKCRpdGVtLCBzeW1ib2wpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZW5kZXJpbmdcIiwgJGl0ZW0sIFwiZm9yIGxpc3RyZW5kZXJcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCAkc2hvd1JlbW92ZUNvbmZpcm0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyRpdGVtLmNvbnRlbnRzLmluY2x1ZGVzKCRmaWx0ZXIpID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9eyRpdGVtLmNoZWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25JbnB1dD17ZSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJGl0ZW0uY2hlY2tlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmN1cnJlbnRUYXJnZXQuY2hlY2tlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPntcIiBcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17JGl0ZW0uY29udGVudHN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG1mT25Nb3VudD17bm9kZSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzU2hvdWxkRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAobm9kZS5mb2N1cygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzU2hvdWxkRm9jdXMgPSBmYWxzZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25JbnB1dD17ZSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJGl0ZW0uY29udGVudHMgPSAoZS5jdXJyZW50VGFyZ2V0IGFzIGFueSkudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5UHJlc3M9e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5jb2RlID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNTaG91bGRGb2N1cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbGlzdC5pbnNlcnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBhZnRlcjogc3ltYm9sIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudHM6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHskc2hvd1JlbW92ZUNvbmZpcm0gPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQXJlIHlvdSBzdXJlP3tcIiBcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbGlzdC5yZW1vdmUoc3ltYm9sKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW1vdmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRzaG93UmVtb3ZlQ29uZmlybSA9IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDYW5jZWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgkc2hvd1JlbW92ZUNvbmZpcm0gPSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5kb2VzIG5vdCBtYXRjaCBmaWx0ZXI8L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvPlxuICAgICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUb2RvTGlzdEFwcCgpIHtcbiAgICBjb25zdCAkbGlzdDogTGlzdDxUb2RvSXRlbT4gPSAkLmxpc3QoW10pO1xuICAgIGNvbnN0ICRsaXN0T2ZUb2RvTGlzdHM6IExpc3Q8MD4gPSAkLmxpc3QoWzBdKTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgICAge0xpc3RSZW5kZXIoJGxpc3RPZlRvZG9MaXN0cywgKCRpdGVtLCBzeW1ib2wpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgJGNvbmZpcm1WaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtUb2RvTGlzdCgkbGlzdCB8fCAkYmluZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHskY29uZmlybVZpc2libGUgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcmUgeW91IHN1cmU/e1wiIFwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsaXN0T2ZUb2RvTGlzdHMucmVtb3ZlKHN5bWJvbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVtb3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJGNvbmZpcm1WaXNpYmxlID0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENhbmNlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+ICgkY29uZmlybVZpc2libGUgPSB0cnVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gJGxpc3RPZlRvZG9MaXN0cy5wdXNoKDApfT4rPC9idXR0b24+XG4gICAgICAgIDwvPlxuICAgICk7XG59XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3RcblxuY29uc3Qgbm9kZVRvRGF0YSA9IG5ldyBNYXAoKTsgLy8gSG93IGxvbmcgdGhlIHJlY3Qgc2hvdWxkIGJlIHNob3duIGZvcj9cblxuY29uc3QgRElTUExBWV9EVVJBVElPTiA9IDI1MDsgLy8gV2hhdCdzIHRoZSBsb25nZXN0IHdlIGFyZSB3aWxsaW5nIHRvIHNob3cgdGhlIG92ZXJsYXkgZm9yP1xuLy8gVGhpcyBjYW4gYmUgaW1wb3J0YW50IGlmIHdlJ3JlIGdldHRpbmcgYSBmbHVycnkgb2YgZXZlbnRzIChlLmcuIHNjcm9sbCB1cGRhdGUpLlxuXG5jb25zdCBNQVhfRElTUExBWV9EVVJBVElPTiA9IDMwMDA7IC8vIEhvdyBsb25nIHNob3VsZCBhIHJlY3QgYmUgY29uc2lkZXJlZCB2YWxpZCBmb3I/XG5cbmNvbnN0IFJFTUVBU1VSRU1FTlRfQUZURVJfRFVSQVRJT04gPSAyNTA7IC8vIFNvbWUgZW52aXJvbm1lbnRzIChlLmcuIFJlYWN0IE5hdGl2ZSAvIEhlcm1lcykgZG9uJ3Qgc3VwcG9ydCB0aGUgcGVyZm9ybWFjZSBBUEkgeWV0LlxuXG5jb25zdCBnZXRDdXJyZW50VGltZSA9XG4gICAgdHlwZW9mIHBlcmZvcm1hbmNlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/ICgpID0+IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICAgIDogKCkgPT4gRGF0ZS5ub3coKTtcbmxldCBhZ2VudCA9IG51bGw7XG5sZXQgZHJhd0FuaW1hdGlvbkZyYW1lSUQgPSBudWxsO1xubGV0IGlzRW5hYmxlZCA9IHRydWU7XG5sZXQgcmVkcmF3VGltZW91dElEID0gbnVsbDtcbmNvbnN0IE9VVExJTkVfQ09MT1IgPSBcIiNmMGYwZjBcIjsgLy8gTm90ZSB0aGVzZSBjb2xvcnMgYXJlIGluIHN5bmMgd2l0aCBEZXZUb29scyBQcm9maWxlciBjaGFydCBjb2xvcnMuXG5cbmNvbnN0IENPTE9SUyA9IFtcbiAgICBcIiMzN2FmYTlcIixcbiAgICBcIiM2M2IxOWVcIixcbiAgICBcIiM4MGIzOTNcIixcbiAgICBcIiM5N2I0ODhcIixcbiAgICBcIiNhYmI2N2RcIixcbiAgICBcIiNiZWI3NzFcIixcbiAgICBcIiNjZmI5NjVcIixcbiAgICBcIiNkZmJhNTdcIixcbiAgICBcIiNlZmJiNDlcIixcbiAgICBcIiNmZWJjMzhcIixcbl07XG5sZXQgY2FudmFzID0gbnVsbDtcblxuZnVuY3Rpb24gZHJhdyhub2RlVG9EYXRhKSB7XG4gICAgaWYgKGNhbnZhcyA9PT0gbnVsbCkge1xuICAgICAgICBpbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgY29uc3QgY2FudmFzRmxvdyA9IGNhbnZhcztcbiAgICBjYW52YXNGbG93LndpZHRoID0gd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoO1xuICAgIGNhbnZhc0Zsb3cuaGVpZ2h0ID0gd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodDtcbiAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzRmxvdy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzRmxvdy53aWR0aCwgY2FudmFzRmxvdy5oZWlnaHQpO1xuICAgIG5vZGVUb0RhdGEuZm9yRWFjaCgoeyBjb3VudCwgcmVjdCB9KSA9PiB7XG4gICAgICAgIGlmIChyZWN0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xvckluZGV4ID0gTWF0aC5taW4oQ09MT1JTLmxlbmd0aCAtIDEsIGNvdW50IC0gMSk7XG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IENPTE9SU1tjb2xvckluZGV4XTtcbiAgICAgICAgICAgIGRyYXdCb3JkZXIoY29udGV4dCwgcmVjdCwgY29sb3IpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRyYXdCb3JkZXIoY29udGV4dCwgcmVjdCwgY29sb3IpIHtcbiAgICBjb25zdCB7IGhlaWdodCwgbGVmdCwgdG9wLCB3aWR0aCB9ID0gcmVjdDsgLy8gb3V0bGluZVxuXG4gICAgY29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBPVVRMSU5FX0NPTE9SO1xuICAgIGNvbnRleHQuc3Ryb2tlUmVjdChsZWZ0IC0gMSwgdG9wIC0gMSwgd2lkdGggKyAyLCBoZWlnaHQgKyAyKTsgLy8gaW5zZXRcblxuICAgIGNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gT1VUTElORV9DT0xPUjtcbiAgICBjb250ZXh0LnN0cm9rZVJlY3QobGVmdCArIDEsIHRvcCArIDEsIHdpZHRoIC0gMSwgaGVpZ2h0IC0gMSk7XG4gICAgY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICAgIGNvbnRleHQuc2V0TGluZURhc2goWzBdKTsgLy8gYm9yZGVyXG5cbiAgICBjb250ZXh0LmxpbmVXaWR0aCA9IDE7XG4gICAgY29udGV4dC5zdHJva2VSZWN0KGxlZnQsIHRvcCwgd2lkdGggLSAxLCBoZWlnaHQgLSAxKTtcbiAgICBjb250ZXh0LnNldExpbmVEYXNoKFswXSk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgaWYgKGNhbnZhcyAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoY2FudmFzLnBhcmVudE5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2FudmFzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbnZhcyA9IG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xuICAgIGNhbnZhcyA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgIGNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxuICAgIHh4LWJhY2tncm91bmQtY29sb3I6IHJlZDtcbiAgICB4eC1vcGFjaXR5OiAwLjU7XG4gICAgYm90dG9tOiAwO1xuICAgIGxlZnQ6IDA7XG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gICAgcG9zaXRpb246IGZpeGVkO1xuICAgIHJpZ2h0OiAwO1xuICAgIHRvcDogMDtcbiAgICB6LWluZGV4OiAxMDAwMDAwMDAwO1xuICBgO1xuICAgIGNvbnN0IHJvb3QgPSB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIHJvb3QuaW5zZXJ0QmVmb3JlKGNhbnZhcywgcm9vdC5maXJzdENoaWxkKTtcbiAgICBjb25zb2xlLmxvZyhjYW52YXMpO1xufVxuXG5mdW5jdGlvbiBtZWFzdXJlTm9kZShub2RlKSB7XG4gICAgaWYgKCFub2RlIHx8IHR5cGVvZiBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBjdXJyZW50V2luZG93ID0gd2luZG93Ll9fUkVBQ1RfREVWVE9PTFNfVEFSR0VUX1dJTkRPV19fIHx8IHdpbmRvdztcbiAgICByZXR1cm4gZ2V0TmVzdGVkQm91bmRpbmdDbGllbnRSZWN0KG5vZGUsIGN1cnJlbnRXaW5kb3cpO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlVG9EcmF3KCkge1xuICAgIGRyYXdBbmltYXRpb25GcmFtZUlEID0gbnVsbDtcbiAgICByZWRyYXdUaW1lb3V0SUQgPSBudWxsO1xuICAgIGNvbnN0IG5vdyA9IGdldEN1cnJlbnRUaW1lKCk7XG4gICAgbGV0IGVhcmxpZXN0RXhwaXJhdGlvbiA9IE51bWJlci5NQVhfVkFMVUU7IC8vIFJlbW92ZSBhbnkgaXRlbXMgdGhhdCBoYXZlIGFscmVhZHkgZXhwaXJlZC5cblxuICAgIG5vZGVUb0RhdGEuZm9yRWFjaCgoZGF0YSwgbm9kZSkgPT4ge1xuICAgICAgICBpZiAoZGF0YS5leHBpcmF0aW9uVGltZSA8IG5vdykge1xuICAgICAgICAgICAgbm9kZVRvRGF0YS5kZWxldGUobm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlYXJsaWVzdEV4cGlyYXRpb24gPSBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICBlYXJsaWVzdEV4cGlyYXRpb24sXG4gICAgICAgICAgICAgICAgZGF0YS5leHBpcmF0aW9uVGltZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBkcmF3KG5vZGVUb0RhdGEpO1xuICAgIHJlZHJhd1RpbWVvdXRJRCA9IHNldFRpbWVvdXQocHJlcGFyZVRvRHJhdywgZWFybGllc3RFeHBpcmF0aW9uIC0gbm93KTtcbn1cblxuZnVuY3Rpb24gdHJhY2VVcGRhdGVzKG5vZGVzKSB7XG4gICAgaWYgKCFpc0VuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBub2RlVG9EYXRhLmdldChub2RlKTtcbiAgICAgICAgY29uc3Qgbm93ID0gZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgbGV0IGxhc3RNZWFzdXJlZEF0ID0gZGF0YSAhPSBudWxsID8gZGF0YS5sYXN0TWVhc3VyZWRBdCA6IDA7XG4gICAgICAgIGxldCByZWN0ID0gZGF0YSAhPSBudWxsID8gZGF0YS5yZWN0IDogbnVsbDtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICByZWN0ID09PSBudWxsIHx8XG4gICAgICAgICAgICBsYXN0TWVhc3VyZWRBdCArIFJFTUVBU1VSRU1FTlRfQUZURVJfRFVSQVRJT04gPCBub3dcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBsYXN0TWVhc3VyZWRBdCA9IG5vdztcbiAgICAgICAgICAgIHJlY3QgPSBtZWFzdXJlTm9kZShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGVUb0RhdGEuc2V0KG5vZGUsIHtcbiAgICAgICAgICAgIGNvdW50OiBkYXRhICE9IG51bGwgPyBkYXRhLmNvdW50ICsgMSA6IDEsXG4gICAgICAgICAgICBleHBpcmF0aW9uVGltZTpcbiAgICAgICAgICAgICAgICBkYXRhICE9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgPyBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbm93ICsgTUFYX0RJU1BMQVlfRFVSQVRJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuZXhwaXJhdGlvblRpbWUgKyBESVNQTEFZX0RVUkFUSU9OLFxuICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgOiBub3cgKyBESVNQTEFZX0RVUkFUSU9OLFxuICAgICAgICAgICAgbGFzdE1lYXN1cmVkQXQsXG4gICAgICAgICAgICByZWN0LFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmIChyZWRyYXdUaW1lb3V0SUQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlZHJhd1RpbWVvdXRJRCk7XG4gICAgICAgIHJlZHJhd1RpbWVvdXRJRCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGRyYXdBbmltYXRpb25GcmFtZUlEID09PSBudWxsKSB7XG4gICAgICAgIGRyYXdBbmltYXRpb25GcmFtZUlEID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHByZXBhcmVUb0RyYXcpO1xuICAgIH1cbn0gLy8gR2V0IHRoZSB3aW5kb3cgb2JqZWN0IGZvciB0aGUgZG9jdW1lbnQgdGhhdCBhIG5vZGUgYmVsb25ncyB0byxcbi8vIG9yIHJldHVybiBudWxsIGlmIGl0IGNhbm5vdCBiZSBmb3VuZCAobm9kZSBub3QgYXR0YWNoZWQgdG8gRE9NLFxuLy8gZXRjKS5cblxuZnVuY3Rpb24gZ2V0T3duZXJXaW5kb3cobm9kZSkge1xuICAgIGlmICghbm9kZS5vd25lckRvY3VtZW50KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XG59IC8vIEdldCB0aGUgaWZyYW1lIGNvbnRhaW5pbmcgYSBub2RlLCBvciByZXR1cm4gbnVsbCBpZiBpdCBjYW5ub3Rcbi8vIGJlIGZvdW5kIChub2RlIG5vdCB3aXRoaW4gaWZyYW1lLCBldGMpLlxuXG5mdW5jdGlvbiBnZXRPd25lcklmcmFtZShub2RlKSB7XG4gICAgY29uc3Qgbm9kZVdpbmRvdyA9IGdldE93bmVyV2luZG93KG5vZGUpO1xuXG4gICAgaWYgKG5vZGVXaW5kb3cpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVXaW5kb3cuZnJhbWVFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufSAvLyBHZXQgYSBib3VuZGluZyBjbGllbnQgcmVjdCBmb3IgYSBub2RlLCB3aXRoIGFuXG4vLyBvZmZzZXQgYWRkZWQgdG8gY29tcGVuc2F0ZSBmb3IgaXRzIGJvcmRlci5cblxuZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0V2l0aEJvcmRlck9mZnNldChub2RlKSB7XG4gICAgY29uc3QgZGltZW5zaW9ucyA9IGdldEVsZW1lbnREaW1lbnNpb25zKG5vZGUpO1xuICAgIHJldHVybiBtZXJnZVJlY3RPZmZzZXRzKFtcbiAgICAgICAgbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAge1xuICAgICAgICAgICAgdG9wOiBkaW1lbnNpb25zLmJvcmRlclRvcCxcbiAgICAgICAgICAgIGxlZnQ6IGRpbWVuc2lvbnMuYm9yZGVyTGVmdCxcbiAgICAgICAgICAgIGJvdHRvbTogZGltZW5zaW9ucy5ib3JkZXJCb3R0b20sXG4gICAgICAgICAgICByaWdodDogZGltZW5zaW9ucy5ib3JkZXJSaWdodCxcbiAgICAgICAgICAgIC8vIFRoaXMgd2lkdGggYW5kIGhlaWdodCB3b24ndCBnZXQgdXNlZCBieSBtZXJnZVJlY3RPZmZzZXRzIChzaW5jZSB0aGlzXG4gICAgICAgICAgICAvLyBpcyBub3QgdGhlIGZpcnN0IHJlY3QgaW4gdGhlIGFycmF5KSwgYnV0IHdlIHNldCB0aGVtIHNvIHRoYXQgdGhpc1xuICAgICAgICAgICAgLy8gb2JqZWN0IHR5cGVjaGVja3MgYXMgYSBDbGllbnRSZWN0LlxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgIH0sXG4gICAgXSk7XG59IC8vIEFkZCB0b2dldGhlciB0aGUgdG9wLCBsZWZ0LCBib3R0b20sIGFuZCByaWdodCBwcm9wZXJ0aWVzIG9mXG4vLyBlYWNoIENsaWVudFJlY3QsIGJ1dCBrZWVwIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSBmaXJzdCBvbmUuXG5cbmZ1bmN0aW9uIG1lcmdlUmVjdE9mZnNldHMocmVjdHMpIHtcbiAgICByZXR1cm4gcmVjdHMucmVkdWNlKChwcmV2aW91c1JlY3QsIHJlY3QpID0+IHtcbiAgICAgICAgaWYgKHByZXZpb3VzUmVjdCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IHByZXZpb3VzUmVjdC50b3AgKyByZWN0LnRvcCxcbiAgICAgICAgICAgIGxlZnQ6IHByZXZpb3VzUmVjdC5sZWZ0ICsgcmVjdC5sZWZ0LFxuICAgICAgICAgICAgd2lkdGg6IHByZXZpb3VzUmVjdC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogcHJldmlvdXNSZWN0LmhlaWdodCxcbiAgICAgICAgICAgIGJvdHRvbTogcHJldmlvdXNSZWN0LmJvdHRvbSArIHJlY3QuYm90dG9tLFxuICAgICAgICAgICAgcmlnaHQ6IHByZXZpb3VzUmVjdC5yaWdodCArIHJlY3QucmlnaHQsXG4gICAgICAgIH07XG4gICAgfSk7XG59IC8vIENhbGN1bGF0ZSBhIGJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgYSBub2RlIHJlbGF0aXZlIHRvIGJvdW5kYXJ5V2luZG93LFxuLy8gdGFraW5nIGludG8gYWNjb3VudCBhbnkgb2Zmc2V0cyBjYXVzZWQgYnkgaW50ZXJtZWRpYXRlIGlmcmFtZXMuXG5cbmZ1bmN0aW9uIGdldE5lc3RlZEJvdW5kaW5nQ2xpZW50UmVjdChub2RlLCBib3VuZGFyeVdpbmRvdykge1xuICAgIGNvbnN0IG93bmVySWZyYW1lID0gZ2V0T3duZXJJZnJhbWUobm9kZSk7XG5cbiAgICBpZiAob3duZXJJZnJhbWUgJiYgb3duZXJJZnJhbWUgIT09IGJvdW5kYXJ5V2luZG93KSB7XG4gICAgICAgIGNvbnN0IHJlY3RzID0gW25vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCldO1xuICAgICAgICBsZXQgY3VycmVudElmcmFtZSA9IG93bmVySWZyYW1lO1xuICAgICAgICBsZXQgb25seU9uZU1vcmUgPSBmYWxzZTtcblxuICAgICAgICB3aGlsZSAoY3VycmVudElmcmFtZSkge1xuICAgICAgICAgICAgY29uc3QgcmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdFdpdGhCb3JkZXJPZmZzZXQoY3VycmVudElmcmFtZSk7XG4gICAgICAgICAgICByZWN0cy5wdXNoKHJlY3QpO1xuICAgICAgICAgICAgY3VycmVudElmcmFtZSA9IGdldE93bmVySWZyYW1lKGN1cnJlbnRJZnJhbWUpO1xuXG4gICAgICAgICAgICBpZiAob25seU9uZU1vcmUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gLy8gV2UgZG9uJ3Qgd2FudCB0byBjYWxjdWxhdGUgaWZyYW1lIG9mZnNldHMgdXB3YXJkcyBiZXlvbmRcbiAgICAgICAgICAgIC8vIHRoZSBpZnJhbWUgY29udGFpbmluZyB0aGUgYm91bmRhcnlXaW5kb3csIGJ1dCB3ZVxuICAgICAgICAgICAgLy8gbmVlZCB0byBjYWxjdWxhdGUgdGhlIG9mZnNldCByZWxhdGl2ZSB0byB0aGUgYm91bmRhcnlXaW5kb3cuXG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBjdXJyZW50SWZyYW1lICYmXG4gICAgICAgICAgICAgICAgZ2V0T3duZXJXaW5kb3coY3VycmVudElmcmFtZSkgPT09IGJvdW5kYXJ5V2luZG93XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBvbmx5T25lTW9yZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWVyZ2VSZWN0T2Zmc2V0cyhyZWN0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRFbGVtZW50RGltZW5zaW9ucyhkb21FbGVtZW50KSB7XG4gICAgY29uc3QgY2FsY3VsYXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9tRWxlbWVudCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYm9yZGVyTGVmdDogcGFyc2VJbnQoY2FsY3VsYXRlZFN0eWxlLmJvcmRlckxlZnRXaWR0aCwgMTApLFxuICAgICAgICBib3JkZXJSaWdodDogcGFyc2VJbnQoY2FsY3VsYXRlZFN0eWxlLmJvcmRlclJpZ2h0V2lkdGgsIDEwKSxcbiAgICAgICAgYm9yZGVyVG9wOiBwYXJzZUludChjYWxjdWxhdGVkU3R5bGUuYm9yZGVyVG9wV2lkdGgsIDEwKSxcbiAgICAgICAgYm9yZGVyQm90dG9tOiBwYXJzZUludChjYWxjdWxhdGVkU3R5bGUuYm9yZGVyQm90dG9tV2lkdGgsIDEwKSxcbiAgICAgICAgbWFyZ2luTGVmdDogcGFyc2VJbnQoY2FsY3VsYXRlZFN0eWxlLm1hcmdpbkxlZnQsIDEwKSxcbiAgICAgICAgbWFyZ2luUmlnaHQ6IHBhcnNlSW50KGNhbGN1bGF0ZWRTdHlsZS5tYXJnaW5SaWdodCwgMTApLFxuICAgICAgICBtYXJnaW5Ub3A6IHBhcnNlSW50KGNhbGN1bGF0ZWRTdHlsZS5tYXJnaW5Ub3AsIDEwKSxcbiAgICAgICAgbWFyZ2luQm90dG9tOiBwYXJzZUludChjYWxjdWxhdGVkU3R5bGUubWFyZ2luQm90dG9tLCAxMCksXG4gICAgICAgIHBhZGRpbmdMZWZ0OiBwYXJzZUludChjYWxjdWxhdGVkU3R5bGUucGFkZGluZ0xlZnQsIDEwKSxcbiAgICAgICAgcGFkZGluZ1JpZ2h0OiBwYXJzZUludChjYWxjdWxhdGVkU3R5bGUucGFkZGluZ1JpZ2h0LCAxMCksXG4gICAgICAgIHBhZGRpbmdUb3A6IHBhcnNlSW50KGNhbGN1bGF0ZWRTdHlsZS5wYWRkaW5nVG9wLCAxMCksXG4gICAgICAgIHBhZGRpbmdCb3R0b206IHBhcnNlSW50KGNhbGN1bGF0ZWRTdHlsZS5wYWRkaW5nQm90dG9tLCAxMCksXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZHJhd0JveEFyb3VuZEVsZW1lbnQoLi4uZWxlbWVudHMpIHtcbiAgICB0cmFjZVVwZGF0ZXMoZWxlbWVudHMpO1xufVxuXG53aW5kb3cuc3RhcnRIaWdobGlnaHRVcGRhdGVzID0gKCkgPT4ge1xuICAgIGluaXRpYWxpemUoKTtcblxuICAgIGxldCBub2Rlc1VwZGF0ZWRUaGlzVGljayA9IFtdO1xuICAgIGxldCBuZXh0VGlja1RpbWVvdXQ7XG4gICAgd2luZG93Lm9uTm9kZVVwZGF0ZSA9IG5vZGUgPT4ge1xuICAgICAgICBub2Rlc1VwZGF0ZWRUaGlzVGljay5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAobmV4dFRpY2tUaW1lb3V0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQobmV4dFRpY2tUaW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0VGlja1RpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGRyYXdCb3hBcm91bmRFbGVtZW50KFxuICAgICAgICAgICAgICAgIC4uLm5vZGVzVXBkYXRlZFRoaXNUaWNrLm1hcChub2RlID0+XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgaW5zdGFuY2VvZiBUZXh0ID8gbm9kZS5wYXJlbnRFbGVtZW50IDogbm9kZSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIG5vZGVzVXBkYXRlZFRoaXNUaWNrID0gW107XG4gICAgICAgIH0sIDApO1xuICAgIH07XG59O1xuIiwiXCJkbWYgcHJlZml4ICRcIjtcblxuaW1wb3J0IHsgUmVhY3QsIExpc3RSZW5kZXIsICQsICRiaW5kLCBMaXN0LCBtb3VudCwgUG9ydGFsIH0gZnJvbSBcImRtZlwiO1xuXG5pbXBvcnQgXCIuL2RyYXdCb3hBcm91bmRFbGVtZW50XCI7XG5pbXBvcnQgeyBUb2RvTGlzdEFwcCB9IGZyb20gXCIuL1RvZG9MaXN0XCI7XG5cbiQ7XG5SZWFjdDtcblxuaW1wb3J0IENsaWNrZXJFZGl0b3IgZnJvbSBcIi4vQ2xpY2tlckVkaXRvclwiO1xuXG5jb25zdCAkbnVtID0gNTtcbmxldCAkeCA9IDA7XG5sZXQgJHkgPSAwO1xuXG5tb3VudChDbGlja2VyRWRpdG9yKCksIGRvY3VtZW50LmJvZHkpO1xuXG5mdW5jdGlvbiBUb2dnbGVWaWV3KGNoaWxkcmVuOiAoKSA9PiBKU1guRWxlbWVudCkge1xuICAgIGxldCAkaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiAoJGlzVmlzaWJsZSA9ICEkaXNWaXNpYmxlKX0+XG4gICAgICAgICAgICAgICAgeyRpc1Zpc2libGUgPyBcIkhpZGVcIiA6IFwiU2hvd1wifVxuICAgICAgICAgICAgPC9idXR0b24+e1wiIFwifVxuICAgICAgICAgICAgeyRpc1Zpc2libGUgPyAoXG4gICAgICAgICAgICAgICAgPGRpdj57Y2hpbGRyZW4oKX08L2Rpdj5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgPGRpdj5Ob3RoaW5nIHRvIHNlZSBoZXJlLjwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuY29uc3QgcG9ydGFsUmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbmNvbnN0IHN0YXJ0UmVzdWx0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCItLS1zdGFydCBwb3J0YWwtLS1cIik7XG5jb25zdCBlbmRSZXN1bHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIi0tLWVuZCBwb3J0YWwtLS1cIik7XG5wb3J0YWxSZXN1bHQuYXBwZW5kQ2hpbGQoc3RhcnRSZXN1bHQpO1xucG9ydGFsUmVzdWx0LmFwcGVuZENoaWxkKGVuZFJlc3VsdCk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBvcnRhbFJlc3VsdCk7XG5cbm1vdW50KFxuICAgIDxkaXY+XG4gICAgICAgIHtUb2dnbGVWaWV3KCgpID0+XG4gICAgICAgICAgICBQb3J0YWwoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgaGkhIHRoaXMgbm9kZSB3YXMgbWFkZSBpbnNpZGUgYSBwb3J0YWwhIGl0IGV2ZW4gaGFzIGFcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xldmlldzp7XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgIHtUb2dnbGVWaWV3KCgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+SGVyZSdzIHRoZSBjb250ZW50ITwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj4sXG4gICAgICAgICAgICAgICAgcG9ydGFsUmVzdWx0LFxuICAgICAgICAgICAgICAgIGVuZFJlc3VsdCxcbiAgICAgICAgICAgICksXG4gICAgICAgICl9XG4gICAgPC9kaXY+LFxuICAgIGRvY3VtZW50LmJvZHksXG4pO1xuXG5tb3VudChcbiAgICA8ZGl2PlxuICAgICAgICB7VG9nZ2xlVmlldygoKSA9PiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgIHtOdW1iZXJUaGluZygkbnVtIHx8ICRiaW5kKX1cbiAgICAgICAgICAgICAgICB7TnVtYmVyVGhpbmcoJG51bSB8fCAkYmluZCl9XG4gICAgICAgICAgICAgICAge051bWJlclRoaW5nKCRudW0gfHwgJGJpbmQpfVxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJib3hcIlxuICAgICAgICAgICAgICAgICAgICBvbk1vdXNlTW92ZT17ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkeCA9IGUuY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgICR5ID0gZS5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgTW91c2UgcG9zaXRpb246IHg6IHskeH0sIHk6IHskeX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICApKX1cbiAgICA8L2Rpdj4sXG4gICAgZG9jdW1lbnQuYm9keSxcbik7XG5cbmZ1bmN0aW9uIE51bWJlclRoaW5nKCRxOiBudW1iZXIpIHtcbiAgICAvLyBmb3IgZnVuY3Rpb25hbGNvbXBvbmVudHMsIGV2ZXJ5IGFyZ3VtZW50IHNob3VsZCBnZXQgYXV0byBjb252ZXJ0ZWQgdG8gYSB3YXRjaGFibGUgd2hldGhlciBpdCBpcyBvciBub3RcbiAgICByZXR1cm4gKFxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gJHEtLX0+LS08L2J1dHRvbj5cbiAgICAgICAgICAgIHskcS50b0ZpeGVkKCl9XG4gICAgICAgICAgICB7Y29uc29sZS5sb2coXCJ2YWx1ZSBpc1wiLCAkcSl9XG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+ICRxKyt9PisrPC9idXR0b24+XG4gICAgICAgIDwvc3Bhbj5cbiAgICApO1xufVxuXG5sZXQgJG9iaiA9IHVuZGVmaW5lZCBhcyB7IGE6IDU7IGI6IDYgfSB8IHVuZGVmaW5lZDtcbm1vdW50KFxuICAgIDxkaXY+XG4gICAgICAgIHskb2JqID09PSB1bmRlZmluZWQgPyAoXG4gICAgICAgICAgICA8c3Bhbj5ub3QgZGVmaW5lZDwvc3Bhbj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIHtOdW1iZXJUaGluZygkb2JqLmEgfHwgJGJpbmQpfSB7TnVtYmVyVGhpbmcoJG9iai5iIHx8ICRiaW5kKX1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgKX1cbiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiAoJG9iaiA9IHVuZGVmaW5lZCl9PnNldCB1bmRlZmluZWQ8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiAoJG9iaiA9IHsgYTogNSwgYjogNiB9KX0+c2V0IDUsIDY8L2J1dHRvbj5cbiAgICA8L2Rpdj4sXG4gICAgZG9jdW1lbnQuYm9keSxcbik7XG5cbnR5cGUgTmVzdGVkVCA9XG4gICAgfCB7IGE6IE5lc3RlZFQ7IGI6IE5lc3RlZFQ7IHRleHQ6IHN0cmluZzsgY291bnRlcjogbnVtYmVyIH1cbiAgICB8IHVuZGVmaW5lZDtcblxuY29uc3QgJGdsb2JhbENvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBOZXN0ZWRUZXN0KCRvOiBOZXN0ZWRUKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHskbyA/IChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+ICgkbyA9IHVuZGVmaW5lZCl9PlJlbW92ZTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXskby50ZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25JbnB1dD17ZSA9PiAoJG8hLnRleHQgPSBlLmN1cnJlbnRUYXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICB7TnVtYmVyVGhpbmcoJG8uY291bnRlciB8fCAkYmluZCl9XG4gICAgICAgICAgICAgICAgICAgIHtOdW1iZXJUaGluZygkZ2xvYmFsQ291bnRlciB8fCAkYmluZCl9XG4gICAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT5hOiB7TmVzdGVkVGVzdCgkby5hIHx8ICRiaW5kKX08L2xpPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPmI6IHtOZXN0ZWRUZXN0KCRvLmIgfHwgJGJpbmQpfTwvbGk+XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKCRvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGI6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlcjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICBDcmVhdGVcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICApOyAvLyAkbyA/IGlzbid0IGdyZWF0IGJlY2F1c2UgaXQgdXBkYXRlcyBldmVyeSB0aW1lICRvIG9yIGFueXRoaW5nIHVuZGVyIGl0IGNoYW5nZXMuLi4gbm90IHN1cmUgaG93IHRvIGZpeC5cbiAgICAvLyBtYXliZSB0aGVyZSBzaG91bGQgYmUgc29tZSB3YXkgb2Ygc3BlY2lmeWluZyB0aGF0IHdlIGRvbid0IG5lZWQgZGVlcCB2YWx1ZXMgb24gdGhpcyBvbmUgYmVjYXVzZSB3ZSdyZSBqdXN0IGNvbXBhcmluZyBpdCBhZ2FpbnN0IHRydWUgb3IgZmFsc2Vcbn1cblxubGV0ICRuZXN0ZWRPOiBOZXN0ZWRUO1xubW91bnQoTmVzdGVkVGVzdCgkbmVzdGVkTyB8fCAkYmluZCksIGRvY3VtZW50LmJvZHkpO1xuXG5tb3VudChcbiAgICBUb2dnbGVWaWV3KCgpID0+IE5lc3RlZFRlc3QoJG5lc3RlZE8gfHwgJGJpbmQpKSxcbiAgICBkb2N1bWVudC5ib2R5LFxuKTtcblxubGV0ICRzaG93U2VjdGlvbiA9IHRydWU7XG5tb3VudChcbiAgICA8ZGl2PlxuICAgICAgICB7JHNob3dTZWN0aW9uID8gKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICh3aW5kb3cgYXMgYW55KS5zdGFydEhpZ2hsaWdodFVwZGF0ZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzaG93U2VjdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgaGlnaGxpZ2h0IHVwZGF0ZXNcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAoKHdpbmRvdyBhcyBhbnkpLm9uTm9kZVVwZGF0ZSA9IChuOiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobikpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIGxvZyB1cGRhdGVzXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiAoKHdpbmRvdyBhcyBhbnkpLm9uTm9kZVVwZGF0ZSA9ICgpID0+IHt9KX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIGlnbm9yZSB1cGRhdGVzXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxkaXYgLz5cbiAgICAgICAgKX1cbiAgICA8L2Rpdj4sXG4gICAgZG9jdW1lbnQuYm9keSxcbik7XG5cbmZ1bmN0aW9uIFRvZG9MaXN0KCRsaXN0OiBMaXN0PHN0cmluZz4pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGRpdj5TdGFydFRvZG9MaXN0PC9kaXY+XG4gICAgICAgICAgICB7TGlzdFJlbmRlcigkbGlzdCwgJGl0ZW0gPT4gKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIEl0ZW06e1wiIFwifVxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXskaXRlbX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uSW5wdXQ9e2UgPT4gKCRpdGVtID0gZS5jdXJyZW50VGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiAkbGlzdC5wdXNoKFwiaG1tXCIpfT4rPC9idXR0b24+XG4gICAgICAgICAgICA8ZGl2PkVuZFRvZG9MaXN0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICk7XG59XG5cbmNvbnN0ICRsaXN0ID0gJC5saXN0KFtcImhpXCJdKTtcbm1vdW50KFRvZG9MaXN0KCRsaXN0IHx8ICRiaW5kKSwgZG9jdW1lbnQuYm9keSk7XG5tb3VudChUb2RvTGlzdCgkbGlzdCB8fCAkYmluZCksIGRvY3VtZW50LmJvZHkpO1xuXG50eXBlIE5vZGVUeXBlID0geyBudW06IG51bWJlcjsgc3ViaXRlbXM6IExpc3Q8Tm9kZVR5cGU+IH07XG5cbmZ1bmN0aW9uIE5vZGVUZXN0VGhpbmcoJGxpc3Q6IExpc3Q8Tm9kZVR5cGU+KSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICB7TGlzdFJlbmRlcigkbGlzdCwgJG5vZGUgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtOdW1iZXJUaGluZygkbm9kZS5udW0gfHwgJGJpbmQpfSx7XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge05vZGVUZXN0VGhpbmcoJG5vZGUuc3ViaXRlbXMgfHwgJGJpbmQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICB7XCIgXCJ9XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxpc3QucHVzaCh7IG51bTogNSwgc3ViaXRlbXM6ICQubGlzdChbXSkgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgK1xuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgKTtcbn1cblxuY29uc3QgJGxpc3RUZXN0ID0gJC5saXN0PE5vZGVUeXBlPihbXSk7XG5tb3VudChOb2RlVGVzdFRoaW5nKCRsaXN0VGVzdCB8fCAkYmluZCksIGRvY3VtZW50LmJvZHkpO1xubW91bnQoTm9kZVRlc3RUaGluZygkbGlzdFRlc3QgfHwgJGJpbmQpLCBkb2N1bWVudC5ib2R5KTtcblxubW91bnQoPGRpdj4tLS1SZWFsVG9kb0xpc3Q6e1RvZG9MaXN0QXBwKCl9PC9kaXY+LCBkb2N1bWVudC5ib2R5KTtcbiJdLCJzb3VyY2VSb290IjoiIn0=