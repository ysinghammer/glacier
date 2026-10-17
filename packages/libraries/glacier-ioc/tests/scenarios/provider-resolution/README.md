# Provider resolution

Lets consumers identify dependencies (class, symbol or typed `InjectionToken`), declare them with
`@Injectable`/`@Inject`/`@Optional`, and receive precise typed failures. Public contract: the package-root API
of `@glacier/ioc`. Story-local criteria are `AC-001`..`AC-004` of story 001.

| ID      | Title                                         | Verifies                                                    | Source           | Test                                                       |
| ------- | --------------------------------------------- | ----------------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| IOC-001 | Token identity and descriptions               | Tokens are unique by identity; errors show descriptions     | story 001 AC-001 | [TokenIdentity.test.ts](TokenIdentity.test.ts)             |
| IOC-002 | Container error hierarchy                     | Subclasses are `ContainerError`/`Error`; paths, causes kept | story 001 AC-002 | [ContainerErrors.test.ts](ContainerErrors.test.ts)         |
| IOC-003 | Decorator metadata is readable                | `@Injectable` scope and `@Inject`/`@Optional` are readable  | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |
| IOC-004 | Implicit tokens come from `design:paramtypes` | Emitted classes become tokens without `@Inject`             | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |
| IOC-005 | Unusable injection metadata fails explicitly  | Missing/erased parameter types throw `InvalidProviderError` | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line. Type contracts live in
[`tests/contracts`](../../contracts/PublicApi.test-d.ts); `AC-004` (root-only exports, counts) is documented in the
[package README](../../../README.md).
