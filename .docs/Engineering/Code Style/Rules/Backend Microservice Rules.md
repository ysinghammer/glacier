# Backend microservice rules

Apply the [general rules](General%20Rules.md) and [package architecture ADR](../../../Architecture/Decisions/ADR-0002-Package-architecture.md).

Group layers beneath capabilities, with application-wide composition outside them. The following paths illustrate responsibilities, not a required capability inventory or complete folder skeleton:

```text
src/
  Application.bootstrap.ts
  bootstrap/
  orders/
    domain/
    application/
      ports/
        outbound/
    infrastructure/
      adapters/
        inbound/
        outbound/
  catalog/
    domain/
    application/
    infrastructure/
```

- Always start the service through minimal `src/Application.bootstrap.ts`. Delegate substantial composition and lifecycle logic to supporting code in `src/bootstrap/`.
- Explicitly select and register modules/providers. Separate resource construction from startup; clean up already-started resources after failure and stop dependents before their dependencies. Surface failures.
- Put HTTP controllers and message consumers in inbound adapters, use-case orchestration in application, and persistence and external clients in outbound adapters.
- Expose deliberate capability APIs for other capabilities; do not give them access to private repositories or adapter internals.
- Verify behavior through the public HTTP API of a real running service, following [ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md).
