---
name: glacier-acceptance-publication
description: Obtain Glacier user acceptance and publish an authorized validated epic. Use for manual-edit handoffs, safe planning cleanup, revalidation, accepted-branch push, and template-preserving PR creation.
---

# Glacier acceptance and publication

## Triggers

Use after all stories and the final epic gate pass, or when the user explicitly
returns from a manual-edit handoff and authorizes publication.

## Inputs and prerequisites

Read every policy and [workflow](../../../.policies/0013-development-workflow.md).
Require the integration branch, complete approved epic/story/task records,
completion commits, final criterion evidence, limitations, and actual Git/host
publication capabilities. Require readable approved ignored local snapshots,
exact approval responses and content/version identifiers separately from actual
product revisions/commits. Isolated receivers need matching ignored local copies
before admission; missing/stale plans block work. All `.plan/` files, including
status/evidence, stay secret-safe, local-only and never committed, force-added or
copied into tracked locations. Tracked plans block work for a safe approved
resolution. Inspect the PR template before drafting its body.

## Procedure

1. Present delivered outcomes and known limitations only after criteria and final
   checks pass. Ask for explicit user acceptance through the question tool.
   Silence is not consent; acceptance and Git publication permissions are distinct.
2. If rejected, stop automated work before cleanup/push/PR. Retain `.plan`, branch,
   commits, and local work; hand control to the user for manual edits. Do not launch
   unsolicited fixes or a replacement branch.
3. Resume only when the user explicitly says additional edits are done and approves
   publication. Inspect/preserve those edits, reconcile changed requirements and
   approvals, update ignored local evidence/snapshot identifiers, and rerun affected
   story and final epic checks (`pnpm run ci` and `pnpm exec turbo run ci --force`).
   Obtain separate permission before committing user changes, using applicable
   story/task IDs. Failed checks or withdrawn acceptance stops publication.
4. After acceptance and authorization, save the exact approved `.plan/EPIC.md`
   outside `.plan` in a recoverable secret-safe session artifact. Verify the saved
   contents against the approved snapshot's content identifier before cleanup;
   the recovery artifact must remain untracked. Durable policies/ADRs/scenarios/test links stay in place
   and must not depend on planning paths that will be removed.
5. Inspect the exact change-owned `.plan` scope. Delete only that verified directory
   with explicit permitted scope; never broad directories, unrelated files, or
   `plan`. Mixed or uncertain ownership blocks deletion. Cleanup is a local
   filesystem operation, never a planning-removal commit; do not track plans to
   manufacture a removal. Re-run applicable final quality gates and changed-link
   checks on the post-cleanup tree. On failure stop, preserving the saved epic
   and Git history for recovery.
6. Push only the accepted integration branch with an upstream, using current
   policy 0013's command and explicit authorization. Never force-push, push `main`,
   or push unrelated branches. Failure retains branch and saved epic for recovery.
7. Inspect `.github/pull_request_template.md` and `.github/PULL_REQUEST_TEMPLATE/`.
   Preserve template headings, comments, checklist items, and order. Embed the full
   approved epic under `Summary` when available, not a deleted-path link. Include
   exact validation commands and results; identify unavailable/inapplicable checks.
8. Create the PR targeting `main` with the required host tool when available;
   otherwise use the policy-permitted CLI. Do not bypass a host restriction.
   On failure retain the saved body, report whether push succeeded, and check for
   an existing PR before retrying to avoid duplicates.
9. Verify actual repository, head branch, base, and PR URL. Deliver that clickable
   URL for manual merge and stop. Do not merge automatically or start new work.
   Any required host-managed follow-through is separate from this workflow.

## Outputs and handoff evidence

Retain exact acceptance/publication approvals, manual-edit reconciliation,
post-edit and post-cleanup check results, actual implementation completion commits,
local snapshot identifiers, verified untracked saved epic
and PR body, pushed revision/upstream, and verified PR URL. A partial failure must
state precisely what succeeded and what remains blocked.

## Approval and stop gates

Absent acceptance, Git permission, saved epic, safe deletion scope, passing final
checks, or a supported publication capability blocks the affected action.
Never infer consent, lose recoverable evidence, or claim a pushed branch is a PR.
