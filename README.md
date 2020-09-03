This project was some attempts to use a babel transformer to make reactive stuff idk.

# abandoned in favor of [uilang](https://)

reasons:

- js isn't designed for what I'm trying to do
- there are a lot of things I don't like about js
- why not

---

## development setup:

### initial:

-   install node and yarn
-   go to core and `yarn install`
-   go to core and `yarn link`
-   go to transform and `yarn install`
-   go to transform and `yarn link`
-   go to demo and `yarn link dmf`
-   go to demo and `yarn link babel-plugin-transform-dmf`
-   go to demo and `yarn install`

### every time:

-   open 5 terminals
-   go to core and `yarn watch`
-   go to transform and `yarn watch`
-   go to demo and `yarn watch`
-   go to demo and `yarn serve`
-   go to . and run the fish script `onchange (for file in (find . -type f -not -path '*node_modules*' -not -path '*.git*' -not -path './junk*'); git check-ignore $file -q; if test $status -eq 0; else; echo $file; end; end && echo "Ready" 1>&2) -- prettier --write '{{changed}}'` or set up prettier in your editor on save or on commit

### about

dmf is yet another javascript framework and there is nothing particularily special or interesting about it except that it gets :) for all three things in the table below:

| project   | virtual dom | functional component style  | typescript support |
| --------- | ----------- | --------------------------- | ------------------ |
| dmf       | no :)       | yes :)                      | yes :)             |
| react     | yes :(      | yes :)                      | yes :)             |
| svelte    | no :)       | no :( (html template)       | no :(              |
| vue       | yes :(      | no :( (html template)       | kind of :~         |
| aurelia   | no :)       | no :( (class+html template) | kind of :~         |
| hyperhtml | kind of :~  | yes :) (many choices)       | kind of :~         |
| imba      | kind of :~  | sure? :)                    | no :(              |

-   svelte has issues open for partial :~ and full :) typescript support. [partial support issue](https://github.com/sveltejs/svelte/issues/1639) [full support issue](https://github.com/sveltejs/svelte/issues/3677)
-   vue has typescript support in javascipt code but not in html templates
-   aurelia has typescript support in javascript code but not in html templates
-   while not using virtual dom, hyperhtml still requires a lot of code to run when updating a small number of nodes in deep nested component trees. this is significantly better for performance than virtual dom. [more](https://viperhtml.js.org/hyperhtml/documentation/#introduction-1).
-   hyper html has typescript support in javascript but not in template string attribute values

### why does virtual dom matter

reconciliation - updating the dom to match your data - needs to be fast for small updates that are far up on the tree.

if every time you clicked a plus on a counter, the entire application was .replaceChild()ed with a new application, that would be terrible for performance. virtual dom does that, except the replaceChild only happens in code. the entire application is recreated as lightweight objects and then the objects are compared with the real html to minimize the actual dom updates required. unfortunately, as apps get bigger, recreating the entire application gets slow. even though dom changes are minimized, the app still runs slowly because creating thousands of lightweight objects starts to actually take time.

### performance comparison

-   [vanillajs replacechild entire app]() - slowest
-   [react hooks no performance optimization]() - slow
-   [react "best practices"]() - slow
-   [hyperhtml rerender entire app]() - slow
-   [react with performance optimization]() - fast
-   [dmf best practices]() - fast
-   [vanillajs only change what is necessary]() - fastest

code complexity

-   [vanillajs only change what is necessary]() - worst
-   [react with performance optimization]() - bad
-   [vanillajs replacechild entire app]() - good
-   [react hooks no performance optimization]() - good
-   [react "best practices"]() - good
-   [hyperhtml rerender entire app]() - good
-   [dmf best practices]() - good

### downsides

weird reactive stuff behind the scenes. requires a babel plugin to compile. weird code.
