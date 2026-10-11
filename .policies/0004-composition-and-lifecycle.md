# 0004 — Composition and lifecycle

1. Every microservice and frontend application MUST start through `src/Application.bootstrap.ts`. This entry MUST contain only minimal delegation to composition/startup, not use cases, adapter implementations, or substantial lifecycle logic.
2. Supporting application composition/lifecycle coordination MUST remain outside the entry and capabilities, in `src/bootstrap/` when needed. Frontend React mounting and JSX-containing UI composition MUST live in presentation code invoked by the `.ts` entry or its helpers.
3. Applications MUST explicitly select implementations and register modules/providers initially. Future decorator convenience requires a later decision and MUST NOT introduce framework dependencies into consumer domain/application code.
4. Libraries MUST NOT have a bootstrap entry or `bootstrap/` layer; importing a library MUST NOT start resources. Libraries needing integration/resource management MUST expose factories, registration functions, or explicit lifecycle operations in their public API for application invocation. A library without such responsibilities MUST NOT manufacture resource management.
5. Resource construction MUST be separate from resource startup. Application composition MUST coordinate startup and cleanup of already-started resources after partial failure. Shutdown MUST respect dependencies so dependents stop before their dependencies. Startup, cleanup, and shutdown failures MUST remain observable, not swallowed.
6. Exact lifecycle APIs, concurrency, and timeout policies remain unspecified; contributors MUST NOT treat a particular API, concurrency model, or timeout value as an established requirement.

Provenance: ADR-0002; Backend Microservice/Library and Frontend Application/Library Rules.
