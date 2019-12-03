```js
let project = "???";
```

# Context and scope

Javascript frameworks help make clearner code for creating and modifying DOM nodes. Most of these frameworks operate using what is called "virtual dom" where objects are rendered into virtual dom every time they update, then diffed with real dom to decide what needs changing. `${project}` instead changes dom directly when data updates, removing the need for large amounts of extra rendering and diffing.

## Goals

-   Make it easier to write apps than vanilla JS
-   Don't do diffing
-   Support typescript everywhere

## Non-goals

-   Not require compiling

# Overview

The core design idea is that the framework requires no diffing.
