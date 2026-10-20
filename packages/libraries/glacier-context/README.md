# @glacier/context

Private, native ESM, **Node-only** typed ambient context built on `node:async_hooks` `AsyncLocalStorage`, with zero
runtime dependencies. It carries per-request values (trace id, user, tenant) through async code without parameter
threading, so singletons can read them without becoming request-scoped. It does not depend on `@glacier/ioc`.

## Public API

Only the package root is exported (`"."`); there are no subpaths.

| Kind    | Exports                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Runtime | `ContextKey`, `GlacierContext`, `ContextError`, `ContextNotActiveError`, `ContextValueMissingError`, `DuplicateContextKeyError` |
| Types   | `IContextEntry`, `IContextErrorOptions`                                                                                         |

- `ContextKey.create<T>(description)` creates a typed key. Identity is the instance; the description is for
  diagnostics only, so equal descriptions never collide. `key.with(value)` pairs it with a value of type `T`.
- `GlacierContext.run(entries, callback)` runs `callback` with the entries layered over the current context and
  returns its result unchanged (sync or promise). Layers are immutable: nested runs inherit and shadow, the parent is
  never mutated, and there is no `set`. Repeating a key in one call throws `DuplicateContextKeyError`.
- `GlacierContext.get(key)` throws `ContextNotActiveError` outside a `run` and `ContextValueMissingError` when the
  key is unset. `GlacierContext.tryGet(key)` returns `undefined` in both cases. `GlacierContext.isActive()` reports
  whether a `run` is in effect.
- Values are stored as given, with no cloning or freezing; treat them as immutable by convention.

## Usage: passing a trace id to a client

```ts
import { ContextKey, GlacierContext } from "@glacier/context";

export const TraceIdKey = ContextKey.create<string>("traceId");

export function handleRequest(request: IncomingRequest): Promise<Response> {
  const traceId = request.headers["x-trace-id"] ?? crypto.randomUUID();
  return GlacierContext.run([TraceIdKey.with(traceId)], () => orders.load(request.params.id));
}

export class PaymentsClient {
  public charge(amount: number): Promise<ChargeResult> {
    return this.#http.post("/charges", {
      headers: { "x-trace-id": GlacierContext.get(TraceIdKey) },
      body: { amount },
    });
  }
}
```

## Testing

Use `GlacierContext.run` as the test entry point: wrap the code under test in a `run` with the entries it needs.
