---
created: 2026-10-11
tags:
  - story
---

# Enforcement baseline - Tasks

This document owns execution, not requirements or design. Derive tasks from the [plan](Plan.md) and
[brief](Brief.md), following [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md).
Implementation depends on the [plan's approval](Plan.md#approval).

## Task records

### T-001 - Confirm guidance review and in-flight branch adoption

- Status: done
- Source: workflow gate (discovery, branch isolation under exception E-001 in [Approval](Plan.md#approval)).
- Dependencies: None.
- Completion condition: Active ADRs read; current branch is `feature/glacier-reflection` with HEAD equal to freshly
  fetched `origin/main` or containing it; unrelated untracked user notes untouched.
- Evidence: Done 2026-10-11: ADRs and story read; `git merge-base --is-ancestor origin/main HEAD` true (both `6c251c9`); user notes untouched.
- Blocker: None.

### T-002 - Obtain plan, criteria, dependency and decision approval

- Status: done
- Source: workflow gate; [Approval](Plan.md#approval), AC-001 to AC-014, OD-1 to OD-3.
- Dependencies: T-001.
- Completion condition: Explicit user approval recorded in the plan, naming `@commitlint/cli` and
  `@commitlint/config-conventional` and resolving OD-1 to OD-3.
- Evidence: Done 2026-10-11: user replied "Proceed"; OD-1 to OD-3 and both commitlint packages recorded in [Approval](Plan.md#approval).
- Blocker: None.

### T-003 - Apply and read back branch protection and merge settings

- Status: done
- Source: [P-001](Plan.md#implementation-steps); AC-001, AC-002.
- Dependencies: T-002.
- Completion condition: Exact PUT/PATCH commands executed; read-back JSON matches every P-001 setting.
- Evidence: Done: `gh api -X PUT …/branches/main/protection` + `PATCH repos/ysinghammer/glacier` (owner auth); read-back strict true, contexts `[quality]`, enforce_admins true, approvals 0, force pushes/deletions false, restrictions null; merge commit only.
- Blocker: None.

### T-004 - Document branch protection in the CI note

- Status: done
- Source: P-001; AC-003.
- Dependencies: T-003.
- Completion condition: CI note `Branch protection` section matches the T-003 read-back; out-of-scope sentence removed.
- Evidence: Done: CI note `Branch protection` section matches the T-003 read-back; out-of-scope sentence removed.
- Blocker: None.

### T-005 - Add commitlint dependencies, config and commit-msg hook

- Status: done
- Source: P-002; AC-004, AC-005, AC-008.
- Dependencies: T-002, T-003.
- Completion condition: Both packages exact-pinned in root devDependencies with lockfile; config derives scopes;
  hook rejects/accepts the AC-004 samples when run manually.
- Evidence: Done: `pnpm add -D -w --save-exact` @commitlint/cli and config-conventional 21.2.3; `echo … | pnpm exec commitlint` accepts `chore(workspace)`/`feat(reflection)`, rejects no/unknown/multi scope, bad type; hook exit bad 1 / good 0.
- Blocker: None.

### T-006 - Document commit rules and dependencies

- Status: done
- Source: P-003; AC-008.
- Dependencies: T-005.
- Completion condition: Dependency table rows, commit skill scope and lockfile rule, guidelines hook text updated.
- Evidence: Done: dependency rows, commit skill (directory scope, single scope, lockfile with manifest) and guidelines hook text updated.
- Blocker: None.

### T-007 - Add CI commit and branch-name checks; drop stale trigger

- Status: done
- Source: P-004; AC-006.
- Dependencies: T-005.
- Completion condition: Workflow has both PR steps and no `chore/initialize-workspace` trigger; local negative runs
  fail; CI note trigger text updated.
- Evidence: Done: quality.yml PR steps (branch regex, commitlint on PR base/head SHAs), stale trigger removed; local branch script rejects `Feature/Bad`, `fix/x`; commitlint range `98ebe5b~1..98ebe5b` exit 1.
- Blocker: None.

### T-008 - Set Renovate commit scope

- Status: done
- Source: P-005; AC-007.
- Dependencies: T-005.
- Completion condition: `renovate.json` contains the scope (and OD-3 outcome); sample Renovate header passes commitlint.
- Evidence: Done: `renovate.json` semanticCommits enabled + scope workspace; sample `chore(workspace): update dependency x to v2` passes commitlint.
- Blocker: None.

### T-009 - Implement the documentation check and wire it into pnpm check

- Status: done
- Source: P-006; AC-009.
- Dependencies: T-005.
- Completion condition: `docs-check:root` runs in `pnpm check`; each rule's negative control observed failing.
- Evidence: Done: `tests/verification/DocsVerification.ts` wired as `docs-check:root`; 19 negative controls observed failing, repository clean.
- Blocker: None.

### T-010 - Restore template date tokens and exclude templates from formatting

- Status: done
- Source: P-007; AC-010.
- Dependencies: T-009.
- Completion condition: Four templates contain the unspaced token; `pnpm format-check` green.
- Evidence: Done: templates ignored in `.oxfmtignore`; four templates contain `{{date:YYYY-MM-DD}}` (grep); oxfmt leaves them unchanged.
- Blocker: None.

### T-011 - Add the PR template

- Status: done
- Source: P-008; AC-011.
- Dependencies: T-002.
- Completion condition: `.github/pull_request_template.md` contains all AC-011 sections.
- Evidence: Done: `.github/pull_request_template.md` with Tier, Story, Summary, Validation, ADR/dependency/criteria changes, Limitations.
- Blocker: None.

### T-012 - Bound tooling report retention

- Status: done
- Source: P-009; AC-012.
- Dependencies: T-009.
- Completion condition: Retention control in WorkspaceVerification passes; at most five runs per kind remain.
- Evidence: Done: red observed first (`verifyReportRetention`: 7 runs retained, expected 5), then pruning in `ReportDirectoryService.create`; tooling-check green; ≤5 runs per kind in `tests/artifacts`.
- Blocker: None.

### T-013 - Fix documentation debt found by the documentation check

- Status: done
- Source: P-010; AC-013.
- Dependencies: T-009, T-010.
- Completion condition: Documentation check green; both indexes list stories without status prose.
- Evidence: Done: `split-adrs` indexed; Stories and Archive indexes list links without status prose; docs check green.
- Blocker: None.

### T-014 - Run local verification

- Status: done
- Source: workflow gate (`implementation-verification`); [Validation](Plan.md#validation).
- Dependencies: T-004, T-006, T-007, T-008, T-011, T-012, T-013, T-022.
- Completion condition: `pnpm check`, `pnpm exec turbo run test --force` and a clean frozen install pass; every
  locally verifiable criterion's method observed.
- Evidence: Attempt 1 (2026-10-11): 12/13 green; `format-check:root` failed only on untracked user notes, since moved out of the repo by the user.
  Attempt 2 (2026-10-11, Node 24.21.0 / pnpm 11.9.0): `pnpm check` 13/13 Turbo tasks successful (format, docs, tooling, 570 tests at 100% coverage).
- Blocker: None.

### T-015 - Review ADR conformance

- Status: pending
- Source: workflow gate (`review-adr-conformance`).
- Dependencies: T-014.
- Completion condition: No unresolved conflict with any active ADR, considering OD-1/OD-2 outcomes.
- Evidence: None.
- Blocker: None.

### T-016 - Prepare closure and archive the story

- Status: pending
- Source: [P-011](Plan.md#implementation-steps); workflow gate (`implementation-closure`).
- Dependencies: T-015.
- Completion condition: Story moved to Archive; indexes and links updated; documentation check green.
- Evidence: None.
- Blocker: None.

### T-017 - Commit after explicit authorization

- Status: pending
- Source: workflow gate (commit); `implementation-commit`.
- Dependencies: T-016.
- Completion condition: Explicit user commit authorization; package-scoped commits pass pre-commit and commit-msg hooks.
- Evidence: None.
- Blocker: None.

### T-018 - Push and open the PR after explicit authorization

- Status: pending
- Source: workflow gate (publication); `implementation-publish-pr`; AC-011.
- Dependencies: T-017.
- Completion condition: Explicit authorization; PR to `main` opened using the PR template and linking this story.
- Evidence: None.
- Blocker: None.

### T-019 - Integrate current main and pass CI

- Status: pending
- Source: workflow gate (current-main integration); AC-006, AC-014.
- Dependencies: T-018.
- Completion condition: Branch contains freshly fetched `origin/main`; `quality` passes on the current revision.
- Evidence: None.
- Blocker: None.

### T-020 - Obtain human acceptance and merge authorization

- Status: pending
- Source: workflow gate (human acceptance, merge authorization).
- Dependencies: T-019.
- Completion condition: Explicit user acceptance and merge authorization for the current PR revision.
- Evidence: None.
- Blocker: None.

### T-021 - Merge with a merge commit and confirm on GitHub

- Status: pending
- Source: workflow gate (merge).
- Dependencies: T-020.
- Completion condition: GitHub reports the PR merged into `main` by merge commit. Stays pending until confirmed.
- Evidence: None.
- Blocker: None.

### T-022 - Amend ADR-0006 branch prefixes and commit scope (OD-2)

- Status: done
- Source: [P-012](Plan.md#implementation-steps); AC-015; OD-2.
- Dependencies: T-002.
- Completion condition: ADR-0006 and the branching and commit skills allow `feature|bugfix|chore|refactor` and define
  the scope as the package directory name without `glacier-` or `workspace`.
- Evidence: Done: ADR-0006 branch and commit rules amended; `implementation-branching` adds `refactor`; commit skill
  matches `commitlint.config.ts` and the CI branch regex.
- Blocker: None.

## Execution sequence

Waived by exception E-002 in the [plan's approval](Plan.md#approval): one worker executes tasks serially in ID order,
respecting dependencies; human gates (T-002, T-017, T-018, T-020) wait for explicit user decisions.

## Workflow coverage

Discovery and branch adoption (T-001), approval and dependency approval (T-002), implementation (T-003 to T-013, T-022),
verification and conformance (T-014, T-015), closure (T-016), commit and publication (T-017, T-018), current-main
integration and CI (T-019), acceptance and merge (T-020, T-021). Catalog registration and public-contract test-first
are not applicable (no application/service or library API change; see [Validation](Plan.md#validation)).

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
