# Unions

Lets consumers accept one of several shapes. `IsUnion({ discriminator, variants })` uses an explicit
discriminator-to-class mapping (no implicit registry): the variant is selected before validation, so issues point
into the variant and the result is an instance of the variant class. It works on a property and on a base class,
where parsing the base itself yields the selected variant. `IsOneOf` accepts a value matching any of several types
without a discriminator and reports one `invalid_union` issue listing every option's issues. Public contract:
`IsUnion`, `IsOneOf`, `IUnionOptions`, `IUnionVariants` and the codes `invalid_union` and `invalid_discriminator`
of the package-root API of `@glacier/schema`. Story-local criteria are phase 5.

| ID      | Title                               | Verifies                                                                                        | Source  | Test                             |
| ------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- | ------- | -------------------------------- |
| SCH-090 | Discriminated union fields          | Variant selection, variant instances, issue paths with `Rename`, optional unions, non-objects   | phase 5 | [Unions.test.ts](Unions.test.ts) |
| SCH-091 | Unknown or missing discriminator    | `invalid_discriminator` at the discriminator path; field message only for own issues            | phase 5 | [Unions.test.ts](Unions.test.ts) |
| SCH-092 | Union options and nesting           | Coercion inside the variant, variant counted as a nesting level                                 | phase 5 | [Unions.test.ts](Unions.test.ts) |
| SCH-093 | Discriminated union on a base class | Top-level parse selects the variant, root-level paths, variants and depth stay ordinary         | phase 5 | [Unions.test.ts](Unions.test.ts) |
| SCH-094 | Non-discriminated unions            | First match wins, `invalid_union` attempts, exact match before coercion, null never coerced     | phase 5 | [Unions.test.ts](Unions.test.ts) |
| SCH-095 | Union declaration                   | Invalid mappings, duplicate decorators, frozen classes, non-class variants fail early or lazily | phase 5 | [Unions.test.ts](Unions.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Variants are resolved and
compiled on first use, so `() => Class` references support forward references. Unions are not accepted as element
types of collections; wrap them in a class.
