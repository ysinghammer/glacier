# Collections

Lets consumers validate arrays, tuples, sets, maps and string-keyed records with decorators: `IsArray`, `IsTuple`,
`IsSet`, `IsMap` and `IsRecord`. The element type is a primitive constructor (`String`, `Number`, `Boolean`,
`BigInt`, `Date`), a decorated class or a `() => Class` reference. Every element is validated and every failure
is reported with its index or key in the path; the accepted value is always a new collection. `IsArray` and
`IsSet` accept `min`, `max` and `unique`; `IsMap` and `IsRecord` accept `min` and `max`; all accept `message`.
With per-call coercion elements are converted, arrays become sets, and arrays of pairs or plain objects become
maps. Public contract: the decorators above, `ICollectionOptions`, `ISizeOptions` and `IElementType` of the
package-root API of `@glacier/schema`. Story-local criteria are phase 4.

| ID      | Title                     | Verifies                                                                                     | Source  | Test                                       |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------- | ------- | ------------------------------------------ |
| SCH-070 | `IsArray`                 | Element types, new array, `invalid_type`, every bad element reported with its index          | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-071 | Array and set constraints | `min`, `max`, `unique` (`not_unique`) for arrays and sets; `min`, `max` for maps and records | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-072 | `IsTuple`                 | Positional element types, exact length (`too_small`/`too_big`), per-index issues             | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-073 | `IsSet`                   | `Set` input and new `Set` output, arrays rejected, per-element issues                        | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-074 | `IsMap`                   | Key and value validation, new `Map`, key issues marked `location: "key"`                     | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-075 | `IsRecord`                | Plain objects only, new object, `__proto__` kept as own key, issues carry the key            | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-076 | Collection declarations   | Bad sizes, element types, empty tuples and repeated type decorators throw when decorating    | phase 4 | [Collections.test.ts](Collections.test.ts) |
| SCH-077 | Modifiers and coercion    | `Optional`, `Nullable`, `Default`, `message`; coercion of elements, sets, maps and records   | phase 4 | [Collections.test.ts](Collections.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Size constraints are checked
before elements and only the size issue is reported; `unique` is checked after all elements are valid. Object
elements are compared by identity, so they are never duplicates. Element types cannot carry their own
constraints or modifiers.
