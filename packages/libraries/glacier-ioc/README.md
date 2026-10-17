# @glacier/ioc

Private, native ESM dependency-injection foundation built on [`@glacier/reflection`](../glacier-reflection/README.md).
It delivers tokens, the container error hierarchy, the `@Injectable`/`@Inject`/`@Optional` decorators with
readable metadata, the four provider kinds and a `GlacierContainer` resolving DEFAULT, TRANSIENT and REQUEST
providers. `@Module` composition (imports, exports, global, dynamic modules) groups them. Factories may be
async, DEFAULT providers can hook into startup and shutdown, and `close()` ends the container.

## Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.
The root exports **46 symbols: 23 runtime values and 23 type-only exports**.

| Kind    | Exports                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime | `InjectionToken`, `Injectable`, `Inject`, `Optional`, `InjectionMetadata`, `ContainerError`, `UnknownDependencyError`, `CircularDependencyError`, `InvalidScopeError`, `InvalidProviderError`, `ContextIdMisuseError`, `UseAfterCloseError`, `AggregateContainerError`, `GlacierContainer`, `Providers`, `Module`, `InvalidModuleError`, `ModuleLookup`, `ContainerContext`, `ContextId`, `ModuleRef` |
| Types   | `IToken`, `ITokenReference`, `IProviderScope`, `IInjectableOptions`, `IConstructorDependency`, `IContainerErrorOptions`, `IProvider`, `IClassProvider`, `IValueProvider`, `IFactoryProvider`, `IExistingProvider`, `IInjectedValues`, `IClassConstructor`, `IGetOptions`, `IModuleOptions`, `IDynamicModule`, `IModuleReference`, `IModuleExport`                                                     |

## Tokens

A token is a class or a symbol (`IToken`); string tokens are unsupported. `new InjectionToken<T>(description)`
creates a typed token owning a fresh symbol, so tokens are unique by identity even with equal descriptions.
Error messages render classes by name, symbols as `Symbol(description)` and typed tokens as
`InjectionToken(description)`.

## Decorators and metadata

Requires legacy decorators and compiler metadata, so consumers enable `experimentalDecorators` and
`emitDecoratorMetadata` and import `@glacier/reflection/register` first in static composition
(this library never registers it itself).

```ts
import "@glacier/reflection/register";
import { Inject, Injectable, InjectionMetadata, InjectionToken, Optional } from "@glacier/ioc";

const databaseUrl = new InjectionToken<string>("database-url");

@Injectable({ scope: "request" })
class OrderService {
  public constructor(
    readonly repository: OrderRepository, // implicit token from design:paramtypes
    @Inject(databaseUrl) readonly url: string, // explicit token wins
    @Optional() readonly audit: AuditLog, // may resolve to undefined
  ) {}
}

InjectionMetadata.readScope(OrderService); // "request"
InjectionMetadata.readDependencies(OrderService);
// [{ position: 0, token: OrderRepository, isOptional: false }, ...]
```

Declarations are read from the class itself (not inherited). `readDependencies` throws
`InvalidProviderError` when emitted types are missing for a class with constructor parameters, or when a
parameter's emitted type is `Object`, `Function` or `undefined` and no `@Inject` supplies a token.

## Providers and the container

A provider is a bare class (shorthand for `{ provide: Foo, useClass: Foo }`) or an object with `provide` and
exactly one of `useClass`, `useValue`, `useFactory` (sync or async, optional `inject` tokens) or `useExisting`.
`GlacierContainer.create(RootModule)` traverses the module graph and validates modules, provider shapes, class
metadata, scopes and exports up front, rejecting with one `AggregateContainerError`. `create` is async: it then constructs every DEFAULT provider once, in
module dependency order, awaiting async factories before their dependents, and `get(token)` returns that shared
instance. A factory that throws or rejects fails `create` (or `resolve`) with `ProviderCreationError`, keeping the
`cause`. A later provider for the same token in the same module replaces an earlier one.

```ts
const url = new InjectionToken<string>("url");
@Module({
  providers: [
    OrderRepository,
    OrderService,
    { provide: url, useValue: "postgres://localhost" },
    Providers.factory({
      provide: Connection,
      inject: [url] as const,
      useFactory: (address) => new Connection(address), // `address` is inferred as string
    }),
  ],
})
class AppModule {}

const container = await GlacierContainer.create(AppModule);
container.get(OrderService); // OrderService, built once
```

`Providers.factory` infers the `inject` tuple so mismatched factory parameters fail to compile; a plain object
literal in the `providers` array is only loosely typed. A missing dependency is an `UnknownDependencyError`
with the path (`OrderRepository -> Connection`) unless the parameter is `@Optional`;
cycles are a `CircularDependencyError` (`A -> B -> A`). Both are found by `create`, see Graph validation.

## Graph validation

`GlacierContainer.create` validates the whole graph before constructing any provider: invalid providers,
modules, imports and exports, required dependencies without a visible provider, and cycles between providers
or between imported modules (there is no `forwardRef`). Every problem is collected and thrown together as one
`AggregateContainerError` whose `causes` list each `ContainerError` with its dependency or module path.
Missing `@Optional` dependencies are not errors. Scope declarations are validated by this pass too.

