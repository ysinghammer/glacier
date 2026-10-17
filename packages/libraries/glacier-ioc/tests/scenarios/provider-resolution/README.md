# Provider resolution

Lets consumers identify dependencies (class, symbol or typed `InjectionToken`), declare them with
`@Injectable`/`@Inject`/`@Optional`, and receive precise typed failures. Public contract: the package-root API
of `@glacier/ioc`. Story-local criteria are `AC-001`..`AC-004` of story 001 and `AC-001`..`AC-005` of story 002.

| ID      | Title                                           | Verifies                                                            | Source           | Test                                                       |
| ------- | ----------------------------------------------- | ------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| IOC-001 | Token identity and descriptions                 | Tokens are unique by identity; errors show descriptions             | story 001 AC-001 | [TokenIdentity.test.ts](TokenIdentity.test.ts)             |
| IOC-002 | Container error hierarchy                       | Subclasses are `ContainerError`/`Error`; paths, causes kept         | story 001 AC-002 | [ContainerErrors.test.ts](ContainerErrors.test.ts)         |
| IOC-003 | Decorator metadata is readable                  | `@Injectable` scope and `@Inject`/`@Optional` are readable          | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |
| IOC-004 | Implicit tokens come from `design:paramtypes`   | Emitted classes become tokens without `@Inject`                     | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |
| IOC-005 | Unusable injection metadata fails explicitly    | Missing/erased parameter types throw `InvalidProviderError`         | story 001 AC-003 | [InjectionDecorators.test.ts](InjectionDecorators.test.ts) |
| IOC-006 | Singletons are created once and shared          | One lazy shared instance per token; later provider wins             | story 002 AC-001 | [ProviderResolution.test.ts](ProviderResolution.test.ts)   |
| IOC-007 | `useValue` and `useExisting`                    | Value returned as-is; alias yields the target instance              | story 002 AC-002 | [ProviderResolution.test.ts](ProviderResolution.test.ts)   |
| IOC-008 | Factories receive injected arguments            | Sync `useFactory` gets `inject` values in order; types in contracts | story 002 AC-003 | [ProviderResolution.test.ts](ProviderResolution.test.ts)   |
| IOC-009 | Unknown dependencies and cycles name their path | `A -> B -> ?` errors, `@Optional` gives `undefined`, cycles throw   | story 002 AC-004 | [ProviderResolution.test.ts](ProviderResolution.test.ts)   |
| IOC-010 | Invalid provider shapes are rejected            | Bad shapes, metadata and unsupported scopes fail `create` together  | story 002 AC-005 | [ProviderValidation.test.ts](ProviderValidation.test.ts)   |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line. Type contracts live in
[`tests/contracts`](../../contracts/PublicApi.test-d.ts); `AC-004` (root-only exports, counts) is documented in the
[package README](../../../README.md).
