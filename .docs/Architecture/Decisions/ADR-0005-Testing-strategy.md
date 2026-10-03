---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0005: Testing strategy

## Context

[ADR-0001](ADR-0001-Techstack.md) selects Vitest for libraries and container-backed Playwright for applications and
services. [ADR-0002](ADR-0002-Package-architecture.md) requires library tests to consume the curated package-root API.
This decision defines test ownership, execution, and acceptance scenarios within those boundaries. The acceptance
criteria lifecycle, catalog, and story-plan traceability are defined by [ADR-0007](ADR-0007-Acceptance-catalog.md).

Libraries provide technical APIs and need exhaustive public-contract unit tests. Applications and services must be
verified as a complete running system, not as isolated packages or internal integration points. Technical library
scenarios therefore differ from the shared real-world acceptance scenarios used for the application stack.

A fresh full stack per invocation is chosen over a stack per scenario to limit startup cost. Independent scenario
data avoids ordered tests and shared mutable fixtures.

## Decision

### Test ownership and boundaries

- All test code must use TypeScript and follow the applicable code and package conventions in ADR-0001 through
  ADR-0004.
- Each library must keep its Vitest unit tests and test-owned fixtures/helpers in its package-local `tests/`
  directory. This rule must apply to backend, frontend, and technology-independent libraries.
- All Playwright application/service tests, fixtures, acceptance data, and orchestration helpers must live in the
  workspace-root `tests/` directory. Frontend application and backend service packages must not contain local test
  suites or test fixtures, and must not use Vitest or other isolated unit/integration suites.
- Playwright tests must exercise only the running system's public frontend UI and public backend HTTP APIs.
  They must not import project production code, including application/service code, shared libraries, or implementation
  types, inspect source or private runtime state, access databases or caches directly, or invoke internal integration
  points.
- Playwright tests must not mock dependencies or behavior, use fake service implementations, or intercept requests to
  fabricate responses. Test-owned helpers, data definitions, and assertions must remain allowed without importing
  production implementations.
- Test scenarios and assertions must express documented user requirements and public contracts rather than internal
  implementation details. Developers may review source for development and debugging; that access must not introduce
  implementation coupling into test code or assertions. Diagnostic logs must not substitute for public-boundary
  behavioral assertions.

### Folder structure and discovery

- Workspace black-box testing must use the following layout. Capability names must be descriptive kebab-case names,
  not frontend/backend package names. Optional directories must be created only when needed, not as an empty skeleton.

```text
tests/
  playwright.config.ts
  acceptance/
    <capability>/               # Feature/API inventory, criteria, scenario declarations
    validation/                 # Catalog and discovered-test consistency checks
  scenarios/
    <capability>/
      <scenario>.spec.ts        # UI, public API, or combined acceptance scenarios
  data/
    personas/                   # Shared representative actor definitions
    datasets/
      <capability>/             # Shared deterministic business data definitions
  fixtures/                     # Scenario context and independent data setup
  drivers/
    ui/<capability>/            # Reusable public UI interactions
    api/<capability>/           # Reusable public HTTP interactions
  stack/                        # Invocation-wide startup, readiness, teardown
  reporting/                    # Acceptance mapping and execution result reporting
  artifacts/
    <run-id>/
      playwright-report/
      test-results/             # Traces, screenshots, and other test attachments
      acceptance-report/
      stack-logs/
```

- Playwright specs must be grouped by the capability whose user outcome they verify. UI, API, and combined journeys
  must remain together, including journeys crossing several capabilities; suites must not be split first by interface
  or mirror production layers.
- The catalog in `acceptance/` must declare what is required independently of executable tests in `scenarios/`.
  `drivers/` must interact only through public boundaries. `fixtures/` must manage scenario context/data and consume the
  invocation-wide stack, not start a separate stack per worker. Testcontainers lifecycle must belong to `stack/`.
- Playwright configuration must live at `tests/playwright.config.ts`. Runtime discovery must be restricted to
  `tests/scenarios/**/*.spec.ts`; catalog declarations, validation, data, fixtures, drivers, orchestration, and reporting
  must not be discovered as runtime tests.
- Each library must use the following local layout. Runtime tests must always live under `tests/scenarios/`;
  multi-capability libraries must group them beneath public-capability directories rather than internal layers.

```text
<library>/
  vitest.config.ts
  tests/
    scenarios/
      <public-api>.test.ts       # .test.tsx when JSX is needed
      <capability>/             # Runtime test grouping for multi-capability libraries
    contracts/
      <public-contract>.test-d.ts
    data/                       # Technical input cases
    doubles/                    # Publicly injected dependency implementations
    artifacts/                  # Generated coverage and test results
```

- Library runtime discovery must be restricted to `tests/scenarios/**/*.test.ts` and `tests/scenarios/**/*.test.tsx`. Type-contract
  `.test-d.ts` files must live under `tests/contracts/` and participate in type-checking, not runtime discovery or
  production coverage. Library configuration must live at its package-root `vitest.config.ts`.
- In React libraries, component tests must be the components' `.stories.tsx` files, kept beside their components in
  `src/` under ADR-0004, and run by `@storybook/addon-vitest` as a separate Vitest browser-mode project using the
  Playwright provider. That project's discovery must be restricted to `src/**/*.stories.tsx`. Tests for hooks and for
  non-UI exports must remain `.test.ts`/`.test.tsx` files under `tests/scenarios/`; hook tests must use jsdom and
  Testing Library, not module mocking of React. Stories in frontend applications must not be discovered or run as tests.
- Authored test support must remain outside `artifacts/`. Generated outputs must be written beneath the respective
  workspace or library `tests/artifacts/`, excluded from Git and test discovery. Workspace outputs must be separated by
  invocation ID to avoid collisions; retained reports/logs must not disclose secrets.