```ts
try {
  await GlacierContainer.create(AppModule);
} catch (error) {
  if (error instanceof AggregateContainerError)
    console.error(error.causes.map((cause) => cause.message));
}
```

## Scopes, context ids and `ModuleRef`

A provider is DEFAULT (one shared instance, the default), TRANSIENT (a new instance per resolution) or REQUEST
(one instance per context id). Declare the scope with `@Injectable({ scope })` or, for class and factory
providers, with `scope` on the provider object, which wins over the class. Scopes are the string literals of
`IProviderScope`; unknown literals and scopes on `useValue`/`useExisting` providers fail `create`. REQUEST
bubbles: a provider depending on a REQUEST provider becomes REQUEST, transitively; TRANSIENT does not bubble,
though a TRANSIENT provider with a REQUEST dependency still makes its dependents REQUEST. An alias takes the
scope of its target. `get` serves DEFAULT providers only and throws `InvalidScopeError` otherwise;
`resolve(token, contextId?, { strict? })` is async and serves every scope, using a fresh context without an id
and rejecting ids not created by `ContainerContext` with `ContextIdMisuseError`.

```ts
@Injectable({ scope: "request" })
class RequestSession {}

@Injectable()
class Handler {
  constructor(
    readonly session: RequestSession,
    readonly moduleRef: ModuleRef,
  ) {} // Handler becomes REQUEST
}

const contextId = ContainerContext.createContextId();
const first = await container.resolve(Handler, contextId);
(await container.resolve(Handler, contextId)) === first; // true: same context
(await container.resolve(Handler)) === first; // false: fresh context
container.get(Handler); // throws InvalidScopeError, use resolve()
```

Every module owns an injectable `ModuleRef` (also the type returned by `select`'s lookups). `moduleRef.get`
and `moduleRef.resolve` search what the module sees (`strict` defaults to `true`; `{ strict: false }` searches
the whole container).

## Modules

`@Module({ providers, imports, exports, global })` declares a module. A module sees its own providers, then the
exports of its imports, then the exports of `global: true` modules (which must still be reachable from the
root). Providers not exported stay private. `exports` lists own tokens, tokens imported from other modules, or
imported modules to re-export. A module imported several times is one instance. Dynamic modules
(`{ module, providers, imports, exports, global }`, typically returned by `forRoot()`) append to the static
`@Module` metadata; their `global` flag, when given, wins. Invalid modules, undecorated classes and exports that
are neither provided nor imported fail `create` with `InvalidModuleError` causes in an `AggregateContainerError`.

```ts
@Module({ providers: [Logger], exports: [Logger] })
class LoggingModule {
  static forRoot(level: string): IDynamicModule {
    return {
      module: LoggingModule,
      providers: [{ provide: LEVEL, useValue: level }],
      exports: [LEVEL],
    };
  }
}

@Module({ imports: [LoggingModule.forRoot("info")] })
class AppModule {}

const container = await GlacierContainer.create(AppModule);
container.get(Logger, { strict: true }); // restricted to what AppModule sees
container.get(Logger); // strict: false searches the whole container
container.select(LoggingModule).get(Logger); // lookup from one module (strict by default)
```

## Lifecycle and `close()`

DEFAULT-scope instances (never TRANSIENT or REQUEST ones) may implement hooks, discovered by method name; the
`IOnModuleInit`, `IOnContainerInit`, `IOnModuleDestroy`, `IBeforeContainerShutdown` and `IOnContainerShutdown`
interfaces are exported for typing only. During `create`, every `onModuleInit` is awaited in module dependency
order (dependencies before dependents) before any `onContainerInit` starts. `close()` awaits `onModuleDestroy`,
then `beforeContainerShutdown`, then `onContainerShutdown`, each over the reverse order. A failing hook never
skips the others: a startup failure rejects `create` with `LifecycleHookError` after the shutdown hooks ran, and
`close()` rejects with the `LifecycleHookError` (or an `AggregateContainerError` of several) once all hooks ran.
`close()` is idempotent, and afterwards `get`, `resolve` and `select` throw `UseAfterCloseError`. Nothing
registers process signal handlers; call `close()` yourself.

```ts
@Injectable()
class Database implements IOnModuleInit, IOnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.connect();
  }
  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }
}

const container = await GlacierContainer.create(AppModule);
await container.close();
```

## Errors

Every failure extends `ContainerError` (and `Error`), accepts an optional `cause`, and carries the
dependency path in its message where one applies. `AggregateContainerError.causes` keeps every collected failure.

## Verification

```sh
pnpm exec turbo run ci --force
```

Vitest runs the [scenarios](tests/scenarios/README.md) with 100% per-file V8 coverage; erased types are
checked by `tests/contracts/*.test-d.ts` through `lint:types`. Vitest's transformer does not emit
`design:paramtypes`, so scenarios supply it through the public reflection definition.
