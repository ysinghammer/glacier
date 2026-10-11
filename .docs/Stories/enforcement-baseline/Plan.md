---
created: 2026-10-11
tags:
  - story
---

# Enforcement baseline - Plan

This document owns implementation design and verification, not requirements or execution progress.

## Approach

Enforce existing rules with GitHub settings and small repository tooling, in the order fixed by the user: branch
protection first (so this story itself merges through it), then commit/branch checks, then the documentation check
and the debt it surfaces. Follow [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md) as modified
only by the exceptions in [Approval](#approval); plan approval does not authorize commits, publication, or merging.

Alternatives considered (settled in the user-confirmed optimization plan, 2026-10-11):

- Built-in-only commit-message script instead of commitlint: rejected in favour of the maintained
  `@commitlint/config-conventional` rules; scope derivation stays in repository code.
- Third-party Markdown link checker: rejected; the documentation check uses Node built-ins only (no dependency).
- Repository rulesets instead of classic branch protection: classic protection via `gh api` is sufficient and is
  what the CI note will document.
- Requiring one approving review: rejected for a solo maintainer; human acceptance stays a procedural ADR-0006 gate.

## Affected areas

- GitHub repository `ysinghammer/glacier`: `main` branch protection; repository merge-method settings.
- Root `package.json`, `pnpm-lock.yaml`, `turbo.json`; new `commitlint.config.ts`, `.husky/commit-msg`.
- `.github/workflows/quality.yml`; new `.github/pull_request_template.md`; `renovate.json`; `.oxfmtignore`.
- `tests/verification/DocsVerification.ts` (new), `tests/verification/WorkspaceVerification.ts` (controls),
  `tests/reporting/ReportDirectory.service.ts`.
- Docs: [CI](../../Engineering/CI/Overview.md),
  [workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md),
  [guidelines](../../Engineering/Guidelines/Overview.md) (command table, hooks),
  [commit skill](../../../.github/skills/implementation-commit/SKILL.md), all files in
  [Templates](../../Templates/Index.md), [Stories index](../Index.md), [Archive index](../../Archive/Index.md), and
  any note with a broken link.
- [ADR-0006](../../Architecture/Decisions/ADR-0006-Workflow.md) wording and the
  [branching skill](../../../.github/skills/implementation-branching/SKILL.md) (P-012).
- No library package-root API, public UI or HTTP behavior changes.

## Implementation steps

- **P-001 - Branch protection and merge settings:** Apply, then read back and document. Dependencies: approval.
  1. `gh api -X PUT repos/ysinghammer/glacier/branches/main/protection --input -` with a JSON body on stdin (no
     scratch file; none committed): `required_status_checks: {strict: true, contexts: ["quality"]}`,
     `enforce_admins: true`, `required_pull_request_reviews: {required_approving_review_count: 0}`,
     `restrictions: null`, `allow_force_pushes: false`, `allow_deletions: false`, `required_linear_history: false`.
  2. Set merge methods with `gh api -X PATCH repos/ysinghammer/glacier` and fields `allow_merge_commit=true`,
     `allow_squash_merge=false`, `allow_rebase_merge=false` (passed with `-F`).
  3. Read back with `gh api repos/ysinghammer/glacier/branches/main/protection` and
     `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`; record the commands and a
     one-line result as task evidence.
  4. Add a `Branch protection` section to the CI note listing these exact settings, the owner-only temporary-disable
     recovery, and remove the "branch protection is out of scope" sentence.
- **P-002 - commitlint:** Add exact-pinned root devDependencies `@commitlint/cli` and
  `@commitlint/config-conventional` (latest stable versions looked up at implementation time). Add
  `commitlint.config.ts` extending the conventional config; a static-only class reads `pnpm-workspace.yaml`'s package
  globs' directories (Node built-ins) and produces `scope-enum` = directory names minus `glacier-` plus `workspace`,
  with `scope-empty: never` and an inline local plugin rule rejecting scope delimiters (`,`, `/`, `\`), because
  `scope-enum` alone accepts several valid scopes. Add
  `.husky/commit-msg` running `pnpm exec commitlint --edit "$1"`. Dependencies: P-001.
- **P-003 - Commit rule documentation:** Add both packages to the workspace dependency table (Development, workspace
  root, purpose). Update `implementation-commit`: scope = package directory name without `glacier-` (for example
  `reflection`) or `workspace`; lockfile changes are committed together with the manifest change that caused them.
  Update the guidelines' hook description. Dependencies: P-002.
- **P-004 - CI checks:** In `quality.yml`: checkout with full history; on `pull_request` add steps
  `pnpm exec commitlint --from <PR base SHA> --to <PR head SHA> --verbose` (implementation correction: the event's
  base/head SHAs replace `origin/main..HEAD`, which in a PR checkout ends at GitHub's synthetic merge commit) and a
  shell check of
  `github.head_ref` against `^(feature|bugfix|chore|refactor)/[a-z0-9]+(-[a-z0-9]+)*$`, skipped for `renovate/*`;
  pass the ref through `env`, not inline expression interpolation. Remove the `chore/initialize-workspace` push
  trigger and update the CI note's trigger description. Dependencies: P-002.
- **P-005 - Renovate scope:** Add `"semanticCommitScope": "workspace"` to `renovate.json`. Dependencies: P-002.
- **P-006 - Documentation check:** `tests/verification/DocsVerification.ts`, a static-only class (no standalone
  functions, ADR-0003) using Node built-ins, built by `build:root`; script `docs-check:root` in `package.json`, Turbo
  task `//#docs-check:root` (depends on `//#build:root`, uncached), added to `check`. Scans `.docs/**` (excluding
  `.docs/.obsidian/` and the temporary `.docs/tmp/`), `.github/**` Markdown and `AGENTS.md`. Rules:
  - relative links and heading anchors resolve (template files are exempt from link resolution because their links
    resolve only after insertion);
  - ADR filename, H1, frontmatter, Context/Decision/Consequences sections, listed in the decisions index;
  - each folder in Stories and Archive contains `Brief.md`, `Plan.md`, `Tasks.md` and is linked from its index;
  - Tasks: unique task IDs, allowed statuses, dependencies exist and are acyclic, blocked tasks name a blocker;
  - no template residue (spaced double-brace token, title placeholder, zero ADR number) outside Templates; no spaced
    double-brace token inside Templates;
  - active stories only: `Tasks.md` ≤ 40 KB (fail), `Plan.md` > 30 KB (warning), no machine-local absolute paths
    (user-home or drive-letter);
  - skill frontmatter `name` equals its folder.
    Negative controls run each rule against generated samples in the invocation report directory before the
    repository scan, following the existing verification pattern. Implementation corrections: the report kind
    `docs-verification` is added to `ReportDirectoryService`, and a `pnpm docs-check` convenience script mirrors the
    other root checks. Dependencies: P-002 (manifest serialization).
- **P-007 - Templates:** Add `.docs/Templates/` to `.oxfmtignore`; restore `{{date:YYYY-MM-DD}}` frontmatter in all
  four templates. Dependencies: P-006.
- **P-008 - PR template:** `.github/pull_request_template.md` with Tier (prompt: "Standard" until tiers are defined
  by ADR-0006), story link, change summary, validation, ADR/dependency/acceptance-criteria changes, limitations and
  follow-ups. Dependencies: none.
- **P-009 - Report retention:** After creating its directory, `ReportDirectoryService.create` prunes run directories
  under `tests/artifacts/` that contain the same kind, keeping the five newest by modification time and never the
  current one; concurrent removal (`ENOENT`) is tolerated, other errors propagate. Add a WorkspaceVerification control
  that creates more than five runs of one kind in its disposable fixture root and asserts the retained set.
  Dependencies: P-006 (shared verification files).
- **P-010 - Documentation debt:** Run the documentation check and fix its findings: index `split-adrs` and keep
  `enforcement-baseline` indexed; fix broken links; replace per-story status prose in the Stories and Archive indexes
  with plain links. Dependencies: P-006, P-007.
- **P-012 - ADR-0006 wording (OD-2):** Amend ADR-0006's branch-name rule to add `refactor/<short-description>` and
  its commit rule to "exactly one scope, either the owning package's directory name without the `glacier-` prefix or
  `workspace`"; align `implementation-branching` (prefix list) and `implementation-commit` (scope wording, examples).
  Wording only; no other policy change. Dependencies: P-002.
- **P-011 - Closure preparation:** Per ADR-0006/`implementation-closure`: lasting docs complete, story moved to
  Archive with index and link updates. Dependencies: P-001 to P-010 and verification.

## Data, lifecycle, and failure handling

- Protection is external state: failure of the PUT/PATCH (for example insufficient permission) stops P-001 and blocks
  dependants; nothing is retried with different settings. Recovery from a bad setting is a corrected PUT or
  `DELETE .../protection` by the owner, recorded as evidence.
- Hooks and CI fail closed: a commitlint or branch-name failure exits non-zero; no `continue-on-error`.
- Report pruning deletes only directories under `tests/artifacts/` containing the requested kind; deletion errors
  other than concurrent removal fail the invocation.
- The documentation check reports every violation with file and rule, exits non-zero on any failure, and writes its
  report to the invocation directory.

## Validation

| Criterion | Verification method                                                                                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | `gh api .../branches/main/protection` and `gh repo view --json ...MergeAllowed` read-back equal the P-001 settings                                                                            |
| AC-002    | Same read-back shows required PR reviews and `enforce_admins.enabled: true`; an actual push attempt is optional                                                                               |
| AC-003    | Manual comparison of the CI note section with the AC-001 read-back                                                                                                                            |
| AC-004    | WorkspaceVerification control runs the real `commit-msg` hook in its fixture: rejects no scope, unknown scope, `a,b` scope, bad type; accepts `chore(workspace): x` and `feat(reflection): x` |
| AC-005    | Same control asserts the resolved `scope-enum` equals directory names minus `glacier-` plus `workspace`                                                                                       |
| AC-006    | PR run of `quality` shows both steps passing; local negative run of the same commands with a bad message range and a bad branch name fails; workflow diff shows trigger removed               |
| AC-007    | `renovate.json` read-back; `echo "chore(workspace): update dependency x to v1.2.3" \| pnpm exec commitlint` passes                                                                            |
| AC-008    | Review of dependency table and skill text; `package.json` versions without range operators; `pnpm install --frozen-lockfile` clean                                                            |
| AC-009    | `pnpm check` green, log shows `docs-check:root`; DocsVerification negative controls each observed failing                                                                                     |
| AC-010    | Grep shows the unspaced token in all four templates; `pnpm format-check` green                                                                                                                |
| AC-011    | File review; PR body of this story's PR uses the template                                                                                                                                     |
| AC-012    | WorkspaceVerification retention control passes; `tests/artifacts/` count per kind ≤ 5 after `pnpm check`                                                                                      |
| AC-013    | `pnpm check` (docs-check) green; review of both indexes                                                                                                                                       |
| AC-014    | GitHub shows `quality` passing on the story PR's current revision under protection                                                                                                            |
| AC-015    | Review of ADR-0006 and both skills against the commitlint config and the CI branch regex                                                                                                      |

Gates: `pnpm check`, `pnpm exec turbo run test --force`, clean frozen install, `review-adr-conformance`, CI `quality`.
No public UI/HTTP or library package-root API changes, so ADR-0005/0006 public-contract test-first does not apply;
`ReportDirectoryService` is internal workspace tooling and is covered by the verification control. Before final
review, integrate current `origin/main`, repeat required checks, and obtain human acceptance of the current revision.

## E2E tests

Not applicable: tooling, configuration and documentation only; no application/service feature or acceptance-catalog
change ([ADR-0007](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)). Verification is under Validation.

## Dependencies, risks, and open decisions

- **New direct dependencies (ADR-0001):** `@commitlint/cli` and `@commitlint/config-conventional`, root
  development, exact pins. Plan approval is the required explicit approval for exactly these two packages.
- **Prerequisite - admin permission:** the default `gh` authentication has read access only; P-001 runs with the
  owner's admin-capable authentication (resolved 2026-10-11, see [Approval](#approval)).
- **Risk - TypeScript config loading:** if commitlint cannot load `commitlint.config.ts` with the workspace
  TypeScript, the bounded fallback is `commitlint.config.mjs` with the same behavior (pre-approved here).
- **Risk - Renovate messages:** `config:recommended` auto-detects semantic commits; if Renovate commits lack a
  conventional header they fail CI. Mitigation adopted: also set `"semanticCommits": "enabled"` (decision OD-3).
- **Risk - `enforce_admins` blocks urgent fixes:** fixes go through a PR; temporary disable is a recorded owner action.
- **Decision OD-1 (resolved 2026-10-11):** exceptions E-001/E-002 are recorded only in this plan's
  [Approval](#approval), not in ADR-0006; scope this story, expiry merge of its PR.
- **Decision OD-2 (resolved 2026-10-11):** ADR-0006 is amended in this story (P-012, AC-015): branch prefixes
  `feature|bugfix|chore|refactor`; commit scope is the package directory name without `glacier-` or `workspace`.
- **Decision OD-3 (resolved 2026-10-11):** `renovate.json` sets `"semanticCommits": "enabled"` alongside
  `"semanticCommitScope": "workspace"`.

## Migration and rollout

Protection applies immediately after P-001; until this story merges, `quality` lacks the new steps, which is safe.
Existing history before `origin/main` is not re-checked (CI range is `origin/main..HEAD`). Contributors need
`pnpm install` to activate the new hook. Rollback: revert the commits; protection changes are reverted by the owner.

## Approval

**Approved 2026-10-11.** After reviewing the drafted brief, plan and tasks summary (AC-001 to AC-014, T-001 to T-021)
and the open decisions, the user replied "Proceed". This approves this plan and the brief's acceptance criteria,
including the new direct root development dependencies `@commitlint/cli` and `@commitlint/config-conventional`
(ADR-0001), and the decisions below. AC-015, P-012 and T-022 record decision OD-2 within that approval.
Excluded: commit, push/PR publication and merge are **not** authorized and require separate explicit decisions.

User decisions (2026-10-11):

- **OD-1:** the two exceptions E-001 (shared current branch `feature/glacier-reflection`) and E-002 (single worker
  with waived waves/orchestration) are recorded only in this Approval section, not in ADR-0006. Scope: this story;
  expiry: merge of its PR.
- **OD-2:** amend ADR-0006 in this story: allowed branch prefixes become `feature|bugfix|chore|refactor`, and the
  commit scope is the package directory name without the `glacier-` prefix (for example `reflection`) or `workspace`,
  kept minimal and consistent with the `implementation-commit` skill.
- **OD-3:** also set `"semanticCommits": "enabled"` in `renovate.json` alongside `"semanticCommitScope": "workspace"`.
- **GitHub settings:** the default `gh` identity has read access only; the owner account (admin) applies and reads
  back the P-001 settings and is used for nothing else.

Exceptions recorded from the scope confirmation of the optimization plan (2026-10-11), confirmed by OD-1:

- **E-001 - Shared branch:** rule waived: ADR-0006 "one story branch from current `origin/main`" (and its naming and
  no-sharing rules). This story runs on the existing `feature/glacier-reflection` branch (HEAD equal to `origin/main`
  6c251c9 at drafting). Scope: this story only. Expiry: merge of this story's PR.
- **E-002 - Single worker:** rule waived: ADR-0006/ADR-0008 execution waves with worker counts and per-task fresh-
  worker orchestration. One worker executes the tasks serially in ID order; human gates and authorizations remain.
  Scope: this story only. Expiry: merge of this story's PR.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
