# Parsing pipeline

Lets consumers turn untrusted input into a real instance of a decorated class with `Schema.safeParse` (typed
outcome) or `Schema.parse` (throws). Public contract: `Schema.parse`, `Schema.safeParse`, `IResult` and the schema freeze enforced
through `SchemaDefinitionError` of the package-root API of `@glacier/schema`.
Story-local criteria are phase 2 of the schema plan.

| ID      | Title                                 | Verifies                                                                       | Source           | Test                                               |
| ------- | ------------------------------------- | ------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| SCH-001 | Constructor-free instances            | Prototype instance; constructor and field initializers never run               | phase 2 pipeline | [ParsingPipeline.test.ts](ParsingPipeline.test.ts) |
| SCH-002 | Unknown keys are stripped             | Only declared own fields are copied; inherited input properties are ignored    | phase 2 pipeline | [ParsingPipeline.test.ts](ParsingPipeline.test.ts) |
| SCH-003 | Object input only                     | Non-objects and arrays fail at the root path; fieldless classes parse to empty | phase 2 pipeline | [ParsingPipeline.test.ts](ParsingPipeline.test.ts) |
| SCH-004 | Metadata frozen after the first parse | Decorating a parsed class or its ancestors throws; unparsed classes still work | phase 2 pipeline | [ParsingPipeline.test.ts](ParsingPipeline.test.ts) |
| SCH-005 | Compiled schema reuse                 | Repeated parses give equal, distinct instances                                 | phase 2 pipeline | [ParsingPipeline.test.ts](ParsingPipeline.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Coercion is not part of
this phase; `Schema.safeParse` and `Schema.parse` take no options yet.
