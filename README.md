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

### similar projects

| project   | virtual dom | functional component style  | typescript support |
| --------- | ----------- | --------------------------- | ------------------ |
| react     | yes :(      | yes :)                      | yes :)             |
| svelte    | no :)       | no :( (html template)       | no :(              |
| vue       | yes :(      | no :( (html template)       | kind of :~         |
| aurelia   | no :)       | no :( (class+html template) | kind of :~         |
| hyperhtml | kind of :(  | yes :) (many choices)       | kind of :~         |

-   svelte has issues open for partial :~ and full :) typescript support. [partial support issue](https://github.com/sveltejs/svelte/issues/1639) [full support issue](https://github.com/sveltejs/svelte/issues/3677)
-   vue has typescript support in javascipt code but not in html templates
-   aurelia has typescript support in javascript code but not in html templates
-   while not using virtual dom by the standard definition, hyper html still uses a diffing based approach to rerendering components combined with the added overhead of parsing html. changing a textnode like in [this example](https://webreflection.github.io/hyperHTML/test/tick.html) requires diffing the h1 and h2 even though only the textnode is changing.
-   hyper html has typescript support in javascript but not in template string attribute values

### why does virtual dom matter

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
