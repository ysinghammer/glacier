---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0002: Package architecture

## Context

A shared architectural convention is needed for backend
services, frontend applications, and framework and UI libraries, without prescribing a speculative package inventory.

Hexagonal architecture separates capability-owned concepts and rules, application orchestration, and external
integrations. Its defining property is inward dependency direction, not a complete folder skeleton. Capability-first
organization keeps related behavior together; organizing the entire application by technical layer would obscure
ownership.

Frontend code follows the same dependency model, but uses `presentation/` for React components and hooks rather than
naming them inbound infrastructure adapters. A capability does not necessarily need a domain, an operation does not
necessarily need an inbound interface, and a library does not necessarily need resource management. Requiring all layers
or a port for every interaction would introduce unnecessary abstractions.

Applications need explicit composition and startup; libraries need a deliberately curated public API rather than their
own bootstrap. A single library barrel is chosen over public subpath exports.
The [techstack decision](ADR-0001-Techstack.md) remains binding, including dependency approval, application/service
testing through public UI and HTTP boundaries, and library-only Vitest testing through public package exports.
[ADR-0005](ADR-0005-Testing-strategy.md) defines test locations, full-stack orchestration, and acceptance traceability.

## Decision

### Capabilities and layers

- All project packages must organize code by capability first, then by applicable architectural layers. A capability
  must own a coherent responsibility, its concepts, behavior, rules, and any state within that responsibility.
- Capability boundaries must follow shared invariants and reasons to change rather than merely REST resources, API
  versions, database tables, or nouns. Capabilities must not be assumed to require separate services or npm packages:
  packages are distribution boundaries, and a capability can span packages.
- Applications with multiple capabilities must group their layers beneath capability directories in `src/`. A
  single-capability library must place its applicable layers directly beneath `src/`; a library containing multiple
  capabilities must group them by capability.
- Existing layers must use the following paths. Unneeded layers must be omitted rather than populated with artificial
  entities, aggregates, repositories, or interfaces.

| Path                                | Responsibility                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `domain/`                           | Capability-owned concepts, invariants, and policies.                                                 |
| `application/`                      | Use cases coordinating domain behavior.                                                              |
| `application/ports/inbound/`        | Optional contracts for invoking application operations.                                              |
| `application/ports/outbound/`       | Contracts for external capabilities the application needs.                                           |
| `infrastructure/adapters/inbound/`  | HTTP controllers, CLI commands, and message consumers.                                               |
| `infrastructure/adapters/outbound/` | Persistence, external API, environment, and other integration implementations.                       |
| `presentation/`                     | Frontend React components, hooks, and rendering-specific behavior.                                   |
| `bootstrap/`                        | Application-level supporting composition and lifecycle coordination, outside capability directories. |

### Dependency direction and ports

- Application code must depend inward on domain code, not on infrastructure, presentation, or bootstrap. Infrastructure
  and presentation must depend on the application operations and domain contracts they serve, not the reverse.
- Domain code must remain independent of React, Glacier framework facilities, transport and persistence implementations,
  and environment access. Application code must also remain technology-independent; external I/O must be accessed
  through owned ports, not concrete clients or framework facilities.
- Inner layers may use pure supporting libraries and deliberate public domain/application APIs consistent with these
  rules. Such use must still follow dependency approval under ADR-0001.
- Ports must belong to the layer that needs them. Application-owned ports must use the paths above; genuinely
  domain-owned contracts must live in `domain/`. Inbound interfaces must not be required when direct application
  invocation suffices.
- Frontend React components and hooks must live in `presentation/`. Rendering-only state must stay there; capability
  rules and application orchestration must not be moved into hooks merely because the caller is React. HTTP and
  browser-storage integrations must be implemented as outbound adapters.
- Framework libraries must treat their own concepts and rules as their domain where applicable, without requiring
  traditional business entities. Consumer business domains must remain independent of those frameworks; adapters and
  application composition must connect them.

### Public APIs and shared ownership

