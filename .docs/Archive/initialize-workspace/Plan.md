---
created: 2026-10-03
tags:
  - story
---

# Initialize workspace and CI foundation - Plan

## Approach

Establish a private pnpm workspace with root-owned tooling and Turborepo orchestration, without creating placeholder
product packages. Use root tasks for the foundation's real checks and package-task conventions for future packages.
Keep configuration authoritative and link contributor documentation to it.

Use shared TypeScript configuration, Oxlint, Oxfmt defaults, and Husky/lint-staged as required by the ADRs.
Implement the test-owned catalog contracts, validator, discovery consistency checks, and traceability reporting in
TypeScript. Compile this tooling and execute its verification fixtures with Node.js built-in assertions; this is
tooling verification, not application/service testing or a workspace-wide Vitest suite.

GitHub Actions installs from the frozen lockfile and runs the applicable Turbo gates independently of local hooks.
Configure Snyk and Renovate as GitHub integrations and coordinate their activation with the repository owner.
Product-package builds/tests, library coverage, browser installation, and container-stack/image checks remain explicitly
inapplicable until real packages exist; do not create no-op substitutes.

Installing every target-stack dependency at the root was rejected because many are scoped to libraries, React packages,
or actual application stacks. Creating sample product packages merely to make test tasks run was rejected because it
would expand the approved foundation-only scope. Snyk/Renovate npm CLI dependencies are prohibited.

## Affected areas

- Workspace root: private manifest, pnpm workspace and lockfile, runtime/package-manager version declarations,
  shared compiler configuration, Turbo configuration, lint/format configuration, and generated-output exclusions.
- `.husky/` and root staged-file configuration: local activation and compliance-only pre-commit checks.
- `.github/workflows/` and Renovate repository configuration: independent CI gates and update policy.
- `tests/acceptance/validation/` and `tests/reporting/`: typed catalog contracts, validation, discovered-test
  consistency, fixture verification, and generated traceability reports. No business entries or runtime specs.
- Engineering guidelines and CI overview: actual prerequisites, commands, failure handling, integration activation,
  applicability boundaries, and future package obligations.
- Story/index documentation and eventual archive links. No production package or public product interface changes.

All paths above are intended locations, not claims that implementation files exist.

## Implementation steps

- **P-001 - Confirm prerequisites and permissions:** Inventory local Node.js/pnpm availability and repository
  integration access. Select exact compatible versions of the active Node.js LTS, pnpm, and proposed direct
  dependencies; obtain explicit dependency approval before manifest edits. Confirm Snyk/Renovate activation routes,
  required account access, and any plan entitlement. Dependencies: none.
- **P-002 - Establish reproducible workspace:** Add the private root manifest, pnpm workspace configuration,
  version declarations, frozen-install lockfile, and generated-output exclusions. Add only approved root development
  dependencies and establish contributor install instructions. Dependencies: P-001.
- **P-003 - Wire quality tasks and compiler baseline:** Configure shared strict TypeScript settings without aliases.
  Add actual root Turbo tasks for lint, format-check, tooling type-check/build, and tooling verification; avoid root
  script recursion into the same Turbo task. Establish dependency ordering and cache outputs; define future package
  task conventions without pretending absent packages ran. Dependencies: P-002.
- **P-004 - Enable staged-file checks:** Configure Husky activation and its pnpm/lint-staged hook. Select supported
  file types for Oxlint and Oxfmt compliance checks without auto-rewriting unstaged content. Document activation and
  manual invocation, while keeping CI independent of hook activation. Dependencies: P-003.
- **P-005 - Establish catalog validation and reporting:** Implement typed feature/API, criterion, scenario, and
  test-reference contracts in test-owned TypeScript, preserving ADR-0007's one-directional relationships.
  Restrict future runtime discovery to `tests/scenarios/**/*.spec.ts`; validate scenario references using test-owned
  metadata without importing production code. Provide isolated fixtures for all rejection classes and an empty
  baseline, plus derived reporting with explicitly absent execution results. Compile/run fixtures through Turbo
  without Vitest or Playwright product tests. Dependencies: P-003.
- **P-006 - Configure independent CI:** Add GitHub Actions with minimal permissions, pinned compatible setup
  actions, declared Node.js/pnpm versions, frozen installation, and the same applicable Turbo gates. Retain useful
  reports on failure without secrets. Document deferred product testing and future uncached black-box task
  requirements. Dependencies: P-004, P-005.
