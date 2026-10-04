# Engineering guidelines

Contributor-facing summaries of the development workflow, testing, and local checks. The linked ADRs are authoritative; each section says when it applies and points to commands or configuration.

## Development workflow

[ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md) and
[ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md) define the required sequence for every
repository change, including documentation: discovery, a proportionate approved story, one branch per story,
public-contract test-first development where applicable, verification, separately authorized commits and publication,
human acceptance, and explicitly authorized merge into GitHub `main`.

Each [story](../../Stories/Index.md) represents one coherent outcome. Its brief owns requirements and stable criteria,
its plan owns design and verification, and its tasks own execution with explicit dependencies, statuses, completion
conditions, blockers, and evidence. Use `documentation-brief`, `documentation-plan`, and `document-tasks` to author
those documents independently. Record joint brief/plan approval in the plan; material requirements/design changes
invalidate affected approval. Document drafting is not authorization to implement, commit, publish, or merge.

Prepare lasting documentation and archive the story in its PR before final review, without claiming delivery before
GitHub confirms the merge. Changed revisions require fresh checks and renewed acceptance; integrate current main
without rewriting published history. Applicable unavailable or failed checks block acceptance; genuinely inapplicable
checks require an explanation. Releases, deployments, and continuous delivery are outside this workflow.

## Testing

[ADR-0005](../../Architecture/Decisions/ADR-0005-Testing-strategy.md) is the single source of truth for testing policy;
[ADR-0001](../../Architecture/Decisions/ADR-0001-Techstack.md) selects the tools. In summary:

- **Libraries** use Vitest through their package-root public API only, with 100% statement, branch, function, and line
  coverage per library and per production file. Tests, data, and doubles live in the library's `tests/`. React
  component tests are their `.stories.tsx` files, run by Storybook's Vitest addon in browser mode.
- **Applications and microservices** are verified only by Playwright tests in workspace-root `tests/`, against a fresh
  entire stack started with Testcontainers per invocation, through public UI/HTTP interfaces. They have no local test
  suites and no mocks.
- **Acceptance catalog**: the test-owned catalog under `tests/acceptance/` maps features and public API operations
  through criteria to scenarios and tests. Catalog validation and the complete uncached Playwright suite must pass
  locally and in CI before acceptance.

See ADR-0005 for folder layout, discovery patterns, coverage configuration, stack orchestration, scenario data rules,
and generated output locations.

## Story-plan E2E traceability

