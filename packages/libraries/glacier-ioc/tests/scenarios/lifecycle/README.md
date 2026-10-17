# Lifecycle

Lets consumers start and stop a container predictably: async factories finish before their dependents are built,
DEFAULT-scope instances get duck-typed startup hooks in module dependency order and shutdown hooks in reverse,
and `close()` releases everything once. Public contract: `GlacierContainer.create/close`, `Providers.factory`,
`LifecycleHookError`, `ProviderCreationError`, `UseAfterCloseError`, `AggregateContainerError` and the hook
interfaces `IOnModuleInit`, `IOnContainerInit`, `IOnModuleDestroy`, `IBeforeContainerShutdown` and
`IOnContainerShutdown` of the package-root API of `@glacier/ioc`. Story-local criteria are `AC-001`..`AC-005` of
story 006; ordering is asserted through the test-owned [recorder double](../../doubles/LifecycleRecorder.ts).

| ID      | Title                                        | Verifies                                                                                           | Source           | Test                                             |
| ------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ |
| IOC-028 | Async factories resolve before dependents    | Awaited in dependency order during `create`; async REQUEST/TRANSIENT factories via `resolve`       | story 006 AC-001 | [AsyncProviders.test.ts](AsyncProviders.test.ts) |
| IOC-029 | Factory failures keep their cause            | Sync throws and rejections surface as `ProviderCreationError` with `cause`                         | story 006 AC-001 | [AsyncProviders.test.ts](AsyncProviders.test.ts) |
| IOC-030 | Startup hooks follow module dependency order | All `onModuleInit` complete before any `onContainerInit`; failures abort `create` after cleanup    | story 006 AC-002 | [LifecycleHooks.test.ts](LifecycleHooks.test.ts) |
| IOC-031 | Shutdown reverses initialization             | `onModuleDestroy`, `beforeContainerShutdown`, `onContainerShutdown` in reverse; `close` idempotent | story 006 AC-003 | [LifecycleHooks.test.ts](LifecycleHooks.test.ts) |
| IOC-032 | Only DEFAULT instances receive hooks         | TRANSIENT and REQUEST instances are never hooked                                                   | story 006 AC-004 | [LifecycleHooks.test.ts](LifecycleHooks.test.ts) |
| IOC-033 | Hook failures do not skip other cleanup      | `close` runs every hook and rejects with `LifecycleHookError` or an aggregate, with causes         | story 006 AC-005 | [LifecycleHooks.test.ts](LifecycleHooks.test.ts) |
| IOC-034 | A closed container rejects further use       | `get`, `resolve`, `select` and module lookups throw `UseAfterCloseError`                           | story 006 AC-003 | [LifecycleHooks.test.ts](LifecycleHooks.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line. Hooks are discovered by
method name on the resolved instance; the hook interfaces exist for typing only. Nothing reads `process`.
