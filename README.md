## development setup:

### initial:

- install node and yarn
- go to core and `yarn install`
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
-   go to . and `onchange (for file in (find . -type f -not -path '*node_modules*' -not -path '*.git*' -not -path './junk*'); git check-ignore $file -q; if test $status -eq 0; else; echo $file; end; end && echo "Ready" 1>&2) -- prettier --write '{{changed}}'` or set up prettier in your editor on save or on commit
