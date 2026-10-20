# @glacier/logger

Private, native ESM structured logger for Node and browsers. Provides levels, entries, `LoggerFactory`, `Logger`,
safe serialisation and the JSON and pretty formatters. Real transports follow in a later phase; see `.plan/`.

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

## Layout (policy 0003)

`src/logging/`, `src/serialization/` and `src/formatting/` are the capabilities so far. `formatting` reads the public
`ILogEntry` contract of `logging` and uses `serialization` for safety.

- `domain/`: levels, reserved keys, bindings invariants, call and entry types, entry normalisation. No I/O.
- `application/`: `LoggerFactory`, `Logger`, configuration validation, outcomes and errors.
- `application/ports/outbound/`: consumer-owned `ITransport`, `IEntryFormatter` and `IClock`. Adapters arrive in
  later phases.
- Type names for string-literal unions use the `I` prefix (`ILogLevel`).
