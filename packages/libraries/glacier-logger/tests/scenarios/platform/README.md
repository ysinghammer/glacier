# Platform

Lets a consumer import `@glacier/logger` on Node or in the browser through one package root and get the right
transports for the platform, composed the way a DI container would. Public contract: the conditional `"."` export of
`package.json` (`types`, `browser` to `index.browser.ts`, `import` to `index.ts`), the Node-only
`NodeStdoutTransport` and `NodeFileTransport`, the browser `BrowserConsoleTransport` and `LoggerFactory`.
README examples are type-checked in [ReadmeExamples.test-d.ts](../../contracts/ReadmeExamples.test-d.ts).

| ID      | Title                | Verifies                                                                                              | Source  | Test                                                       |
| ------- | -------------------- | ----------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| PLT-001 | Node entry           | The Node entry exposes the file and stdout transports and not the console transport                   | phase 6 | [NodeEntry.test.ts](NodeEntry.test.ts)                     |
| PLT-002 | Browser entry        | The browser entry exposes the console transport and no Node-only transport                            | phase 6 | [BrowserEntry.test.ts](BrowserEntry.test.ts)               |
| PLT-003 | Export map           | `exports` contains only `"."` with `types`, `browser` and `import` conditions, and no subpaths        | phase 6 | [ExportMap.test.ts](ExportMap.test.ts)                     |
| PLT-004 | Provider composition | A provider function builds the factory; two contexts log to a pretty stdout and a JSON file transport | phase 6 | [DependencyInjection.test.ts](DependencyInjection.test.ts) |
