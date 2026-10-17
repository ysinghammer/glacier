# @glacier/ioc

Private, native ESM dependency-injection foundation built on [`@glacier/reflection`](../glacier-reflection/README.md).
It delivers tokens, the container error hierarchy, the `@Injectable`/`@Inject`/`@Optional` decorators with
readable metadata, the four provider kinds and a minimal `GlacierContainer` resolving DEFAULT-scope singletons.
`@Module` composition (imports, exports, global, dynamic modules) groups them. Scopes, async providers and
lifecycle follow in later stories.

## Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.
The root exports **36 symbols: 18 runtime values and 18 type-only exports**.

| Kind    | Exports                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime | `InjectionToken`, `Injectable`, `Inject`, `Optional`, `InjectionMetadata`, `ContainerError`, `UnknownDependencyError`, `CircularDependencyError`, `InvalidScopeError`, `InvalidProviderError`, `ContextIdMisuseError`, `UseAfterCloseError`, `AggregateContainerError`, `GlacierContainer`, `Providers`, `Module`, `InvalidModuleError`, `ModuleLookup` |
| Types   | `IToken`, `ITokenReference`, `IProviderScope`, `IInjectableOptions`, `IConstructorDependency`, `IContainerErrorOptions`, `IProvider`, `IClassProvider`, `IValueProvider`, `IFactoryProvider`, `IExistingProvider`, `IInjectedValues`, `IClassConstructor`, `IGetOptions`, `IModuleOptions`, `IDynamicModule`, `IModuleReference`, `IModuleExport`       |

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
exactly one of `useClass`, `useValue`, `useFactory` (synchronous, optional `inject` tokens) or `useExisting`.
`GlacierContainer.create(RootModule)` traverses the module graph and validates modules, provider shapes, class
metadata, scopes and exports up front, throwing one `AggregateContainerError`. Only DEFAULT scope is accepted
for now. `get(token)` constructs lazily and shares one instance per provider; a later provider for the same
token in the same module replaces an earlier one.

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

const container = GlacierContainer.create(AppModule);
container.get(OrderService); // OrderService, built once
```

`Providers.factory` infers the `inject` tuple so mismatched factory parameters fail to compile; a plain object
literal in the `providers` array is only loosely typed. A missing dependency throws `UnknownDependencyError`
with the path (`OrderService -> OrderRepository -> Connection`) unless the parameter is `@Optional`;
cycles throw `CircularDependencyError`.

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

const container = GlacierContainer.create(AppModule);
container.get(Logger, { strict: true }); // restricted to what AppModule sees
container.get(Logger); // strict: false searches the whole container
container.select(LoggingModule).get(Logger); // lookup from one module (strict by default)
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
