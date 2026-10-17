# @glacier/ioc

Private, native ESM dependency-injection foundation built on [`@glacier/reflection`](../glacier-reflection/README.md).
It delivers tokens, the container error hierarchy, the `@Injectable`/`@Inject`/`@Optional` decorators with
readable metadata, the four provider kinds and a minimal `GlacierContainer` resolving DEFAULT-scope singletons.
Modules, scopes, async providers and lifecycle follow in later stories.

## Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.
The root exports **29 symbols: 15 runtime values and 14 type-only exports**.

| Kind    | Exports                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime | `InjectionToken`, `Injectable`, `Inject`, `Optional`, `InjectionMetadata`, `ContainerError`, `UnknownDependencyError`, `CircularDependencyError`, `InvalidScopeError`, `InvalidProviderError`, `ContextIdMisuseError`, `UseAfterCloseError`, `AggregateContainerError`, `GlacierContainer`, `Providers` |
| Types   | `IToken`, `ITokenReference`, `IProviderScope`, `IInjectableOptions`, `IConstructorDependency`, `IContainerErrorOptions`, `IContainerRoot`, `IProvider`, `IClassProvider`, `IValueProvider`, `IFactoryProvider`, `IExistingProvider`, `IInjectedValues`, `IClassConstructor`                             |

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
Until `@Module` arrives, `GlacierContainer.create({ providers })` takes a single flat provider list and validates
every provider shape, class metadata and scope up front, throwing one `AggregateContainerError`. Only DEFAULT
scope is accepted for now. `get(token)` constructs lazily and shares one instance per token; a later provider
for the same token replaces an earlier one.

```ts
const url = new InjectionToken<string>("url");
const container = GlacierContainer.create({
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
});
container.get(OrderService); // OrderService, built once
```

`Providers.factory` infers the `inject` tuple so mismatched factory parameters fail to compile; a plain object
literal in the `providers` array is only loosely typed. A missing dependency throws `UnknownDependencyError`
with the path (`OrderService -> OrderRepository -> Connection`) unless the parameter is `@Optional`;
cycles throw `CircularDependencyError`.

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
