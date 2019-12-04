setup:
```fish
./core
yarn prepublishOnly
yarn link
../transform
yarn prepublishOnly
yarn link
../demo
yarn link dmf
```
(once the default packages are on npm this will only be required for development)

build: (requires two terminals)
```fish
yarn watch # watch for changes
yarn serve # serve develop webserver
```