- Cross-capability dependencies must be deliberate and acyclic, including between capabilities inside one npm package.
  Consumers must use explicitly public APIs rather than importing another capability's internal files.
- Domain/application consumers must use only compatible public domain/application contracts and operations. Replaceable
  external behavior must use a consumer-owned port when direct consumption would couple the consumer to an
  implementation.
- Adapters and application composition may use explicitly exposed concrete integration APIs where required to connect
  implementations. Presentation may consume another capability's explicitly public components or hooks for intentional
  UI reuse; domain and application must not consume presentation APIs.
- Each library must expose its public imports through a package-root `index.ts`, outside `src/`. Its `package.json`
  export map must expose only the package-root entry and must prohibit deep imports and public subpaths. Required
  adapter factories and registration functions must be exported through the same barrel.
- Library unit tests must consume this public root API, not internal files. All public exports must meet ADR-0005's
  library testing and coverage requirements; internal symbols must not be exported solely to make them testable.
- Public capability APIs within an application must be explicitly identified and curated as well; package exports alone
  must not be treated as protection for boundaries inside a package.
- Shared concepts must be extracted into a small shared kernel only when their semantics and ownership are genuinely
  shared. Similar code with different meanings must remain separate rather than being placed in a general shared bucket.
- Repositories must remain owned by their capability. Cross-capability consumers must use public query operations or
  their own ports, not a global repository folder granting access to every capability's persistence. Separate consumer
  ports must not be assumed to require duplicate database implementations. Shared database connections and transaction
  infrastructure must not imply shared repository ownership.

### Application composition and lifecycle

- Every microservice and frontend application must start through `src/Application.bootstrap.ts`. This file must contain
  only the minimal code needed to delegate composition and start the application, not use cases, adapter
  implementations, or substantial lifecycle logic.
- Supporting application composition and lifecycle coordination must live outside that entry file, in `src/bootstrap/`
  when needed. Frontend React mounting and JSX-containing UI composition must live in presentation code invoked by the
  `.ts` entry or its composition helpers.
- Applications must explicitly select implementations and register modules/providers initially. A future decorator
  convenience mechanism must be subject to a later decision and must not introduce framework dependencies into consumer
  domain/application code.
- Libraries must not have a bootstrap entry or `bootstrap/` layer. Importing a library must not start resources.
  Libraries needing integration or resource management must expose factories, registration functions, or explicit
  lifecycle operations through their public barrel for the application to invoke.
- Resource construction must be separate from resource startup. Application composition must coordinate startup, cleanup
  of already-started resources after partial failure, and dependency-aware shutdown so dependents stop before their
  dependencies. Failures must be observable rather than swallowed.

### Adoption

- Changes must be reviewed for conformance with these boundaries and applicable paths before acceptance, alongside all
  other active ADRs. Automated import-boundary tooling is deferred until code and tooling exist.
- Functional verification must follow ADR-0005: applications and services must be tested through public UI/HTTP
  boundaries, and libraries must use Vitest through public package exports with the required 100% coverage.
  The library exception must not authorize isolated application/service unit tests or internal service integration tests.

## Consequences

Backend and frontend packages share ownership and dependency rules while retaining an explicit frontend presentation
layer. Optional layers avoid ceremony for small capabilities and rendering-only libraries.

Technology-independent inner layers require explicit adapters and composition. A single public library barrel requires
deliberate export curation and prevents public subpath APIs. Capability APIs within an application still need review
because a package export map cannot enforce those internal boundaries.

Minimal application entries keep startup discoverable without making them containers for lifecycle implementation.
Libraries can provide integration behavior without starting themselves.

Framework package names such as `core`, `container`, `config`, `boot`, `http`, and `http-node` remain illustrative, not
a required inventory. Exact lifecycle APIs, concurrency, timeout policies, and future automated boundary checks remain
unspecified.

## Related notes

- [Code-style conventions](../../Engineering/Code%20Style/Overview.md)
- [Architecture index](../Index.md)
- [ADR-0001: Techstack](ADR-0001-Techstack.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
