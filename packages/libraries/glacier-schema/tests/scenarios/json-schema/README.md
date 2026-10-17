# JSON Schema

Lets consumers publish the shape of a decorated class to API documentation and client tooling.
`Schema.toJsonSchema(Class, { target })` turns one class and every class it references into JSON Schema 2020-12
(`draft-2020-12`, a `$ref` to the root plus `$defs`) or the OpenAPI 3.1 component layout (`openapi-3.1`, a `$ref` to
the root plus `components.schemas`). Definitions are keyed by class name or `Describe({ name })`; colliding names
throw. `Describe` adds `title`, `description`, `example` (emitted as `examples`) and `deprecated`; `JsonSchema`
merges a manual fragment over the generated keywords. `Refine` and `Transform` cannot be expressed and are skipped;
string pattern flags other than none and `u` cannot be expressed and are ignored; maps are emitted like records and
bigint values as integers. Public contract: `Schema.toJsonSchema`, `Describe`, `JsonSchema`, `IJsonSchema`,
`IJsonSchemaFragment`, `IJsonSchemaOptions`, `IJsonSchemaTarget` and `IDescribeOptions` of the package-root API of
`@glacier/schema`. Story-local criteria are phase 8.

| ID      | Title                                   | Verifies                                                                                                    | Source  | Test                                     |
| ------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------- |
| SCH-120 | Document layout per target              | `$schema`/`$defs` versus `components.schemas`, root `$ref`, shared and cyclic classes, escaped names        | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-121 | Scalar types and constraints            | Strings, formats, numbers, integers, booleans, bigint, dates, literals, enums, `Refine`/`Transform` skipped | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-122 | Collections                             | Arrays, sets, tuples (`prefixItems`), records and maps with size bounds and uniqueness                      | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-123 | Modifiers                               | `required` excludes optional and defaulted fields, `Rename` aliases, `Nullable` type unions                 | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-124 | Unions                                  | Discriminated unions on properties and base classes as `oneOf` + `discriminator.mapping`, `IsOneOf`         | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-125 | `Describe` and `JsonSchema`             | Annotations, falsy examples, class names, fragment overrides, no inheritance, invalid use                   | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-126 | Names, collisions and invalid input     | Colliding names throw, `Describe({ name })` resolves them, anonymous classes, unknown targets               | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |
| SCH-127 | Derived classes and structural validity | Mapped types by name, structurally valid and JSON-serialisable output for both targets                      | phase 8 | [JsonSchema.test.ts](JsonSchema.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Output is validated
structurally by the test-owned `JsonSchemaStructure` support class because no JSON Schema validator dependency is
approved.
