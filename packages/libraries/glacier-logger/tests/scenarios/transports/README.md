# Transports

Delivers formatted entries to where logs are read: buffered Node `stdout` and append-only files, and the browser
console, with automatic flushing and failure reporting. A delivery failure never reaches the logging caller; it goes to
`onError`. Public contract: `ITransport`, `ITransportDelivery`, `TransportFailureError`, `IDiagnosticsOutput`,
`LoggerFactory.flush()` and the `onError` and `diagnostics` configuration options of the package-root API of
`@glacier/logger`.

| ID      | Title                  | Verifies                                                                                                                           | Source  | Test                                                               |
| ------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ |
| TRN-001 | Timer flush            | Lines below the threshold are not written until the 100 ms timer fires; `flush()` writes them immediately                          | phase 5 | [StdoutTransport.test.ts](StdoutTransport.test.ts)                 |
| TRN-002 | Size flush             | Reaching the byte limit (4 KB by default, counted in bytes) writes without waiting for the timer                                   | phase 5 | [StdoutTransport.test.ts](StdoutTransport.test.ts)                 |
| TRN-003 | Order and backpressure | Line order is preserved across flushes and the next write waits until the stream confirmed the previous one                        | phase 5 | [StdoutTransport.test.ts](StdoutTransport.test.ts)                 |
| TRN-004 | File transport         | Missing parent directories are created and an existing file is appended to, with a fake and the real file system                   | phase 5 | [FileTransport.test.ts](FileTransport.test.ts)                     |
| TRN-005 | File failure           | A failing file write is reported to `onError` and the log call does not throw                                                      | phase 5 | [FileTransport.test.ts](FileTransport.test.ts)                     |
| TRN-006 | Exit flushing          | `beforeExit` and `SIGINT`/`SIGTERM` flush pending lines, handlers exist only while work is pending, and the signal is raised again | phase 5 | [ExitFlushing.test.ts](ExitFlushing.test.ts)                       |
| TRN-007 | Factory flush          | `factory.flush()` drains every transport once, resolves only when they finish, and reports failing flushes to `onError`            | phase 5 | [TransportContract.test.ts](TransportContract.test.ts)             |
| TRN-008 | Browser console        | Levels map to console methods, `json` passes the entry object and `pretty` passes the styled string with its styles                | phase 5 | [BrowserConsoleTransport.test.ts](BrowserConsoleTransport.test.ts) |
| TRN-009 | Throwing `onError`     | A throwing `onError` causes no loop and no unhandled rejection; the failure falls back to one diagnostics line                     | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)               |
| TRN-010 | Third-party transport  | A custom `ITransport` registered through configuration receives entries meeting its minimum level                                  | phase 5 | [TransportContract.test.ts](TransportContract.test.ts)             |
| TRN-011 | Fan-out                | Per-transport `level` and `format` route pretty to stdout at `debug`+ and JSON to a file at `warn`+                                | phase 5 | [FanOut.test.ts](FanOut.test.ts)                                   |
| TRN-012 | Default `onError` line | Without `onError` one line goes to `stderr` (Node) or `console.error` (browser), with no stack                                     | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)               |
| TRN-013 | Failures stay hidden   | A throwing transport is reported to `onError` wrapped in `TransportFailureError` and never throws to the logging caller            | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)               |
| TRN-014 | Option validation      | Buffering options that are not positive integers, an empty file path and a missing Node process are rejected at construction       | phase 5 | [StdoutTransport.test.ts](StdoutTransport.test.ts)                 |
| TRN-015 | Stdout transport       | Pretty and JSON lines reach `stdout` through the buffer; a failing stream write goes to `onError`                                  | phase 5 | [StdoutTransport.test.ts](StdoutTransport.test.ts)                 |
