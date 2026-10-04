---
created: 2026-10-03
tags:
  - story
---

# Initialize workspace and CI foundation - Tasks

Execution records derive from the [plan](Plan.md) and [brief](Brief.md).
Implementation depends on explicit [joint requirements/design approval](Plan.md#approval).

Archived for pre-review preparation only. Local implementation is verified; commit and publication authorization
has been granted. Remote integration evidence, human acceptance, and merge are not complete.

## Task records

### T-001 - Discover scope and isolate the story

- Status: done
- Source: [Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md#discover-and-approve).
- Dependencies: None.
- Completion condition: Review guidance and all active ADRs, establish scope, and create the authorized story branch
  from freshly fetched origin/main without carrying unrelated changes.
- Evidence: On 2026-10-03, reviewed AGENTS.md, the vault guidance, all eight accepted ADRs, and relevant tooling
  notes. Observed a clean checkout on main with no manifests or CI/test tooling. User selected foundation-only scope,
  active integrations, and branch creation. Fetched origin/main at `3364c102cf5fa22fb13219d27bd670420e94c308` and
  confirmed active branch `chore/initialize-workspace`.
- Blocker: None.

### T-002 - Obtain joint plan and acceptance-criteria approval

- Status: done
- Source: [Plan approval](Plan.md#approval), brief AC-001 through AC-009.
- Dependencies: T-001.
- Completion condition: User explicitly approves the current plan and all nine brief criteria; record that decision
  in the plan with date, scope, and any bounded exclusions.
- Evidence: Explicit user decision recorded in [Plan approval](Plan.md#approval).
- Blocker: None.

### T-003 - Resolve prerequisites and dependency permissions

- Status: done
- Source: Plan P-001; [Dependencies and risks](Plan.md#dependencies-risks-and-open-decisions).
- Dependencies: T-002.
- Completion condition: Record compatible exact runtime/tool versions, explicit approval to add each direct
  dependency, required permission for any host installation, and feasible Snyk/Renovate activation access.
  Any ADR conflict is resolved before adding conflicting configuration.
- Evidence: Exact versions and explicit dependency approvals are recorded in the
  [plan](Plan.md#dependencies-risks-and-open-decisions). Verified the user-supplied NVM Node.js executable reports
  24.21.0. The user will activate Snyk/Renovate and provide operational evidence, and explicitly authorized
  local implementation while those remote outcomes remain pending.
- Blocker: None for local implementation. Owner activation and published evidence remain required by T-015.

### T-004 - Establish reproducible workspace setup

- Status: done
- Source: Plan P-002; brief AC-001, AC-009.
- Dependencies: T-003.
- Completion condition: Root manifest, workspace/version declarations, lockfile, ignore rules, and setup instructions
  support a reproducible frozen install with only explicitly approved dependencies.
- Evidence: Root manifest, version declarations, workspace globs, and lockfile are implemented. On 2026-10-04,
  `pnpm check` verified a disposable clean frozen/offline install with unchanged manifest/lockfile hashes using
  Node.js 24.21.0 and pnpm 11.9.0. Only the seven explicitly approved direct dependencies were added.
- Blocker: None.

### T-005 - Wire compiler and Turbo quality gates

- Status: done
- Source: Plan P-003; brief AC-002, AC-003.
- Dependencies: T-004.
- Completion condition: Real tooling type-check/build, lint, format-check, and verification tasks run through
  pnpm/Turbo without recursion; compiler options match the brief and absent product tasks are honestly bounded.
- Evidence: `pnpm check` executed six real root Turbo tasks, including strict type-check/build and Oxlint/Oxfmt.
  [Workspace controls](../../../tests/verification/WorkspaceVerification.ts) proved clean inputs pass and
  invalid lint/format/type inputs fail with expected diagnostics. All seven mandated compiler controls were
  checked in the resolved configuration and exercised with negative fixtures. No product packages were created.
- Blocker: None.

### T-006 - Configure local staged-file checks

- Status: done
- Source: Plan P-004; brief AC-004.
- Dependencies: T-005.
- Completion condition: Documented hook activation and pnpm/lint-staged pre-commit invocation perform
  file-scoped Oxlint/Oxfmt compliance checks without rewriting unrelated unstaged contents.
- Evidence: Installed Husky reports `core.hooksPath=.husky/_`; the pre-commit hook invokes pnpm/lint-staged.
  Disposable hook controls proved valid staged input passes, invalid lint and formatting fail, and both unrelated
  unstaged contents and partially staged contents/index remain unchanged. No verification commits were made.
- Blocker: None.

### T-007 - Implement catalog tooling and verification fixtures

- Status: done
- Source: Plan P-005; brief AC-006.
- Dependencies: T-005.
- Completion condition: Typed catalog contracts, validator, restricted discovered-test consistency checks,
  derived reporting, and positive/negative technical fixtures implement every AC-006 case through Turbo.
  Empty inventory has no fabricated product-test results.
- Evidence: [Catalog verification](../../../tests/acceptance/validation/CatalogVerification.ts) passed 34
  rejection controls, complete/empty positive cases, restricted discovery and symbolic-link rejection, exact
  forward/reverse report assertions, and two CLI failure/report-retention controls. The actual empty catalog
  validates with zero criteria/specs and explicitly reports execution as not-run, with null outcomes.
- Blocker: None.

### T-008 - Configure independent CI and integration settings

- Status: done
- Source: Plan P-006, P-007; brief AC-005, AC-007, AC-008.
- Dependencies: T-006, T-007.
- Completion condition: GitHub Actions invokes actual applicable gates with reproducible installation and failure
  propagation. Snyk/Renovate repository configuration and owner-authorized activation steps are ready, with no scanner
  npm dependencies, credentials in files, or Renovate automerge.
- Evidence: [Quality workflow](../../../.github/workflows/quality.yml) pins actions, uses read-only permissions,
  frozen installation and `pnpm check`, and retains diagnostics on failure. [Renovate configuration](../../../renovate.json)
  recognizes pnpm, Actions, .nvmrc and .node-version and disables automerge. Owner-controlled Snyk/Renovate
  activation and recovery are documented in [CI guidance](../../Engineering/CI/Overview.md).
- Blocker: None for repository configuration. Observed remote outcomes belong to T-015.

### T-009 - Record testing-boundary applicability

- Status: done
- Source: [Plan E2E tests](Plan.md#e2e-tests); ADR-0005/0007 and public-contract test-first workflow gate.
- Dependencies: T-001.
- Completion condition: Explain whether business catalog registration, public-contract test-first evidence, library
  coverage, and full-stack E2E are applicable without inventing product packages or tests.
- Evidence: The plan documents that this tooling-only story changes no product or library public contract.
  Business registration, public-contract red tests, library coverage, and stack E2E are inapplicable; technical
  catalog fixtures and meaningful local/CI validation remain required. No product checks are claimed to have run.
- Blocker: None.

### T-010 - Integrate current main before local final validation

- Status: done
- Source: Plan P-008; [Workflow freshness gate](../../Architecture/Decisions/ADR-0006-Workflow.md#review-and-merge).
- Dependencies: T-008.
- Completion condition: Fetch origin/main, confirm inclusion or merge it without rebasing, and resolve conflicts
  without weakening approved scope. Return material requirement/design changes to approval.
- Evidence: On 2026-10-04, fetched origin/main at `3364c102cf5fa22fb13219d27bd670420e94c308` and
  `git merge-base --is-ancestor origin/main HEAD` succeeded. The existing story branch already includes current
  main; no merge, rebase, stash, commit, or alteration of uncommitted story work was needed.
- Blocker: None.

### T-011 - Verify local criteria and review ADR conformance

- Status: done
- Source: [Plan validation](Plan.md#validation); brief AC-001 through AC-009 local portions.
- Dependencies: T-009, T-010.
- Completion condition: Applicable pnpm/Turbo gates and isolated positive/negative controls pass; clean-install
  reproducibility, hook behavior, catalog rejection/reporting, documentation consistency, all active ADRs, and
  dependency approvals have evidence. Explicitly identify remote checks still awaiting publication.
- Evidence: On 2026-10-04, full `pnpm check` passed all six root gates; positive/negative controls established
  clean-install reproducibility, strict compiler settings, failure propagation, actual hook behavior, and catalog
  semantics. Git ignore checks cover dependencies, dist, Turbo cache and invocation artifacts. Diff whitespace
  and affected relative links were checked. Manual ADR review: ADR-0001/0003/0005/0006/0007/0008 conform locally;
  ADR-0002 package boundaries and ADR-0004 React rules are inapplicable without product packages/components.
  Reviewed all eight accepted ADRs, explicit dependencies, meaningful assertions, and lasting documentation.
  No application E2E, library coverage, Storybook build, or image scan is claimed.
  AC-005, AC-007, and AC-008 remote results remain outstanding under T-015; local checks do not establish human acceptance.
- Blocker: None.

### T-012 - Prepare lasting documentation and pre-review archival

- Status: done
- Source: Plan P-008; [Plan migration and rollout](Plan.md#migration-and-rollout); brief AC-009.
- Dependencies: T-011.
- Completion condition: Engineering notes describe actual setup/CI/integration recovery, technical verification
  links are present, and the story is moved to Archive with corrected indexes and references. Remote acceptance
  and merge remain visibly pending; archival does not claim delivery.
- Evidence: README, Engineering setup/CI notes, and catalog guidance link to implemented configuration and
  controls, document integration ownership/recovery, and retain future testing obligations. Archived this story
  with corrected indexes and links; location explicitly does not claim publication, remote acceptance, or delivery.
- Blocker: None.

### T-013 - Obtain commit authorization and create workspace commits

- Status: in_progress
- Source: [Workflow commit gate](../../Architecture/Decisions/ADR-0006-Workflow.md#commit-and-publish).
- Dependencies: T-012.
- Completion condition: Obtain explicit commit authorization after local verification; create appropriately
  workspace-scoped Conventional Commits with passing applicable hooks and no unrelated files.
- Evidence: On 2026-10-04, after local verification, the user explicitly requested "Commit, push and create pr".
  This grants commit authorization and, separately, publication authorization; it does not authorize merge.
- Blocker: None. Commit creation and its actual pre-commit checks are underway.

### T-014 - Obtain publication authorization and open the PR

- Status: pending
- Source: [Workflow publication gate](../../Architecture/Decisions/ADR-0006-Workflow.md#commit-and-publish).
- Dependencies: T-013.
- Completion condition: Obtain separate explicit push/PR authorization, publish this story branch, and open its
  PR targeting main with story links, local evidence, and honest integration/testing limitations.
- Evidence: The user explicitly authorized push and PR creation on 2026-10-04. Actual publication awaits T-013.
- Blocker: None.

### T-015 - Demonstrate CI and active integrations

- Status: blocked
- Source: Plan P-007, P-008; brief AC-005, AC-007, AC-008.
- Dependencies: T-014.
- Completion condition: Observe passing applicable GitHub Actions and Snyk checks for the current revision and
  dependency set; demonstrate active Renovate with recognized workspace files and proposal or no-updates evidence.
  Resolve required findings, failed checks, and activation access blockers without bypasses.
- Evidence: None yet.
- Blocker: No published revision exists. Current GitHub credentials report pull-only repository permissions.
  The owner agreed to activate Snyk and Renovate and supply scan/run evidence; no such evidence has been received.
  A published-revision Actions run and passing Snyk result remain required before acceptance.

### T-016 - Renew current-main checks and resolve review feedback

- Status: pending
- Source: [Workflow review gates](../../Architecture/Decisions/ADR-0006-Workflow.md#review-and-merge).
- Dependencies: T-015.
- Completion condition: Fetch main again, confirm freshness or merge and renew applicable local/CI verification,
  and resolve blocking feedback. Obtain new commit/push permission for revisions; any changed revision invalidates
  earlier checks/acceptance as applicable.
- Evidence: None yet.
- Blocker: None.

### T-017 - Obtain human acceptance and merge authorization

- Status: pending
- Source: [Workflow human acceptance](../../Architecture/Decisions/ADR-0006-Workflow.md#review-and-merge).
- Dependencies: T-016.
- Completion condition: Human explicitly accepts the current revision against approved criteria, meaningful
  assertions, all active ADRs, dependencies, and documentation, then explicitly authorizes merge of that revision.
  One decision may express both only while the revision remains unchanged.
- Evidence: None yet.
- Blocker: None.

### T-018 - Merge and confirm GitHub delivery

- Status: pending
- Source: [Workflow merge confirmation](../../Architecture/Decisions/ADR-0006-Workflow.md#review-and-merge).
- Dependencies: T-017.
- Completion condition: Confirm revision and current-main freshness, perform the authorized GitHub merge commit,
  and verify GitHub reports this PR merged into main. If either changed, return to renewed checks and acceptance.
- Evidence: None yet. Keep this task pending in the pre-merge archived story; GitHub is the delivery authority.
  No post-merge documentation commit is required solely to record confirmation.
- Blocker: None.

## Workflow coverage

T-001 covers discovery and branching; T-002/T-003 cover joint approval and prerequisites; T-004 through T-008
cover implementation; T-009 records justified test-first/catalog/E2E inapplicability; T-010/T-011 cover freshness,
local verification, and manual review; T-012 covers closure preparation; T-013/T-014 require separate commit and
publication permissions; T-015/T-016 cover remote checks and renewed freshness; T-017/T-018 cover human acceptance,
merge permission, and confirmed delivery.

Local implementation and verification records above reflect observed execution, not document drafting.
Commits, publication, remote verification, human acceptance, and merge remain incomplete.

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
- [Joint approval record](Plan.md#approval)
