# Scopes

Lets consumers choose a provider lifetime: DEFAULT (one shared instance), TRANSIENT (a new instance per
resolution) or REQUEST (one instance per context id), declared on `@Injectable` or on class and factory
provider objects (the provider object wins). `GlacierContainer.resolve(token, contextId?)` serves every scope
asynchronously, while `get` serves only DEFAULT providers. REQUEST bubbles up to every dependent, TRANSIENT does
not, and `ModuleRef` gives providers a lookup bound to their own module. Public contract: `Injectable`,
`Providers.factory`, `ContainerContext`, `ContextId`, `ModuleRef`, `GlacierContainer.create/get/resolve/select`,
`ModuleLookup`, `InvalidScopeError` and `ContextIdMisuseError` of the package-root API of `@glacier/ioc`.
Story-local criteria are `AC-001`..`AC-005` of story 005.

| ID      | Title                                    | Verifies                                                                 | Source           | Test                                               |
| ------- | ---------------------------------------- | ------------------------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| IOC-022 | TRANSIENT providers                      | A new instance per `resolve`, even with the same context id              | story 005 AC-001 | [ScopeLifetimes.test.ts](ScopeLifetimes.test.ts)   |
| IOC-023 | REQUEST providers and context ids        | One instance per id, distinct across ids, fresh context without an id    | story 005 AC-002 | [ScopeLifetimes.test.ts](ScopeLifetimes.test.ts)   |
| IOC-024 | Scope bubbling                           | REQUEST bubbles to dependents transitively; TRANSIENT does not           | story 005 AC-003 | [ScopeBubbling.test.ts](ScopeBubbling.test.ts)     |
| IOC-025 | `get` rejects scoped providers           | `InvalidScopeError` pointing to `resolve()` for TRANSIENT/REQUEST-bound  | story 005 AC-004 | [ScopeLifetimes.test.ts](ScopeLifetimes.test.ts)   |
| IOC-026 | `ModuleRef` resolves within its module   | Injectable; strict by default, `get`/`resolve`, context and scope misuse | story 005 AC-005 | [ModuleRefLookup.test.ts](ModuleRefLookup.test.ts) |
| IOC-027 | Invalid scope declarations fail `create` | Unknown literals and scopes on value/alias providers are rejected        | story 005 AC-003 | [ScopeBubbling.test.ts](ScopeBubbling.test.ts)     |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line. Scopes are string literals
(`"default" | "transient" | "request"`, `IProviderScope`), not an enum, following the TypeScript policy.

A TRANSIENT provider that depends on a REQUEST provider stays transient (a new instance per resolution, sharing
the context's REQUEST dependency) but still makes its own dependents REQUEST. An alias (`useExisting`) takes
the scope of its target.
