# Scaffold

Proves the empty package is wired end to end: both curated root entries load under Node and in Chromium, and the
build, type checks and 100% coverage run through `pnpm run ci`. This capability is replaced in phase 2.
Public contract: package-root API of `@glacier/logger`.

| ID      | Title        | Verifies                                                   | Source  | Test                                 |
| ------- | ------------ | ---------------------------------------------------------- | ------- | ------------------------------------ |
| LOG-001 | Root entries | `index.ts` and `index.browser.ts` load in Node and browser | phase 1 | [Scaffold.test.ts](Scaffold.test.ts) |