Acceptance criteria and their lifecycle (drafting, approval, catalog registration, renewed approval) follow
[ADR-0007](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md#acceptance-criteria-lifecycle-and-structure).
Every [story plan](../../Stories/Index.md) must contain an `E2E tests` section using the
[story plan template](../../Templates/Story%20Plan.md), either identifying the catalog IDs and intended test files or
explaining why E2E changes are not applicable. Link implemented tests before completion; do not present planned paths
as completed tests.

## Quick local scanning

[ADR-0001](../../Architecture/Decisions/ADR-0001-Techstack.md) selects Husky and lint-staged for fast pre-commit feedback.
Husky manages the Git hook; lint-staged selects staged files and runs Oxlint and Oxfmt compliance checks through pnpm.
These are lint and formatting checks, not security scans.

The root [manifest](../../../package.json) owns the staged-file commands; the
[hook](../../../.husky/pre-commit) invokes `pnpm staged:check`.

- Install workspace dependencies with pnpm and ensure the repository's local Husky hook setup is active.
- Stage the intended changes. On commit, the Husky pre-commit hook runs lint-staged only on matching staged files.
- If a check fails, resolve the reported violations, stage the corrected files, and retry the commit. A failed check
  blocks the commit.
- Before acceptance, also run the required pnpm/Turbo lint and formatting checks and applicable type-check, build,
  and test tasks. A successful staged-file scan does not validate the whole project or replace CI.

Use `pnpm staged:check` for a manual check of intended staged changes. The tools check compliance only; they
do not auto-fix files. lint-staged uses `--no-stash --no-revert`: it does not create a backup stash, and all
configured tasks are read-only. It hides/restores partially staged changes while checking the staged version.
Keep the working tree intact if interrupted and inspect the reported patch/recovery instructions before retrying.
Do not bypass failed hooks.

## Workspace setup

Use the exact runtime in [.node-version](../../../.node-version) / [.nvmrc](../../../.nvmrc) and the pnpm
version in [package.json](../../../package.json). The baseline is Node.js 24.21.0 (active LTS) and pnpm 11.9.0.
With an existing nvm installation:

```sh
nvm install
nvm use
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm check
```

Install pnpm 11.9.0 using your chosen package-manager provisioning method if it is unavailable; no host-wide
installation is performed automatically. `engineStrict` rejects a wrong runtime/package manager.
Installation runs `prepare` to activate Husky. If lifecycle scripts were intentionally disabled, run
`pnpm hooks:setup` and verify `git config --get core.hooksPath` is `.husky/_`.
CI uses `HUSKY=0` and does not depend on this local hook.

The [workspace configuration](../../../pnpm-workspace.yaml) discovers future packages under `packages/apps/*`,
`packages/services/*`, and `packages/libraries/*`, matching the scaffolding conventions without creating
placeholder directories or products. The [compiler baseline](../../../tsconfig.base.json) enables all
mandatory strictness controls, with no internal aliases. [Root compilation](../../../tsconfig.json) covers
authored foundation tooling and emits ignored `dist/`; future Playwright specs require their own runner/configuration.

## Workspace commands

The [manifest](../../../package.json) and [Turbo graph](../../../turbo.json) are authoritative.

| Command              | Actual work                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm check`         | All applicable root gates, plus corresponding tasks of future workspace packages.                          |
| `pnpm lint`          | Oxlint on authored test/tooling TypeScript and any package lint tasks.                                     |
| `pnpm format-check`  | Oxfmt defaults across supported workspace files and any package formatting tasks.                          |
| `pnpm type-check`    | Strict tooling compilation without emission and any package type checks.                                   |
| `pnpm build`         | Compile tooling to `dist/` and any actual package builds.                                                  |
| `pnpm catalog-check` | Validate catalog/discovered-test mappings and generate truthful traceability.                              |
| `pnpm tooling-check` | Technical catalog controls, disposable frozen installation, negative Turbo controls, and real hook checks. |

Root task names have a `:root` suffix and are selected explicitly, so an empty package inventory cannot produce
a false passing no-task run. Their scripts invoke tools, not Turbo recursively. Compilation/lint may use the local
Turbo cache; formatting, catalog discovery/reporting, and technical verification run each invocation.
Turbo's automatic agent-guidance edits are disabled to preserve the repository-owned `AGENTS.md`; consult
the installed `turbo/docs/README.md` when working with version-specific Turbo behavior.
The disposable verification checkout installs offline from the store populated by the initial frozen install.
An incomplete store fails verification explicitly; restore it with the normal frozen install before retrying.

To format intended files, use `pnpm exec oxfmt --write --ignore-path .gitignore --ignore-path .oxfmtignore <paths>`,
then rerun `pnpm check`. Formatting defaults are unmodified; [ignore rules](../../../.oxfmtignore) exclude generated
output, the generated lockfile, and local IDE/Obsidian state rather than suppressing source checks.
Existing wiki and skill Markdown was normalized with owner authorization for this baseline; IDE state is preserved.

For a failed gate, fix its diagnostic and rerun the same command. Wrong engines require activating the declared runtime;
lockfile errors require an intentionally approved dependency change and regenerated lockfile, not removing frozen mode.
Do not clear failures with empty tasks, skipped checks, or broad suppressions.

## Foundation applicability and future packages

[Technical verification](../../../tests/verification/WorkspaceVerification.ts) and
[catalog verification](../../../tests/acceptance/validation/CatalogVerification.ts) use Node built-in assertions,
not Vitest or Playwright product suites. [Catalog guidance](../../../tests/acceptance/README.md) describes authoring
and static scenario metadata. The empty catalog reports no test execution.

No applications, services, libraries, stories for React components, or deployable images exist.
Product builds, library coverage, Storybook builds, full-stack acceptance execution, and image scans are currently
inapplicable. This is not a waiver when packages are added:

- Libraries must add package-root public APIs, library-only Vitest/V8 checks, meaningful public-contract assertions,
  and 100% coverage per file and library. React libraries additionally run Storybook play assertions in browser mode.
- Applications/services must add the complete fresh-stack Testcontainers lifecycle and public-only Playwright suite,
  restricted scenario discovery, execution-aware catalog reporting, and a Turbo task with `cache: false`.
  Run the complete suite locally and in CI; a cache hit, focused/skipped test, or retry-only pass cannot satisfy it.

Package owners must add real scripts to the existing Turbo conventions and extend `pnpm check`/CI for newly
applicable tests. Dependency additions, runtime upgrades, and any new integration remain subject to ADR approval.
