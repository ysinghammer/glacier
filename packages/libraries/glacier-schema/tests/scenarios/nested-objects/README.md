# Nested objects

Lets consumers compose schemas: `IsObject(Class)` validates a field with another decorated class and produces a
nested instance, inside fields and collections alike. Issue paths continue through the nesting and use `Rename`
aliases. `() => Class` references support forward references and cycles such as trees. Nesting deeper than 64
classes, or the per-call `maxDepth` option, is reported as `max_depth_exceeded` instead of overflowing the stack.
Public contract: `IsObject` and `ISchemaParseOptions.maxDepth` of the package-root API of `@glacier/schema`.
Story-local criteria are phase 4.

| ID      | Title                      | Verifies                                                                                     | Source  | Test                                           |
| ------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| SCH-080 | Nested objects             | Nested instances, stripped keys, full issue paths, `Rename`, `Optional`, `Default`, coercion | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |
| SCH-081 | Objects inside collections | Arrays, records and maps of classes; paths through them; nested messages are not overridden  | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |
| SCH-082 | Lazy references            | Recursive trees, deep paths, forward references, references that are not classes fail        | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |
| SCH-083 | Recursion depth cap        | 64 levels accepted, 65 rejected with `max_depth_exceeded`, custom `maxDepth`, hostile depth  | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |
| SCH-084 | `IsObject` declaration     | Class inferred from the design type, explicit class required otherwise, invalid arguments    | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |
| SCH-085 | Nested schema freezing     | Parsing freezes nested classes it reaches, so decorating them later throws                   | phase 4 | [NestedObjects.test.ts](NestedObjects.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. A field's `message` replaces
only issues about the field's own value; issues produced by a nested class keep the nested class's messages.
Nested classes are resolved and compiled on first use.
