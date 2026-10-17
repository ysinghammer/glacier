# Graph validation

Lets consumers trust that `GlacierContainer.create` rejects a broken module graph before any provider is
constructed: missing dependencies, invalid providers, modules and exports, and circular provider or module
dependencies are all reported together in one `AggregateContainerError`, with the cycle path shown. Missing
`@Optional` dependencies are not errors. Public contract: `GlacierContainer.create`,
`AggregateContainerError`, `UnknownDependencyError`, `CircularDependencyError`, `InvalidModuleError` and
`InvalidProviderError` of the package-root API of `@glacier/ioc`. Story-local criteria are `AC-001`..`AC-004`
of story 004.

| ID      | Title                                        | Verifies                                                               | Source           | Test                                               |
| ------- | -------------------------------------------- | ---------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| IOC-018 | `create` fails before instantiating anything | Invalid providers, imports and exports fail `create`; nothing is built | story 004 AC-001 | [GraphValidation.test.ts](GraphValidation.test.ts) |
| IOC-019 | All problems are reported together           | Missing dependencies, cycles and invalid modules share one aggregate   | story 004 AC-002 | [GraphValidation.test.ts](GraphValidation.test.ts) |
| IOC-020 | Cycles report their path                     | Provider and module cycles read `A -> B -> A`; shared imports are fine | story 004 AC-003 | [GraphValidation.test.ts](GraphValidation.test.ts) |
| IOC-021 | Optional dependencies are not errors         | Missing `@Optional` dependencies pass validation and resolve undefined | story 004 AC-004 | [GraphValidation.test.ts](GraphValidation.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line.

Scope declarations are validated by the same pass; see [scopes](../scopes/README.md).
