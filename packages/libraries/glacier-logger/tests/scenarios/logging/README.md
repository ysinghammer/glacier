# Logging

Lets an application build one `LoggerFactory` from a validated configuration, create a `Logger` per context, and
write structured entries that are filtered by a global level and routed to transports by their own minimum level.
The factory cannot log. Public contract: `LoggerFactory`, `Logger`, `InvalidLoggerConfigurationError`,
`InvalidBindingsError` and the configuration, entry, call and transport types of the package-root API of
`@glacier/logger`. Type contracts live in [PublicApi.test-d.ts](../../contracts/PublicApi.test-d.ts).

| ID      | Title                    | Verifies                                                                                                  | Source  | Test                                                       |
| ------- | ------------------------ | --------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| LOG-010 | Create outcome           | `create` returns `created`, or `rejected` with reasons for no transports, bad level, reserved binding key | phase 2 | [Configuration.test.ts](Configuration.test.ts)             |
| LOG-011 | Constructor failure      | `new LoggerFactory(invalid)` throws `InvalidLoggerConfigurationError` keeping the reasons                 | phase 2 | [Configuration.test.ts](Configuration.test.ts)             |
| LOG-012 | Logger creation          | An empty context or reserved binding is rejected; a valid context returns a `Logger`                      | phase 2 | [LoggerCreation.test.ts](LoggerCreation.test.ts)           |
| LOG-013 | Factory cannot log       | `LoggerFactory` has no log methods and `logger.info("text")` is a compile error                           | phase 2 | [PublicApi.test-d.ts](../../contracts/PublicApi.test-d.ts) |
| LOG-014 | Level filter and routing | Nothing below the global level is written; transports receive entries meeting their own minimum           | phase 2 | [Routing.test.ts](Routing.test.ts)                         |
| LOG-015 | Reserved call keys       | Reserved keys in call fields are compile errors; `{ err }` without `message` compiles                     | phase 2 | [PublicApi.test-d.ts](../../contracts/PublicApi.test-d.ts) |
| LOG-016 | Distinct contexts        | Loggers with different contexts write distinct `context` values                                           | phase 2 | [LoggerCreation.test.ts](LoggerCreation.test.ts)           |
| LOG-017 | Merge order              | Factory bindings, context, child bindings, call fields; later layers cannot override reserved keys        | phase 2 | [Entries.test.ts](Entries.test.ts)                         |
| LOG-018 | Child loggers            | `child` keeps the context, merges bindings and does not mutate the parent                                 | phase 2 | [Entries.test.ts](Entries.test.ts)                         |