- **P-007 - Configure and activate integrations:** Configure Renovate to recognize pnpm dependencies and propose
  updates without automerge. Enable its GitHub integration and Snyk dependency scanning for this repository.
  Establish applicable Snyk check reporting and observe integration runs; do not install either as an npm package.
  Record account-controlled setup and troubleshooting without credentials. Dependencies: P-002, P-006.
- **P-008 - Verify and document adoption:** Run all applicable local gates, isolated negative controls, and manual
  ADR review; update lasting setup/CI guidance with actual commands and evidence. Before final review, integrate
  freshly fetched main by merge, repeat checks, observe CI/integration outcomes for the current published revision,
  and prepare archival links. Commits and publication remain separately authorized workflow gates, not implicit
  permissions from this step. Dependencies: P-004, P-005, P-006, P-007.

## Data, lifecycle, and failure handling

Catalog inputs are declarative test-owned records, not executable business tests. Validation must report actionable
record IDs and reasons and exit nonzero for invalid structure, references, or missing required test mappings.
An empty baseline produces empty mappings with no claimed execution successes. Declared scenarios without tests
remain failures, not omitted records.

Use isolated temporary fixture directories for negative controls. Do not stage invalid data into the user's checkout
or create verification commits. Hook verification must preserve existing staged and unstaged work, using a disposable
fixture repository when needed. Clean up fixture resources after success or failure and surface cleanup errors.

Generate reports beneath invocation-specific `tests/artifacts/<run-id>/acceptance-report/` directories and exclude
generated outputs from Git and discovery. CI must preserve useful failure diagnostics without exposing tokens.

Account credentials remain in integration-managed settings or appropriate GitHub secrets, never repository files.
Missing authorization, unavailable integrations, security findings requiring resolution, and failed checks block
acceptance. No catch-and-pass behavior, fabricated check success, or silent skip is permitted.

## Validation

| Criterion | Verification method                                                                                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | Install a clean copy with the declared runtime/package manager using a frozen lockfile; confirm no manifest/lockfile drift and run documented workspace commands.                                                                       |
| AC-002    | Inspect effective compiler options and compile/type-check all authored tooling; isolated negative type fixtures must fail with the intended diagnostics.                                                                                |
| AC-003    | Run real pnpm/Turbo quality tasks on clean inputs and isolated invalid lint/format/type fixtures; assert exit results and diagnostics. Review applicability of absent product tasks.                                                    |
| AC-004    | Activate Husky in a disposable fixture checkout, invoke the pre-commit hook without creating a commit, and demonstrate valid/invalid staged files plus preservation of unrelated unstaged contents.                                     |
| AC-005    | Review workflow failure propagation and least-privilege permissions; after separately authorized publication, observe passing GitHub Actions checks for the current revision. Negative local controls validate the commands CI invokes. |
| AC-006    | Run catalog fixture verification through pnpm/Turbo: empty and complete valid catalogs, every listed malformed/missing mapping case, restricted discovery, derived mappings, and reports with no invented outcomes.                     |
| AC-007    | Obtain Snyk repository connection and an observed dependency scan/check result tied to the current dependency set; resolve required findings and confirm no npm scanner dependency or leaked credentials.                               |
| AC-008    | Obtain Renovate repository connection and an observed run recognizing pnpm files; retain a proposal reference or explicit no-updates result and verify automerge is disabled.                                                           |
| AC-009    | Review setup and recovery instructions against actual files/commands, check changed relative links and ignore rules, and review all eight accepted ADRs plus dependency approvals manually.                                             |

Applicable local gates are lint, format-check, tooling type-check/build, catalog validation/reporting, and tooling
fixture verification, all through pnpm/Turborepo. Hooks are additional fast feedback. Applicable CI gates run the same
checks independently and require Snyk dependency scan success. Renovate operational evidence is an integration
acceptance condition, not a fake test task.

No public product contract changes occur, so strict public-contract test-first development is inapplicable.
Tooling verification still requires meaningful positive and negative assertions. Full application acceptance tests,
library coverage, Storybook builds, and image scans are inapplicable because their corresponding packages do not exist.
Do not report empty test suites or missing tasks as passing those gates.

Local verification precedes commit authorization. Observed story-branch CI requires separate commit and publication
authorization and is collected afterward, before final human acceptance and merge. Current-main integration or any
new revision requires renewed checks and acceptance.

