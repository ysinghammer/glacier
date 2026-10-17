# Modifiers

Lets consumers adjust how a declared field treats missing, null and raw input: `Optional`, `Nullable`,
`Default`, `Rename` and `Transform`. Per field the pipeline is: coerce (only with `{ coerce: true }`), default,
transform, then `Optional`/`Nullable` shortcuts, then type validation. Modifiers may be combined with the type
decorator in either order and are inherited. Public contract: `Optional`, `Nullable`, `Default`, `Rename`,
`Transform`, `ITransformFunction` and the `transform_failed` issue code of the package-root API of
`@glacier/schema`. Story-local criteria are phase 3.

| ID      | Title                    | Verifies                                                                                            | Source  | Test                                   |
| ------- | ------------------------ | --------------------------------------------------------------------------------------------------- | ------- | -------------------------------------- |
| SCH-050 | `Optional`               | Missing or `undefined` accepted with the key absent; present values still validated; `null` invalid | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-051 | `Nullable`               | `null` kept without further checks; `undefined` still invalid; combines with `Optional`             | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-052 | `Default`                | Value or factory used only for `undefined`, not `null`; validated; fresh factory call per parse     | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-053 | `Rename`                 | Reads the alias, writes the property, paths use the alias; empty and clashing keys throw            | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-054 | `Transform`              | Runs before validation; skipped for absent values; throws become `transform_failed`                 | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-055 | Modifier declarations    | Repeated modifiers, modifiers without type, late and static/symbol decoration throw                 | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |
| SCH-056 | Modifiers in inheritance | Subclass adds modifiers to an inherited field; a subclass type declaration replaces them            | phase 3 | [Modifiers.test.ts](Modifiers.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. `Default` returns plain
values as is, so mutable defaults should use a factory. Exceptions from `Transform` are reported with the
original message in the `reason` parameter, which adapters may choose not to expose.
