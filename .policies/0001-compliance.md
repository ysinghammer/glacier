# 0001 — Compliance

1. These policies are a self-contained consolidation of the technology, dependency, architecture, code-style, React, testing, capability-scenario documentation, and development workflow rules. All thirteen policies MUST be read as jointly binding within those scopes. MUST denotes an obligation; MUST NOT denotes a prohibition; MAY denotes only an explicit permission or exception. Applicability qualifiers MUST be respected.
2. Before accepting a project change, contributors MUST check conformance against every accepted, active ADR and manually review requirements not established by tools: architectural boundaries, responsibility/readability, public contracts, dependency approvals, assertion quality, documentation consistency, and affected links. Conflicts MUST be resolved by revising the change or updating the conflicting ADR before acceptance, not by a waiver comment. Suppressions MUST be narrow and justified, not broad file-level escapes.
3. After every code change, contributors MUST run Oxlint and Oxfmt compliance checks through pnpm/Turborepo, resolve violations, and pass applicable type-check/build tasks. Editor formatting or direct tool execution MUST NOT replace these gates. Oxfmt defaults MUST own formatting; competing handwritten whitespace, quote, or line-length rules MUST NOT be maintained. Failed/unavailable applicable checks MUST NOT be reported as passing; genuinely inapplicable checks MUST be explained. Documentation-only work MUST verify conformance, consistency, and changed links without claiming product checks ran.
4. GitHub Actions CI MUST run builds, lint/format checks, applicable tests and security scans through workspace tasks. Workspace/package scaffolding MUST configure applicable compiler, lint/format, test, coverage, catalog/reporting, uncached black-box, and CI gates with real scripts, not empty or skipped tasks.
5. Workspace scaffolding MUST install/configure root Husky and lint-staged and activate local hooks. Husky pre-commit MUST invoke lint-staged through pnpm; matching staged files MUST receive Oxlint/Oxfmt compliance checks. lint-staged MAY invoke those tools directly for file-scoped feedback. Failed checks MUST block commits until corrected; hooks MUST NOT be bypassed or substitute for workspace validation/CI.
6. Current inline tooling coordinates are `package.json`, `turbo.json`, `tsconfig.base.json`, `.husky/pre-commit`, `.husky/commit-msg`, `.oxfmtignore`, and `pnpm-workspace.yaml`; commands include `pnpm lint`, `pnpm format-check`, `pnpm type-check`, `pnpm build`, `pnpm catalog-check`, and `pnpm docs-check`. Staged checks use `pnpm staged:check`, read-only `lint-staged --no-stash --no-revert`; interrupted checks MUST preserve work and inspect reported recovery instructions before retrying. Exact declared runtimes MUST be activated rather than bypassing strict engines; frozen-install failures MUST NOT be hidden by removing frozen mode. Automated enforcement or execution not actually available MUST NOT be claimed.

## Directory navigation

| Policy                                  | Exclusive rule scope                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `0001-compliance.md`                    | Scope, interpretation, review/tooling gates                                     |
| `0002-technology-and-dependencies.md`   | Technology choices, direct-dependency scopes/pins, reflection adoption          |
| `0003-capabilities-and-boundaries.md`   | Capability/layer ownership, dependency direction, public API architecture       |
| `0004-composition-and-lifecycle.md`     | Application composition, startup, cleanup, shutdown                             |
| `0005-naming-and-files.md`              | Names, roles, filenames and runner exceptions                                   |
| `0006-typescript-and-implementation.md` | Implementation, types, compiler, imports/exports, JSDoc                         |
| `0007-failures-and-async-work.md`       | Outcomes, errors, translation, promise supervision                              |
| `0008-react.md`                         | Component/state/effect ownership and accessible rendering                       |
| `0009-storybook.md`                     | Story ownership, documentation and component-story execution                    |
| `0010-library-testing.md`               | Public library contracts, scenarios, doubles, coverage                          |
| `0011-full-stack-testing.md`            | Public-only real-stack Playwright testing and data/artifacts                    |
| `0012-acceptance-catalog.md`            | Criterion lifecycle, capability Markdown/scenario indexes, acceptance evidence  |
| `0013-development-workflow.md`          | Discovery, agent handoffs, planning, implementation, acceptance and publication |
