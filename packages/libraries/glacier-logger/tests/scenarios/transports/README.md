# Transports

Delivers formatted entries to where logs are read: buffered Node `stdout` and append-only files, and the browser
console, with automatic flushing and failure reporting. A delivery failure never reaches the logging caller; it goes to
`onError`. Public contract: `ITransport`, `ITransportDelivery`, `TransportFailureError`, `IDiagnosticsOutput`,
`LoggerFactory.flush()` and the `onError` and `diagnostics` configuration options of the package-root API of
`@glacier/logger`.

| ID      | Title                  | Verifies                                                                                                                | Source  | Test                                                   |
| ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| TRN-007 | Factory flush          | `factory.flush()` drains every transport once, resolves only when they finish, and reports failing flushes to `onError` | phase 5 | [TransportContract.test.ts](TransportContract.test.ts) |
| TRN-009 | Throwing `onError`     | A throwing `onError` causes no loop and no unhandled rejection; the failure falls back to one diagnostics line          | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)   |
| TRN-010 | Third-party transport  | A custom `ITransport` registered through configuration receives entries meeting its minimum level                       | phase 5 | [TransportContract.test.ts](TransportContract.test.ts) |
| TRN-012 | Default `onError` line | Without `onError` one line goes to `stderr` (Node) or `console.error` (browser), with no stack                          | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)   |
| TRN-013 | Failures stay hidden   | A throwing transport is reported to `onError` wrapped in `TransportFailureError` and never throws to the logging caller | phase 5 | [FailureReporting.test.ts](FailureReporting.test.ts)   |