- Test filenames must use the runner-specific suffixes authorized by ADR-0003. Supporting code must retain its existing
  naming, explicit imports, class-first behavior, and prohibition on convenience barrels.

### Library unit tests

- Library tests must import only the package-root public API, not internal files or public subpaths. Internal symbols
  must not be exported solely for testing. As the only exception, a `.stories.tsx` file may import the component it
  documents and that component's sibling files directly.
- Every public runtime export must have meaningful assertions for applicable success, failure, and boundary behavior.
  For components, those assertions must be play functions in their stories, with exempt subcomponents exercised through
  their parent's stories.
  Tests must use named technical scenarios with explicit setup, action, and expected outcomes. Libraries must not be
  required to use the application's shared business dataset or business acceptance journeys.
- Libraries must document representative usage examples for their public APIs. Examples must not substitute for
  executable tests or coverage enforcement.
- Library tests may supply test-owned dependency implementations only through injection points exposed by the public
  API. They must not mock modules, import internals, or inspect private state to force coverage.
- Vitest must use its V8 coverage provider and enforce 100% statements, branches, functions, and lines, both per library
  and per production file implementing or supporting public runtime exports. Collection must include relevant untested
  files, not just loaded modules or the public barrel. Executable paths must not be excluded or hidden with coverage
  ignore annotations to meet thresholds. Coverage from the Node and story-run browser projects must be combined for
  these thresholds.
- Type-only public exports must be verified by type-checking their public contracts. Erased types must not be described
  as runtime-covered. Passing runtime tests must not replace applicable type-checking.
- Library test tasks must collect coverage through pnpm/Turborepo locally and in CI and must fail on unmet thresholds.
  Full percentages must not substitute for assertions about observable behavior.

### Full-stack orchestration

- Every Playwright test invocation, including filtered runs, must start a fresh instance of the entire application
  stack with Testcontainers. This must include all frontend applications, backend services, and their required real
  infrastructure, such as PostgreSQL and Redis; selecting tests must not reduce the stack to a subset of packages.
- One stack must be shared by the scenarios and workers in that invocation and torn down afterward. Tests must not
  attach to an existing developer stack or require a new stack per scenario.
- The harness must build/start real application artifacts and configure their normal startup, including required
  migrations. Infrastructure orchestration must not authorize importing application internals or directly seeding
  application storage.
- Startup must use bounded readiness checks rather than fixed sleeps. Tests must run only after the entire stack is
  ready. Startup failures and timeouts must fail the invocation explicitly, retain useful diagnostics without secrets,
  and clean up resources already started. Teardown must release resources in dependency-aware order after success or
  failure; cleanup failures must remain observable.
- Dependencies that cannot run locally in containers must use real provider sandboxes, not mocks or fake servers.
  Their required credentials/configuration must be supplied securely. Missing configuration or unavailable
  dependencies must fail the run rather than skip required scenarios or produce a successful result.
- Black-box test execution must not be satisfied by Turborepo task-cache hits or other reuse of a previous test result.
  Every requested execution must actually start its fresh stack and run its selected tests.

### Acceptance scenarios and data

- The workspace Playwright suite must be organized around named real-world acceptance scenarios with explicit
  preconditions, actions, and publicly observable outcomes, rather than implementation classes or package internals.
- Scenarios must share a consistent, deterministic definition of representative personas, data, and use cases under
  workspace-root `tests/`. Each scenario must instantiate its own data with unique identities; shared definitions
  must not become shared mutable records or dependencies on another scenario's execution.
- Scenario setup, actions, and behavioral assertions must use public UI/HTTP interfaces only. Direct storage writes,
  internal seed functions, and test-only setup/reset endpoints must not be used. Authentication and authorization must
  use the real public flows.
- Scenarios must run independently, including individually and in any order. The fresh invocation stack must provide
  the initial environment, and scenario-owned identities/data must prevent interference between concurrent tests.

### Acceptance criteria and catalog

The lifecycle and structure of acceptance criteria, the acceptance catalog under `tests/acceptance/`, its validation,
and story-plan E2E traceability are defined by [ADR-0007](ADR-0007-Acceptance-catalog.md).

## Consequences

Library tests retain fast technical feedback and exhaustive runtime coverage. Using stories as component tests keeps
documentation and verification in sync, but requires a Playwright browser for library test tasks and makes story
assertions reviewable test code. Centralized application/service tests
exercise real interactions through public boundaries without coupling assertions to package structure. Separate
declarations, executable scenarios, and runtime support keep ownership and discovery explicit.

Full-stack startup increases local and CI runtime and requires a container runtime, sufficient resources, and secure
sandbox configuration. External provider outages can block acceptance. Public-interface-only data setup can be slower
and requires representative scenarios to be achievable through legitimate public flows. A stack shared per invocation
makes scenario data isolation essential.

Workspace and library scaffolding must implement the test directories,
coverage checks, Testcontainers lifecycle, uncached black-box task, and CI gates, alongside the catalog validation and
reporting required by ADR-0007.

## Related notes

- [ADR-0001: Techstack](ADR-0001-Techstack.md)
- [ADR-0002: Package architecture](ADR-0002-Package-architecture.md)
- [ADR-0003: Code style](ADR-0003-Code-style.md)
- [ADR-0004: React conventions](ADR-0004-React-conventions.md)
- [Workspace techstack](../Techstack/Workspace%20Techstack.md)
- [ADR-0007: Acceptance catalog](ADR-0007-Acceptance-catalog.md)
- [Testing guidelines](../../Engineering/Guidelines/Overview.md#testing)
- [Stories](../../Stories/Index.md)
