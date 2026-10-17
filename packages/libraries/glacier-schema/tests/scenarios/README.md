# Scenario index

| Capability                                       | Purpose and value                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [coercion](coercion/README.md)                   | Opt-in per-call conversion of loosely typed input before validation.                                    |
| [collections](collections/README.md)             | Arrays, tuples, sets, maps and records with element validation, sizes and uniqueness.                   |
| [composition](composition/README.md)             | Inheritance and the `PartialType`, `PickType`, `OmitType`, `ExtendType` helpers for create/update DTOs. |
| [constraints](constraints/README.md)             | String and number constraints, string formats and normalisation via decorator options.                  |
| [json-schema](json-schema/README.md)             | JSON Schema 2020-12 and OpenAPI 3.1 output with `Describe` annotations and `JsonSchema` fragments.      |
| [modifiers](modifiers/README.md)                 | `Optional`, `Nullable`, `Default`, `Rename` and `Transform` field modifiers.                            |
| [nested-objects](nested-objects/README.md)       | Nested classes, lazy references for cycles and a recursion depth cap with full issue paths.             |
| [parsing-pipeline](parsing-pipeline/README.md)   | `parse`/`safeParse` turning untrusted input into real class instances, with a frozen, cached schema.    |
| [primitive-types](primitive-types/README.md)     | Scalar, literal, enum and any decorators with design-type checking and validated field declarations.    |
| [refine](refine/README.md)                       | Property-level and class-level synchronous refinements for cross-field rules with configurable issues.  |
| [unions](unions/README.md)                       | Discriminated unions on properties and base classes, and non-discriminated `IsOneOf` unions.            |
| [validation-errors](validation-errors/README.md) | Issues with paths and stable codes, overridable messages, `SchemaError` and the `isSchemaError` guard.  |
