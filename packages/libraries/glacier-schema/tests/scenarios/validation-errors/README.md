# Validation errors

Lets consumers and adapters inspect why input was rejected: `ISchemaIssue` values with path, stable code,
English message and parameters; `SchemaError` thrown by `Schema.parse`; and `Schema.isError`, which recognises errors
across duplicate copies of the package. Public contract: `ISchemaIssue`, `ISchemaIssueCode`, `SchemaError`,
`Schema.isError` and the `message` decorator option of the package-root API of `@glacier/schema`.
Story-local criteria are phase 2.

| ID      | Title                               | Verifies                                                                      | Source  | Test                                                 |
| ------- | ----------------------------------- | ----------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| SCH-030 | Issue shape and collection          | All field issues reported in declaration order with path and code             | phase 2 | [ValidationErrors.test.ts](ValidationErrors.test.ts) |
| SCH-031 | Message override                    | Decorator `message` replaces the text and keeps code, path and params         | phase 2 | [ValidationErrors.test.ts](ValidationErrors.test.ts) |
| SCH-032 | `Schema.parse` throws `SchemaError` | Code `SCHEMA_VALIDATION_FAILED`, summary message and every issue              | phase 2 | [ValidationErrors.test.ts](ValidationErrors.test.ts) |
| SCH-033 | JSON serialisation                  | `toJSON` exposes name, code, message and issues; bigint params become strings | phase 2 | [ValidationErrors.test.ts](ValidationErrors.test.ts) |
| SCH-034 | `Schema.isError` guard              | Recognises errors from a duplicate package copy; rejects other values         | phase 2 | [ValidationErrors.test.ts](ValidationErrors.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. Issue codes in this phase:
`invalid_type`, `invalid_literal`, `invalid_enum_value` and `invalid_date`; unions add `invalid_union` and
`invalid_discriminator` (see `unions`); later phases add more without
changing existing ones. `SchemaDefinitionError` (a programming error, not invalid input) is covered under
`parsing-pipeline` and `primitive-types`.
