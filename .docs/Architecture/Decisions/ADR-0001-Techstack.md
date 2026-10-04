---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0001: Techstack

## Context

The [techstack](../Techstack/Workspace%20Techstack.md) and [dependency tables](../Dependencies/Workspace%20Dependencies.md) define the approved choices. Undocumented choices remain unspecified, not prohibited.

Backend frameworks, frontend build tools, hosting platforms, and other product-dependent choices remain open rather than being prescribed here.

Local commits need fast feedback on staged changes. Husky manages Git hooks, and lint-staged limits local lint and
formatting checks to staged files; these checks complement workspace validation and CI rather than replace them.

Libraries expose a package-root API rather than a running UI or HTTP endpoint. Vitest is selected for testing those
exports; application and service verification remains container-backed Playwright testing.
[ADR-0005](ADR-0005-Testing-strategy.md) defines the detailed testing strategy, ownership, and acceptance gates.

Storybook is selected for the React component documentation required by
[ADR-0004](ADR-0004-React-conventions.md). In React libraries its stories are also executed as the component tests
through `@storybook/addon-vitest` in Vitest browser mode with Playwright, which requires a Vite-based Storybook; Vite is
therefore selected as the frontend build tool. In frontend applications stories remain documentation only, and
Playwright acceptance tests stay the sole application verification. Hooks and non-UI library exports use ordinary
Vitest tests, with jsdom and Testing Library for hooks, so no module mocking of React is needed.

## Decision

- Project-authored application, service, library, and test code must use TypeScript. Server-side TypeScript and workspace tooling must use the active Node.js LTS release.
- Package management must use pnpm. Local and CI workspace tasks must use Turborepo.
- Linting must use Oxlint, and formatting must use Oxfmt. GitHub Actions CI must run builds, lint and formatting checks, tests, and applicable security scans.
- Local pre-commit checks must use Husky to run lint-staged through pnpm. lint-staged must run Oxlint and Oxfmt
  compliance checks on matching staged files for quick local scanning. These checks must not replace required
  Turborepo validation or CI checks, including security scans.
- Dependency and applicable container-image security scans must use Snyk; automated dependency update proposals must use Renovate. Snyk and Renovate must be used as GitHub integrations, not direct npm dependencies.
- Deployable backend services must be packaged as Docker images.
- Frontend applications must use React, built with Vite. Services needing relational persistence must use PostgreSQL with Drizzle ORM for access and Drizzle Kit for migrations. Services needing shared caching must use Redis.
- React component documentation must use Storybook with `@storybook/react-vite`, following ADR-0004's story
  requirements and subcomponent exemption. In React libraries, component stories with play functions must be run as the
  component tests through `@storybook/addon-vitest` in Vitest browser mode using the Playwright provider, as defined by
  ADR-0005. In frontend applications, stories must be documentation only and must not be run as tests.
- Frontend application and microservice tests must use Playwright against the public UI or HTTP APIs of a running
  stack, started fresh with Testcontainers for every test invocation. Library packages only must use Vitest with
  `@vitest/coverage-v8`: component tests through Storybook stories, and hooks and non-UI exports through their
  package-root public exports, using jsdom and Testing Library for hooks. Vitest must not be used for application or
  microservice tests. [ADR-0005](ADR-0005-Testing-strategy.md) defines the detailed boundaries, coverage thresholds,
  orchestration, and acceptance gates.
- Browser testing through Playwright must use Chromium only, including Vitest browser-mode tests using the
  Playwright provider, locally and in CI. Firefox and WebKit must not be used for testing. HTTP-only tests must
  remain browser-independent, as defined by ADR-0005.
- Direct npm dependencies must follow the approved packages and applicable scopes in the [workspace](../Dependencies/Workspace%20Dependencies.md), [backend](../Dependencies/Backend%20Dependencies.md), and [frontend](../Dependencies/Frontend%20Dependencies.md) dependency tables. Every new direct runtime or development dependency must receive explicit approval before it is added; transitive dependencies of an approved direct dependency must not require separate approval.
- Before a project change is accepted, conformance must be checked against every accepted, active ADR. A nonconforming change must be revised or its conflicting ADR must be updated to authorize it before acceptance.

## Consequences

The techstack and dependency notes give the applicability and package-level detail for these rules. Exact versions belong in future manifests and configuration. Checks against active ADRs remain a requirement even before an automated check exists.

Workspace scaffolding must install and configure Husky and lint-staged at the workspace root, including hook
activation for local development. Staged-file checks provide quick feedback, not whole-project validation.

Library and workspace scaffolding must implement ADR-0005's testing strategy without extending unit testing to
applications or services. Coverage percentages do not replace meaningful behavioral assertions.

Frontend scaffolding must configure Vite and Storybook, including `.stories.tsx` discovery and, in React libraries,
the Vitest addon and browser-mode project. Library component tests then depend on a Playwright browser, which adds
setup and CI cost. Application build tooling beyond Vite and the HTTP and validation libraries for backend services
remain open and need explicit approval before use.

## Related notes

- [Workspace techstack](../Techstack/Workspace%20Techstack.md)
- [Backend techstack](../Techstack/Backend%20Techstack.md)
- [Frontend techstack](../Techstack/Frontend%20Techstack.md)
- [ADR-0004: React conventions](ADR-0004-React-conventions.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
