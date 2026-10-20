# Serialization

Makes every logged value safe: bindings, fields and errors reach transports as plain, JSON-safe data, and
configured paths are censored on a copy before that. A log call never throws because of bad data, and a failing
redaction never lets the raw value through. Public contract: the `redact` configuration of `LoggerFactory`, the
`ILogEntry` bindings, fields and `error` (`ISerializedError`) that transports receive, and
`InvalidLoggerConfigurationError` for malformed redact paths, all from the package-root API of `@glacier/logger`.

| ID      | Title                | Verifies                                                                                                            | Source  | Test                                   |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------- |
| SER-001 | Circular references  | A circular object serialises with `"[Circular]"` at the cycle; shared non-cyclic references stay whole              | phase 3 | [Values.test.ts](Values.test.ts)       |
| SER-002 | Unusual values       | `BigInt` becomes a string, a throwing `toJSON` a placeholder; dates, maps, sets, typed arrays and symbols are plain | phase 3 | [Values.test.ts](Values.test.ts)       |
| SER-003 | Cause depth          | An error cause chain deeper than five levels truncates with `"[Max depth]"`; non-`Error` causes serialise as values | phase 3 | [Errors.test.ts](Errors.test.ts)       |
| SER-004 | Error properties     | `{ type, message, stack, cause }` plus own enumerable properties such as `code`; canonical fields win collisions    | phase 3 | [Errors.test.ts](Errors.test.ts)       |
| SER-005 | Exact-path redaction | `redact: ["password"]` censors the field; a nested path censors only that value; the censor is configurable         | phase 3 | [Redaction.test.ts](Redaction.test.ts) |
| SER-006 | Redaction on copies  | A missing path is a no-op and the caller's data, frozen or not, is never mutated                                    | phase 3 | [Redaction.test.ts](Redaction.test.ts) |
| SER-007 | Path validation      | A malformed redact path is rejected when the factory is created                                                     | phase 3 | [Redaction.test.ts](Redaction.test.ts) |
| SER-008 | Redaction failure    | A getter that throws on a redacted path, or an unreadable step, yields the censor, never the raw value or a throw   | phase 3 | [Redaction.test.ts](Redaction.test.ts) |
| SER-009 | Hostile data         | A call with cyclic objects, throwing getters and throwing `toJSON` does not throw                                   | phase 3 | [Values.test.ts](Values.test.ts)       |
