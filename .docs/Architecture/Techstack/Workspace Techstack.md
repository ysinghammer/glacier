# Workspace techstack

These choices are mandatory for all Glacier contributors, including coding agents. They apply where their stated scope is relevant; a choice not documented here is not prohibited by this note. Exact versions belong in the repository's manifests and configuration when those files exist.

## Language and workspace

- Use [TypeScript](../Dependencies/Workspace%20Dependencies.md) for project-authored application, service, library, and test code.
- Use the active Node.js LTS release for server-side TypeScript and workspace tooling.
- Use pnpm to manage packages and workspaces.
- Use [Turborepo](../Dependencies/Workspace%20Dependencies.md) to orchestrate workspace tasks locally and in CI.
- Obtain explicit approval before adding any new direct runtime or development dependency. Transitive dependencies of an approved direct dependency do not require separate approval.

## Quality and automation

- Use [Oxlint](../Dependencies/Workspace%20Dependencies.md) for linting and [Oxfmt](../Dependencies/Workspace%20Dependencies.md) for formatting.
- Use [Husky and lint-staged](../Dependencies/Workspace%20Dependencies.md) for quick local pre-commit scanning:
  Husky runs lint-staged through pnpm, and lint-staged runs Oxlint and Oxfmt compliance checks on matching staged files.
  These file-scoped checks supplement, not replace, required Turbo validation and CI security scans.
- Use GitHub Actions for CI builds, lint and formatting checks, tests, and applicable security scans. Run workspace tasks through [Turbo](../Dependencies/Workspace%20Dependencies.md).
- Use Snyk to scan dependencies and container images where applicable.
- Use Renovate for automated dependency update proposals.

Workspace scaffolding must supply Husky hooks and lint-staged configuration. See the [local scanning guidelines](../../Engineering/Guidelines/Overview.md) for the contributor workflow.

## Containers and testing

- Package deployable backend services as Docker images. Local development need not run in Docker except where a test requires containers.
- Use [Playwright](../Dependencies/Workspace%20Dependencies.md) with [Testcontainers](../Dependencies/Workspace%20Dependencies.md)
  for application/service acceptance tests, kept in workspace-root `tests/`. Each invocation starts a fresh entire stack
  and exercises only public UI and HTTP APIs.
- Use [Vitest](../Dependencies/Workspace%20Dependencies.md) for library packages only, through the package-root public API,
  with 100% statement, branch, function, and line coverage. React library components are tested through their
  Storybook stories run by the Vitest addon in browser mode. Do not use Vitest or isolated unit-test suites for frontend
  applications or microservices.
- Maintain the test-owned acceptance catalog under `tests/acceptance/`, and require catalog validation and the complete
  uncached Playwright suite locally and in CI through Turbo before acceptance.

[ADR-0005: Testing strategy](../Decisions/ADR-0005-Testing-strategy.md) defines the detailed boundaries, folder and
discovery conventions, orchestration, scenario/data conventions, and verification; [ADR-0007](../Decisions/ADR-0007-Acceptance-catalog.md)
defines the criterion lifecycle and acceptance catalog. See also the
[testing guidelines](../../Engineering/Guidelines/Overview.md#testing).

See the [backend](Backend%20Techstack.md) and [frontend](Frontend%20Techstack.md) notes for area-specific choices.
