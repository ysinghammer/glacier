---
created: 2026-10-03
tags:
  - story
---

# Initialize workspace and CI foundation - Brief

Joint requirements/design approval is recorded in the [plan](Plan.md#approval).
Dependency additions, commits, publication, and merge retain their separate permission gates.

## Problem

Contributors and coding agents have documented engineering policies but no executable workspace foundation.
The repository has no package manifests, lockfile, workspace tasks, Git hooks, test tooling, or CI workflows.
Required checks cannot currently be run, and policy alone does not establish passing verification.

## Intended outcome

A clean checkout can reproducibly initialize the workspace and run its applicable quality gates locally and in
GitHub Actions. Fast staged-file checks are active for contributors, and Snyk and Renovate are active GitHub
integrations. The foundation supports future packages without inventing product functionality or pretending
that absent application/library tests have executed.

## Scope

- In scope: workspace dependency management and task orchestration; shared TypeScript compiler requirements;
  linting and formatting; local hook activation and staged-file checks; GitHub Actions quality gates;
  acceptance-catalog validation/reporting tooling; Snyk and Renovate repository configuration, activation,
  and operational evidence; contributor setup and CI recovery documentation.
- Out of scope: initial applications, microservices, libraries, or sample product packages; React/Storybook
  tooling and library-specific Vitest configuration; application Playwright scenarios and Testcontainers
  stack orchestration before a real stack exists; databases, caches, service images, deployment, and releases.
  Repository branch protection and other organization-wide administration are not part of this story.

## Requirements and constraints

- Follow every accepted active ADR. Use the active Node.js LTS release, pnpm, Turborepo, TypeScript, Oxlint,
  Oxfmt defaults, Husky, and lint-staged in their documented scopes.
- Require explicit approval of each proposed new direct dependency before adding it, even when listed in the
  approved dependency tables. Keep versions and reproducibility information in the eventual manifests and lockfile.
- Shared compiler requirements must include `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`, without internal
  import aliases.
- Local and CI whole-workspace checks must use pnpm/Turborepo. Husky must invoke lint-staged through pnpm for
  file-scoped Oxlint and Oxfmt compliance checks; failures must block commits rather than be bypassed.
- CI must independently enforce applicable build, type-check, lint, formatting, and test-owned catalog checks.
  Missing or failed applicable checks must fail explicitly. Checks genuinely inapplicable without product
  packages must have documented reasons, not artificial passing tasks or fabricated test evidence.
- Establish acceptance-catalog validation and reporting under the test ownership and contracts of ADR-0007.
  An empty initial inventory is legitimate because no application/service behavior exists; do not invent business
  criteria. Invalid records and incomplete mappings must be rejected when supplied.
- Future library and application/service gates must retain ADR-0005 boundaries: library-only Vitest with
  100% coverage, and uncached Playwright against a fresh entire Testcontainers stack. Their implementation is
  deferred until corresponding packages exist, and that boundary must be explicit in lasting documentation.
- Snyk and Renovate must be GitHub integrations, not direct npm dependencies. Activate and demonstrate dependency
  scanning and dependency-update proposals on this repository; container-image scanning is inapplicable until
  deployable images exist. Missing permissions, credentials, or integration access must be visible blockers.
- Never commit credentials or disclose secrets in logs or retained artifacts. Generated outputs must be
  Git-ignored, with test-owned reports under the ADR-0005 artifact locations.
- Preserve existing documentation and agent guidance. Update directly affected contributor and CI notes to
  describe actual commands, prerequisites, gate applicability, and recovery rather than duplicate configuration.
- This story changes tooling, not public application/service or library contracts. Story-local criteria apply;
  application acceptance-catalog business criteria and public-contract test-first evidence are inapplicable.

## Acceptance criteria

- **AC-001 - Reproducible workspace setup:** A clean checkout with documented prerequisites can install
  the committed dependency set using pnpm without modifying its lockfile. The repository declares the selected
  Node.js LTS and pnpm versions and contains the workspace/task configuration needed for the documented commands.
- **AC-002 - Compiler baseline:** The shared TypeScript configuration enables every compiler option listed above,
  introduces no internal import aliases, and type-checks all TypeScript authored for this tooling foundation.
- **AC-003 - Workspace quality gates:** Documented pnpm/Turborepo commands run Oxlint, Oxfmt compliance checks,
  and applicable type-check/build tasks. Deliberate lint, formatting, and type errors in verification fixtures
  produce nonzero results; clean inputs pass. Absent product-package tasks have explicit applicability rationale.
- **AC-004 - Fast staged-file feedback:** Documented local setup activates the Husky pre-commit hook.
  Its pnpm/lint-staged invocation checks matching staged files with Oxlint and Oxfmt compliance checks;
  invalid staged inputs fail, valid inputs pass, and unrelated unstaged changes are not rewritten.
- **AC-005 - Independent CI enforcement:** GitHub Actions definitions install the reproducible dependency set
  and independently run the applicable workspace gates through pnpm/Turborepo. An observed run for this story's
  published revision passes the required checks; a failed applicable command cannot yield a successful job.
  Product test and image-scan exclusions are explicitly justified by the absence of corresponding packages.
- **AC-006 - Acceptance-catalog foundation:** Validation accepts an empty inventory without claiming executed
  acceptance tests. Verification fixtures demonstrate rejection of malformed records, unknown or duplicate IDs,
  unmapped features/API operations, criteria without scenarios, scenarios without criteria or discovered tests,
  and dangling persona/data references. Reporting derives forward-to-reverse traceability and does not invent
  execution outcomes. Test discovery and report locations follow ADR-0005/0007.
- **AC-007 - Active dependency security integration:** Snyk is connected to this repository and demonstrates
  a dependency scan of its lockfile-backed workspace. Applicable required scans pass with no unresolved findings
  requiring remediation; missing authorization or scan failures remain blockers, not successful fallback results.
  No Snyk npm dependency or committed credential is introduced.
- **AC-008 - Active dependency-update integration:** Renovate is connected to this repository and an observed
  repository run recognizes the workspace dependency files and is configured to propose updates rather than merge
  automatically. Its operational evidence shows update proposals when updates are available, or a recorded
  no-updates result when dependencies are current. No Renovate npm dependency or committed credential is introduced.
- **AC-009 - Truthful setup and adoption documentation:** Lasting engineering notes link to actual configuration,
  document setup and local/CI check commands, hook activation, integration ownership/prerequisites, failure recovery,
  and future package/testing obligations. Generated dependencies, build outputs, and test artifacts are Git-ignored.
  No unavailable, deferred, skipped, or empty-suite check is described as executed product verification.

## Open questions

None for requirements. The user bounded this story to the workspace/CI foundation and explicitly required active
Snyk and Renovate integrations. Integration permissions and credentials are execution prerequisites, not permission
to weaken those outcomes. Dependency versions, configuration details, and verification design belong in the plan.

## References

- [Agent guidance](../../../AGENTS.md)
- [Architecture decisions](../../Architecture/Decisions/Index.md), including all eight accepted active ADRs.
- [Workspace techstack](../../Architecture/Techstack/Workspace%20Techstack.md)
- [Workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md)
- [Engineering guidelines](../../Engineering/Guidelines/Overview.md)
- [CI overview](../../Engineering/CI/Overview.md)
- [Story documentation contracts](../../Stories/Index.md)
- Scope decisions: user conversation on 2026-10-03; foundation only, with activated and demonstrated integrations.

## Related notes

- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