## E2E tests

No application/service feature or API changes are included. There are no business feature, criterion, or scenario IDs
to register and no Playwright acceptance specs to create. Story-local AC-001 through AC-009 remain in the brief;
catalog tooling fixtures are technical validation, not business entries or E2E scenarios.

Implemented technical controls are [catalog verification](../../../tests/acceptance/validation/CatalogVerification.ts)
and [workspace verification](../../../tests/verification/WorkspaceVerification.ts); the
[empty approved catalog](../../../tests/acceptance/Catalog.ts) contains no invented business IDs.
See [catalog guidance](../../../tests/acceptance/README.md) for discovery/reporting and future execution obligations.

The first real application/service story must implement the fresh entire-stack Testcontainers lifecycle, public-only
Playwright scenarios, complete uncached execution, and execution-result reporting under ADR-0005/0007 before
acceptance. The first library story must implement its scoped Vitest/coverage requirements. This plan does not claim
either foundation exists already or waive those future gates.

## Dependencies, risks, and open decisions

Proposed direct root development dependencies are `typescript`, `@types/node`, `turbo`, `oxlint`, `oxfmt`, `husky`,
and `lint-staged`. Their documented approval does not substitute for explicit approval to add them in this story.
Exact compatible versions are selected and recorded during P-001 before addition. Other direct dependencies require
separate approval and, if they materially change the approach, renewed plan approval.

On 2026-10-04 the user explicitly approved `typescript` 7.0.2, `@types/node` 24.19.1, `turbo` 2.11.7,
`oxlint` 1.86.0, `oxfmt` 0.71.0, `husky` 9.1.7, and `lint-staged` 17.6.0.
The selected runtime is Node.js 24.21.0 (active LTS); pnpm is 11.9.0.
The user supplied their NVM runtime path and agreed to perform Snyk/Renovate owner activation and provide evidence.
Local implementation may proceed; remote activation and results remain acceptance blockers, not scope exclusions.

The user also authorized Oxfmt normalization of existing wiki and skill Markdown on 2026-10-04 to establish
the whole-workspace formatting baseline. Local IDE/Obsidian state remains excluded and preserved.

External prerequisites are registry access, the selected Node.js LTS and pnpm, GitHub Actions availability, and owner
access/entitlement to activate Snyk and Renovate. No host-wide installation or account mutation is authorized merely
by drafting this plan; obtain necessary permission before performing it.

Snyk status integration and Renovate availability depend on account settings. If unavailable, block activation and
ask the owner to resolve access; do not reduce the accepted scope to configuration-only.

An empty workspace can conceal no-op task wiring. Mitigate with real TypeScript tooling and negative controls.
Catalog validation/reporting can become a false product-testing substitute; mitigate with explicit empty-baseline
semantics and documented future obligations.

No unbounded design questions remain. Version selection and account provisioning are bounded prerequisites; inability
to meet them blocks implementation or acceptance rather than authorizing a different stack.

## Migration and rollout

There are no existing package manifests or product runtimes to migrate. Preserve the vault, agent guidance, and
unrelated IDE files. Introduce setup commands for new and existing checkouts, including local hook activation.
Account integration activation is coordinated with the owner; troubleshoot or correct failed configuration without
disabling required gates to manufacture success.

Before final review, transfer lasting guidance to Engineering, archive this story, and update affected relative links
and indexes. Keep the merge confirmation task pending until GitHub confirms the merge commit into main.
No releases, deployments, or follow-up documentation commit solely to record merge confirmation are required.

## Approval

**Approved on 2026-10-04.** In this implementation session, the user explicitly selected
"Approve the current plan and all nine acceptance criteria", approving the current foundation-only approach
and brief AC-001 through AC-009, including active Snyk and Renovate integrations. No additional exclusions were granted.

On 2026-10-03 the user authorized creation of `chore/initialize-workspace` and story documents,
bounded scope to the workspace/CI foundation, and required activated and demonstrated Snyk/Renovate integrations.
That earlier authorization alone did not approve this plan or its criteria.

Implementation is authorized subject to prerequisite and direct-dependency permissions. Commits, push/PR publication,
human acceptance, and merge remain separate gates. Approval does not establish successful execution.

Archive location is pre-review preparation, not confirmed delivery. Pending remote outcomes and permissions are
tracked in [Tasks](Tasks.md); GitHub remains the merge authority.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
- [Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
