# Formatting

Turns a log entry into the text or styled output a destination shows: one JSON line for machines, and a readable
pretty layout for people on Node (ANSI colour) and in the browser (`%c` styling). Formatting never throws on hostile
data and is deterministic. Public contract: `JsonEntryFormatter`, `PrettyEntryFormatter`, `IPrettyFormatterOptions`,
`IStyledOutput` and the `isColorEnabled` transport registration option, all from the package-root API of
`@glacier/logger`. The pretty time is UTC.

| ID      | Title                | Verifies                                                                                                           | Source  | Test                                               |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------- |
| FMT-001 | JSON line shape      | One `\n`-terminated line that parses, with `level`, `time`, `context`, `message`, bindings, fields, `err` in order | phase 4 | [JsonFormatter.test.ts](JsonFormatter.test.ts)     |
| FMT-002 | JSON level and time  | The level is a name string and `time` is ISO 8601                                                                  | phase 4 | [JsonFormatter.test.ts](JsonFormatter.test.ts)     |
| FMT-003 | JSON error           | The error appears under `err` with `type`, `message`, `stack` and `cause`                                          | phase 4 | [JsonFormatter.test.ts](JsonFormatter.test.ts)     |
| FMT-004 | JSON hostile data    | Cyclic values, `BigInt` and an invalid time do not break the formatter; the same entry formats identically         | phase 4 | [JsonFormatter.test.ts](JsonFormatter.test.ts)     |
| FMT-005 | Pretty layout        | `HH:mm:ss.SSS LEVEL [context] message` with bindings and fields; nested values are indented                        | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
| FMT-006 | Pretty multi-line    | Message continuation lines indent four spaces; multi-line field values open an indented block                      | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
| FMT-007 | Pretty error         | Stack, extra properties and the cause chain follow on indented lines                                               | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
| FMT-008 | Pretty determinism   | The same entry gives identical output; cyclic values, `BigInt` and an invalid time do not break it                 | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
| FMT-009 | Node colour          | With colour enabled the output has ANSI codes, one colour per level; with colour disabled it has none              | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
| FMT-010 | Browser `%c` styling | A `%c` format string with one style per directive; no `%c` without colour; literal `%` is escaped                  | phase 4 | [PrettyFormatter.test.ts](PrettyFormatter.test.ts) |
