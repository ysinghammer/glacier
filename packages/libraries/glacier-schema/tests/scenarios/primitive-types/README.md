# Primitive types

Lets consumers declare scalar field types with property decorators: `IsString`, `IsNumber`, `IsInt`,
`IsBoolean`, `IsBigInt`, `IsDate`, `IsLiteral`, `IsEnum` and the `IsAny` escape hatch. Declared fields are
required, the compiler-emitted `design:type` is checked against the primitive decorators, and invalid
declarations fail loudly with `SchemaDefinitionError`. Public contract: the decorators above and
`SchemaDefinitionError` of the package-root API of `@glacier/schema`. Story-local criteria are phase 2.

| ID      | Title                        | Verifies                                                                                   | Source  | Test                                                   |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------ |
| SCH-010 | `IsString`                   | Strings accepted; other values rejected as `invalid_type`                                  | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-011 | `IsNumber`                   | Finite numbers accepted; NaN, infinities and strings rejected                              | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-012 | `IsInt`                      | Integers accepted; fractions, NaN, infinities and strings rejected                         | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-013 | `IsBoolean`                  | Booleans accepted; other values rejected                                                   | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-014 | `IsBigInt`                   | Bigints accepted; numbers rejected                                                         | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-015 | `IsDate`                     | Valid dates accepted; `Invalid Date` is `invalid_date`; strings rejected                   | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-016 | `IsLiteral`                  | Exactly the string, number, boolean, bigint or null literal passes                         | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-017 | `IsEnum`                     | String/numeric enums, const objects and arrays; reverse mappings ignored; empty rejected   | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-018 | `IsAny`                      | Any value accepted unchanged; undefined leaves the key absent                              | phase 2 | [PrimitiveTypes.test.ts](PrimitiveTypes.test.ts)       |
| SCH-019 | Declared fields are required | Missing key and explicit undefined are `invalid_type` received `undefined`                 | phase 2 | [FieldDeclarations.test.ts](FieldDeclarations.test.ts) |
| SCH-020 | Design-type inference        | Primitive decorators agree with emitted type; mismatches throw; uninformative types pass   | phase 2 | [FieldDeclarations.test.ts](FieldDeclarations.test.ts) |
| SCH-021 | Field declaration validation | Duplicate type decorators, static, symbol and non-class targets throw; subclass redeclares | phase 2 | [FieldDeclarations.test.ts](FieldDeclarations.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. The test transformer
does not emit decorator metadata, so specs record `design:type` through `tests/support/FieldDeclaration.ts`
exactly as the compiler would. Consumers enable `emitDecoratorMetadata` and import
`@glacier/reflection/register` first.
