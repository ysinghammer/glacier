---
created: 2026-10-11
tags:
  - story
---

# Enforcement baseline - Brief

This document owns why and what, not implementation design or task progress. Follow
[ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md) with proportionate detail.
Requirements and criteria are unapproved until the user approves them with the [plan](Plan.md#approval).

## Problem

Glacier's merge, commit, branch and documentation rules exist only as prose. Commits have reached `main` without a
PR, commit scopes are inconsistent, story/index drift (for example an unindexed story) went unnoticed, templates carry
a broken date token, and generated test artifacts grow without bound. Maintainers and agents spend review effort
re-checking rules that tooling could enforce deterministically.

## Intended outcome

`main` accepts changes only through a PR with a passing, up-to-date `quality` check and a merge commit; commit messages
and branch names are machine-checked locally and in CI; `pnpm check` validates the documentation structure; templates,
PR descriptions and artifact retention follow a fixed shape; and the existing documentation debt the new check finds is
fixed. This is the first of five ordered stories whose scope the user confirmed on 2026-10-11.

## Scope

- In scope: GitHub branch protection and merge settings for `main` and their documentation; commit-message checking
  (local hook and CI) with a derived scope list; branch-name checking in CI; Renovate commit scope; a documentation
  check in `pnpm check`; template date token and formatter exclusion; a PR description template; bounded retention of
  generated tooling reports; documentation debt surfaced by the documentation check.
- Also in scope (user decision OD-2, 2026-10-11): amending ADR-0006's allowed branch prefixes and commit-scope wording
  to match the enforced rules.
- Out of scope: other ADR-0006/0008 policy rewrites (tiers, human decisions, exception mechanism), skill renames or new
  skills, Oxlint rule expansion, reflection library changes, Snyk activation, CODEOWNERS, required review approvals,
  and removal of the untracked planning notes. These belong to later stories or owner actions.

## Requirements and constraints

- Protection must also apply to administrators; it must block force pushes and branch deletion; it must not require
  approving reviews (solo maintainer) or linear history. Only merge commits may be enabled for the repository.
- Allowed commit scopes must be exactly one of the workspace package directory names without the `glacier-` prefix,
  or `workspace`; the list must follow the workspace automatically when packages are added. Commit types follow
  Conventional Commits.
- Allowed branch names: `feature|bugfix|chore|refactor/<lowercase-kebab>`; Renovate branches are exempt.
- New direct dependencies are limited to the two packages named in the plan and require plan approval under
  [ADR-0001](../../Architecture/Decisions/ADR-0001-Techstack.md).
- The documentation check must add no dependency and must not apply size or machine-path limits to archived stories.
  User-owned untracked notes must not be modified.
- Existing `pnpm check` gates, hooks and CI behavior must be preserved apart from the stated additions.

## Acceptance criteria

- **AC-001 - Protected main:** A read-back of `main` protection shows required check `quality` with up-to-date
  branches, enforcement for administrators, pull requests required with 0 approvals, force pushes and deletions
  disabled, and linear history not required; repository settings allow merge commits only.
- **AC-002 - No direct pushes:** Direct pushes to `main` are rejected for every user, including administrators
  (established by AC-001's read-back of the PR requirement plus administrator enforcement).
- **AC-003 - Protection documented:** The CI note lists the exact protection and merge settings, matching AC-001.
- **AC-004 - Local commit check:** The `commit-msg` hook rejects messages with a missing, unknown or multiple scope
  or a non-conventional header, and accepts `<type>(<scope>): <subject>` with one allowed scope.
- **AC-005 - Derived scopes:** The allowed scope list equals the workspace package directory names minus `glacier-`,
  plus `workspace`, without manual maintenance.
- **AC-006 - CI commit and branch check:** On PRs, `quality` fails for any non-conforming commit in the PR range or
  a non-conforming head branch name, exempts `renovate/*` branch names, and no longer triggers on obsolete branches.
- **AC-007 - Renovate scope:** Renovate is configured to use the `workspace` commit scope, and a representative
  Renovate commit header passes the commit check.
- **AC-008 - Commit rules documented:** The dependency table lists both commit-check packages with purpose and
  scope; the commit skill states the directory-derived scope and that lockfile changes are committed with their
  manifest; both packages are exact-pinned and a frozen install succeeds.
- **AC-009 - Documentation check:** `pnpm check` runs the documentation check; it passes on the repository and fails
  for each rule class (broken link/anchor, ADR structure, story files/index, task records, template residue, active
  story size/machine path, skill name) on a negative sample.
- **AC-010 - Templates:** All templates contain the unspaced Obsidian date token and pass the formatting check.
- **AC-011 - PR template:** New PRs are prefilled with sections for tier, story link, summary, validation,
  ADR/dependency/criteria changes, and limitations.
- **AC-012 - Bounded reports:** After more than five tooling invocations of one report kind, at most the five newest
  run directories of that kind remain, and the current invocation's directory is never removed.
- **AC-013 - Documentation debt fixed:** Every story folder is indexed, no broken relative link remains, and the
  Stories and Archive indexes contain no per-story status prose.
- **AC-014 - Enforced delivery:** This story's PR passes the required `quality` check under the new protection.
- **AC-015 - Consistent policy wording:** ADR-0006 and the branching and commit skills allow exactly the branch
  prefixes `feature`, `bugfix`, `chore` and `refactor`, and define the commit scope as one package directory name
  without the `glacier-` prefix or `workspace`, matching the enforced checks.

## Open questions

None for requirements. Policy conflicts needing a user decision before approval are listed in the
[plan](Plan.md#dependencies-risks-and-open-decisions).

## References

- Confirmed scope: user-owned final optimization plan, §2 Story 1; kept outside the repository in the user's session
  storage (not linked).
- [CI](../../Engineering/CI/Overview.md), [quality workflow](../../../.github/workflows/quality.yml),
  [commit skill](../../../.github/skills/implementation-commit/SKILL.md),
  [workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md).

## Related notes

- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
