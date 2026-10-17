# Coercion

Lets a caller opt in, per call, to converting loosely typed input such as query strings or form data before
validation: `Schema.parse(Class, input, { coerce: true })` and `Schema.safeParse(Class, input, { coerce: true })`. Coercion is
off by default and there is no field-level or class-level switch. Public contract: `Schema.parse`, `Schema.safeParse` and
`ISchemaParseOptions` of the package-root API of `@glacier/schema`. Story-local criteria are phase 3.

| ID      | Title                      | Verifies                                                                                               | Source  | Test                                 |
| ------- | -------------------------- | ------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------ |
| SCH-060 | Per-call switch            | Convertible input is rejected by default and accepted with `coerce: true`; no leakage between calls    | phase 3 | [Coercion.test.ts](Coercion.test.ts) |
| SCH-061 | Rules per type             | Numbers, booleans, bigints, dates, strings, literals and enums convert; the rest is left to validation | phase 3 | [Coercion.test.ts](Coercion.test.ts) |
| SCH-062 | Interaction with modifiers | `null`/`undefined` are never coerced; `Transform` sees the coerced value; constraints see the result   | phase 3 | [Coercion.test.ts](Coercion.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Conversions: decimal
strings to numbers (not empty or hexadecimal text), `"true"`/`"false"` (any case) to booleans, integer strings
and safe integers to bigints, ISO 8601 strings and finite timestamps to dates, numbers, booleans and bigints to
strings. Literal and enum fields try the same conversions and keep the first result that is an allowed value.
