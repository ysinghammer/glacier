# Refine

Lets consumers express rules a type cannot: `Refine(test, message?)` on a property checks the validated value,
and `Refine<T>(test, { path, code, message })` on a class checks the whole instance for cross-field rules
(password confirmation, date ranges). Refinements are synchronous. A property refinement runs last for the field
and is skipped for failed, absent and `null` values; a class refinement runs only after every field validated,
so it never reports on top of field issues. Public contract: `Refine`, `IRefineOptions`, `IIssueCode` and the
`custom` code of the package-root API of `@glacier/schema`. Story-local criteria are phase 6.

| ID      | Title                     | Verifies                                                                                           | Source  | Test                             |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------------- | ------- | -------------------------------- |
| SCH-100 | Property-level `Refine`   | `custom` issue and message, skipped on failure/absent/null, transformed value, alias paths, throws | phase 6 | [Refine.test.ts](Refine.test.ts) |
| SCH-101 | Class-level `Refine`      | Custom path/code/message, root default, skipped after field failure, nesting, inheritance, throws  | phase 6 | [Refine.test.ts](Refine.test.ts) |
| SCH-102 | Refine with options       | Coercion applies before class refinements; `Rename` alias paths                                    | phase 6 | [Refine.test.ts](Refine.test.ts) |
| SCH-103 | Refine on subclass fields | A subclass adds a property refinement to an inherited field                                        | phase 6 | [Refine.test.ts](Refine.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Exceptions from a check are
reported with the original message in `params.reason`, which adapters may choose not to expose.
