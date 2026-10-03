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

Once workspace tooling is scaffolded:

- Install workspace dependencies with pnpm and ensure the repository's local Husky hook setup is active.
- Stage the intended changes. On commit, the Husky pre-commit hook runs lint-staged only on matching staged files.
- If a check fails, resolve the reported violations, stage the corrected files, and retry the commit. A failed check
  blocks the commit.
- Before acceptance, also run the required pnpm/Turbo lint and formatting checks and applicable type-check, build,
  and test tasks. A successful staged-file scan does not validate the whole project or replace CI.

Workspace scaffolding must add the root development dependencies, hook activation, pre-commit hook, and staged-file
configuration. Link the setup and manual scan command here.
