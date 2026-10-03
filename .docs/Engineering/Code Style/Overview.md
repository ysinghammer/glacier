# Code style

The [package architecture decision](../../Architecture/Decisions/ADR-0002-Package-architecture.md) defines binding capability boundaries, layer paths, public APIs, and composition rules for all packages.
The [code style decision](../../Architecture/Decisions/ADR-0003-Code-style.md) defines framework-neutral naming,
class-first implementation, TypeScript safety, documentation, and quality checks. The
[React decision](../../Architecture/Decisions/ADR-0004-React-conventions.md) defines React-specific conventions and
function exceptions.

- [General rules](Rules/General%20Rules.md) apply to every package.
- [Code style rules](Rules/Code%20Style%20Rules.md) detail naming, role suffixes, exports, JSDoc, and quality standards.
- [React rules](Rules/React%20Rules.md) apply to React presentation code.
- [Backend microservice rules](Rules/Backend%20Microservice%20Rules.md) define service structure and startup.
- [Frontend application rules](Rules/Frontend%20Application%20Rules.md) define presentation and application startup.
- [Backend library rules](Rules/Backend%20Library%20Rules.md) define framework and backend library structure.
- [Frontend library rules](Rules/Frontend%20Library%20Rules.md) define UI and frontend library structure.

Use these notes alongside the [techstack decision](../../Architecture/Decisions/ADR-0001-Techstack.md). Link to formatter,
linter, compiler, and Turbo task configuration. After every code change, Oxlint and Oxfmt
compliance checks must run through Turbo using pnpm.

Husky and lint-staged provide additional quick pre-commit checks on staged files, not a replacement for Turbo validation.
See the [local scanning guidelines](../Guidelines/Overview.md) for the intended workflow and current tooling status.
