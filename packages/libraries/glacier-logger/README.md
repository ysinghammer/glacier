# @glacier/logger

Private, native ESM structured logger for Node and browsers. Phase 2 provides the core: levels, entries,
`LoggerFactory` and `Logger`. Serialisation, formatters and real transports follow in later phases; see `.plan/`.

Single public entry `"."` with conditional exports: `browser` resolves to `dist/index.browser.js`, everything else
to `dist/index.js`.

## Usage

```ts
import { LoggerFactory } from "@glacier/logger";
import type { ITransport } from "@glacier/logger";

const transport: ITransport = { write: (entry) => console.log(entry) };

const factory = new LoggerFactory({
  level: "info",
  bindings: { service: "billing" },
  transports: [{ transport, format: "json" }],
});

const created = factory.createLogger("UserService");
if (created.outcome === "created") {
  const logger = created.logger.child({ requestId: "r-1" });
  logger.info({ message: "user created", userId: 42 });
  logger.error({ err: new Error("lookup failed"), userId: 42 });
}

await factory.flush();
```

- `LoggerFactory.create(config)` returns `{ outcome: "created", factory }` or `{ outcome: "rejected", reasons }`;
  `new LoggerFactory(config)` throws `InvalidLoggerConfigurationError`.
- `createLogger(context, { bindings? })` rejects an empty context and empty or reserved binding keys.
- Every call takes one object: `{ message, ...fields }` or `{ err, message?, ...fields }`. The reserved keys
  `message`, `err`, `level`, `time` and `context` cannot be used as fields or bindings.
- Entries merge factory bindings, context, child bindings, then call fields. The global level filters first, then each
  transport's own minimum `level` routes.
- Pass `clock: { now(): Date }` to control `time` in tests.

## Layout (policy 0003)

`src/logging/` is the only capability so far.

- `domain/`: levels, reserved keys, bindings invariants, call and entry types, entry normalisation. No I/O.
- `application/`: `LoggerFactory`, `Logger`, configuration validation, outcomes and errors.
- `application/ports/outbound/`: consumer-owned `ITransport`, `IEntryFormatter` and `IClock`. Adapters arrive in
  later phases.
- Type names for string-literal unions use the `I` prefix (`ILogLevel`).
