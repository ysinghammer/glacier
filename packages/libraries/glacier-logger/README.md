# @glacier/logger

Private, native ESM structured logger for Node and browsers, with zero runtime dependencies. JSON-first, with a
pretty formatter, pluggable transports, safe serialisation and path redaction. No DI container, no global singleton and
no default logger: the consumer's composition root builds the `LoggerFactory`.

Single public entry `"."` with conditional exports: `browser` resolves to `dist/index.browser.js` (platform-neutral API
plus `BrowserConsoleTransport`), everything else to `dist/index.js` (platform-neutral API plus `NodeStdoutTransport`
and `NodeFileTransport`). Node-only transports are not exported to browsers. There are no subpaths.

## Usage

Build the factory once in a DI provider and register it. The example is container-agnostic: register the returned
instance under the `LoggerFactory` class with whatever container you use.

```ts
import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "@glacier/logger";

export function provideLoggerFactory(): LoggerFactory {
  return new LoggerFactory({
    level: "info",
    bindings: { service: "billing" },
    transports: [
      {
        transport: new NodeStdoutTransport(),
        format: "pretty",
        isColorEnabled: process.stdout.isTTY,
      },
      { transport: new NodeFileTransport({ path: "logs/app.log" }), level: "warn", format: "json" },
    ],
  });
}

// container.register(LoggerFactory, provideLoggerFactory());
```

A consumer injects `LoggerFactory` by class and creates one logger per context. The factory itself cannot log.

```ts
import { LoggerFactory } from "@glacier/logger";

export class UserService {
  private readonly logger;

  constructor(factory: LoggerFactory) {
    const created = factory.createLogger("UserService");
    if (created.outcome === "rejected") {
      throw new Error(created.reasons.map((reason) => reason.message).join(", "));
    }
    this.logger = created.logger;
  }

  create(userId: number): void {
    const logger = this.logger.child({ requestId: "r-1" });
    logger.info({ message: "user created", userId });
    logger.error({ err: new Error("lookup failed"), userId });
  }
}
```

- `LoggerFactory.create(config)` returns `{ outcome: "created", factory }` or `{ outcome: "rejected", reasons }`;
  `new LoggerFactory(config)` throws `InvalidLoggerConfigurationError`.
- `createLogger(context, { bindings? })` rejects an empty context and empty or reserved binding keys.
- Every call takes one object: `{ message, ...fields }` or `{ err, message?, ...fields }`. The reserved keys
  `message`, `err`, `level`, `time` and `context` cannot be used as fields or bindings.
- Entries merge factory bindings, context, child bindings, then call fields. The global level filters first, then each
  transport's own minimum `level` routes.
- Pass `clock: { now(): Date }` to control `time` in tests.

## Formatters

```ts
import { JsonEntryFormatter, PrettyEntryFormatter } from "@glacier/logger";

const json = new JsonEntryFormatter().format(entry); // one line ending in "\n"

// Node: ANSI colour only when `isColorEnabled` is true, so decide it from your TTY check.
const pretty = new PrettyEntryFormatter({ isColorEnabled: process.stdout.isTTY });
process.stdout.write(`${pretty.format(entry)}\n`);

// Browser: a `%c` format string plus one style argument per directive.
const { format, styles } = pretty.formatStyled(entry);
console.log(format, ...styles);
```

- JSON key order: `level`, `time` (ISO 8601), `context`, `message`, bindings, fields, then `err`
  (`{ type, message, stack, cause }`). Cyclic values, `BigInt` and throwing getters never break formatting.
- Pretty layout: `HH:mm:ss.SSS LEVEL [context] message` (time in UTC), then bindings and fields one per line,
  then the error. Indentation is two spaces per level.
  - A nested object or array (items keyed `0`, `1`, ...) opens `key:` and indents its children one level.
  - Empty containers print `{}` or `[]`. A multi-line string value opens `key:` and indents each line one level.
  - Continuation lines of a multi-line message indent four spaces.
  - The error prints as `err: <stack>` with stack lines, extra properties and `cause` one level deeper, recursively.
- Level colours live in one place (`OutputPalette`) and serve both ANSI and CSS output. With colour off there are no
  escape codes and no `%c`; literal `%` is escaped as `%%` in browser output.
- `ITransportRegistration.isColorEnabled` carries the colour decision to the transport (default: no colour).

## Configuration

```ts
import { LoggerFactory, NodeStdoutTransport } from "@glacier/logger";
import type { ILoggerConfiguration } from "@glacier/logger";

const configuration: ILoggerConfiguration = {
  level: "debug", // global minimum: trace, debug, info, warn, error, fatal
  bindings: { service: "billing" }, // merged into every entry
  redact: { paths: ["password", "user.token"], censor: "[Redacted]" }, // exact paths, no wildcards
  onError: (error) => process.stderr.write(`logger failure: ${error.message}\n`),
  transports: [
    { transport: new NodeStdoutTransport(), level: "info", format: "pretty" }, // per-transport minimum and format
  ],
};

const created = LoggerFactory.create(configuration); // typed outcome instead of an exception
```

- The global `level` filters first, then each transport's own minimum `level` routes. There are no per-context levels.
- Without `onError`, delivery failures print one line to `stderr` (Node) or `console.error` (browser).
- Transport and `onError` failures are never thrown to the logging caller.

## Custom transports

Implement `ITransport`. `write` receives the entry and a delivery that renders it in the registered format.

```ts
import type { ILogEntry, ITransport, ITransportDelivery } from "@glacier/logger";

export class MemoryTransport implements ITransport {
  readonly lines: string[] = [];

  write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.lines.push(delivery.text());
  }

  async flush(): Promise<void> {}
}
```

## Flushing and rotation

Node transports buffer (4 KB or 100 ms, configurable) and flush on `beforeExit` and on `SIGINT`/`SIGTERM`. Await
`factory.flush()` in tests and before a serverless handler returns, so no line is lost:

```ts
import type { LoggerFactory } from "@glacier/logger";

export async function handler(factory: LoggerFactory): Promise<void> {
  // ... log ...
  await factory.flush();
}
```

`NodeFileTransport` is append-only, creates parent directories and never rotates. Rotate with logrotate or the platform.

## Out of scope

AsyncLocalStorage context, custom levels, `silent`, file rotation, worker-thread transports, benchmarks, a JSON-string
console mode, a DI container, nested contexts, per-context levels and wildcard redaction.

## Layout (policy 0003)

`src/logging/`, `src/serialization/`, `src/formatting/` and `src/transports/` are the capabilities. `formatting` reads
the public `ILogEntry` contract of `logging` and uses `serialization` for safety; `transports` depends on `formatting`.

- `domain/`: levels, reserved keys, bindings invariants, call and entry types, formatters, serialisation. No I/O.
- `application/`: `LoggerFactory`, `Logger`, configuration validation, outcomes, errors, buffering.
- `application/ports/outbound/`: consumer-owned contracts such as `ITransport`, `IEntryFormatter` and `IClock`.
- `infrastructure/adapters/outbound/`: Node stdout and file transports and the browser console transport.
- Type names for string-literal unions use the `I` prefix (`ILogLevel`).
