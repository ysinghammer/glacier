# Scenario index

| Capability                               | Purpose and value                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [logging](logging/README.md)             | Validates configuration, creates context-bound loggers and writes normalised, filtered and routed entries to transports.      |
| [serialization](serialization/README.md) | Turns any logged value and error into safe plain data and censors configured paths, so a log call never throws or leaks.      |
| [formatting](formatting/README.md)       | Renders entries as one JSON line or a readable, optionally coloured pretty layout for Node and the browser, safely.           |
| [transports](transports/README.md)       | Delivers entries to Node stdout and files with buffering, to the browser console, and reports delivery failures to `onError`. |
