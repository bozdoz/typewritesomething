## Moving to Deno

Removed eslint and prettier and their configs. Needed to ignore any explicit any's. Cleaned up some unused variables.

Can't really move to `deno test`, as my tests are too reliant on jest.

## Deno Build

Had to create a build.ts, but it seems successful at removing rollup; which meant I could remove ~15 packages.

Created a watch mode for the build.ts script without much fuss at all.  `deno run --watch` only watches the script and modules that you call directly, so I had to use the runtime API to use `Deno.watchFs`; it had a problem where it ran modify events three times in a row, so I also imported a recommended debounce script from the std library (versionless because we're all insane: https://jsr.io/@std/async/doc/debounce).

## Deno test

Needed a deno.json file, with "DOM" in "lib".

Needed to run with `unstable-sloppy-imports` to ignore lack of ".ts" extensions.

Needed to add to my tsconfig.json:

```json
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "module": "ES2020",
```

This is because I was running `require('index')` in the index test. For this I needed to update typescript to latest.

I needed to import tests to a single test file in order for Deno to pick up on Jest types:

`// @deno-types=npm:@types/jest`

## Deno Check

Needed a global.d.ts file to properly type check files, but I also needed to ignore the file for linting:

```ts
// deno-lint-ignore-file
declare var gtag: (...args: unknown[]) => void;

declare var dataLayer: unknown[];

declare var process: NodeJS.Process
```

If I didn't ignore the file for linting I would get:

> error[no-var]: `var` keyword is not allowed.
> --> /Users/delong/dev/typewritesomething/src/global.d.ts:6:1
>  | 
>6 | declare var process: NodeJS.Process
>  | ^^^^^^^
>
>  docs: https://lint.deno.land/rules/no-var

All of a sudden my typechecks failed with crazy errors like:

```
error: TS2318 [ERROR]: Cannot find global type 'Array'.
```

I had to add "deno.ns" to my deno.json, but I have no idea why.  

Then the global.d.ts complained:

```
TS2503 [ERROR]: Cannot find namespace 'NodeJS'.
declare var process: NodeJS.Process;
```

So I had to add another type to that file:

```ts
/// <reference types="npm:@types/node" />
```

## Benchmarks

```
npm ci
32s

npm run lint
4s

npm test
slow tests
20s
```

```
deno lint
0.3s


```
