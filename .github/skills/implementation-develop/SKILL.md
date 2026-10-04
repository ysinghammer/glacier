---
name: implementation-develop
description: Execute an approved story by discovering open stories, asking which to execute, and orchestrating fresh bounded agents per task through explicit safe execution waves. Main agents never write code, tests, fixes, or directly edit repository files.
---

Follow [ADR-0006](../../../.docs/Architecture/Decisions/ADR-0006-Workflow.md) and
[ADR-0008](../../../.docs/Architecture/Decisions/ADR-0008-Story-documentation.md).
This skill coordinates execution, not approval or Git authorization.

## Discovery and readiness

1. Read AGENTS.md and .docs/Home.md. Discover current open stories read-only from `.docs/Stories/Index.md` and actual
   active story directories; reconcile discrepancies rather than rely on the index alone. Inspect Archive indexes and
   task records for unfinished archived stories and surface them separately as pre-merge/unfinished, never delivered
   merely because archived. Use `ask_user` to ask which story to execute, even if only one candidate exists. Do not
   infer selection or implementation permission from discovery.
2. Load the selected Brief, Plan, Tasks, decisions index, all accepted active ADRs, relevant guidance and branch/dirty
   state. Verify explicit approved requirements/criteria and plan scope; do not invent approval. Follow branch policy
   and protect unrelated work. Verify stable IDs, sources, acyclic dependencies, exact remaining-task sequence coverage,
   numbered wave order/counts, prerequisites and independent ownership. Historical evidence remains historical.
3. If sequence or task contracts are missing/stale, dispatch a fresh bounded `document-tasks` worker owning only the
   selected Tasks.md to repair them. Missing requirements/design approvals require user clarification and the relevant
   document worker, not guessed decisions. Re-read concise evidence before dispatching implementation. Missing skills,
   ask_user, or delegation capability are explicit blockers; never fall back to main-agent implementation.

## Main-agent boundary and worker dispatch

4. Main agents may only inspect read-only, clarify/request user approval, dispatch/coordinate, evaluate concise worker
   reports and report results/blockers. Never author code, tests, fixes, or directly edit repository files, even for
   small changes, failed checks, formatting, or documentation. Do not run implementation fixes. Delegate checks and
   all repository/status/evidence edits to workers. This boundary applies throughout story execution.
5. Each task execution attempt gets a NEW agent and fresh context. Never reuse a worker for another task or retry;
   workers must not recursively delegate. A bounded prompt must contain:
   - Stable task ID and attempt number; objective and completion condition.
   - Brief criteria, plan steps, sources, approved design and active-ADR obligations.
   - Dependencies and their observed completion evidence.
   - Exact allowed write paths and file/resource scope, protected unrelated paths and shared evidence ownership.
   - Applicable skills to invoke, required checks and expected evidence, including strict public-contract test-first.
   - Failure/stop policy: stop on unavailable prerequisites, scope/design conflict or unapproved changes; report
     concise results/checks/blockers, do not broaden scope, recursively delegate, or perform unapproved Git operations.
6. Before EVERY wave declare task IDs, exact planned concurrent worker count, prerequisites, owned paths/resources,
   and why safe parallel or why serial, matching the documented sequence. Check earlier completion and dependency
   readiness at dispatch. Dispatch only ready tasks with independent scopes; task count alone never proves safety.
   Whole-wave barriers are permitted. Wait for relevant workers and evaluate concise reports; do not ingest full verbose
   logs unnecessarily. Inspect targeted evidence read-only if a report is insufficient.
7. Global gates, manifests/lockfiles/root exports, shared documentation and mutable resources serialize unless
   demonstrably isolated. Shared Tasks.md always has one writer: serialize task-worker evidence updates or assign a
   separate fresh evidence-writing task with explicit sequence coverage. Never give concurrent workers Tasks write
   permission. Coordinate reports before that writer updates statuses/evidence.
8. Runtime restrictions can reduce concurrency only with an explicit worker-authored sequence revision. Do not increase
   concurrency unsafely. Human-gate rows wait with 0 workers; request the user's decision, never approve on their behalf.
   After authorization dispatch a fresh 1-worker gate-verification attempt to record evidence and perform only the
   separately authorized actions.

## Failure, verification, and closure

9. On failure retain the stable task ID and log actual attempts/results in evidence through the single writer; block
   dependents. Dispatch a fresh bounded recovery agent/context for each new attempt, not the failed worker. Corrections
   preserving approved design may proceed within scope; material changes return to approval. Missing delegation or
   applicable skills/gates remain blockers, never a main-code fallback.
10. Preserve catalog-before-feature and strict red/green/refactor public-contract evidence under ADR-0005/0007.
    Delegate applicable verification and review-adr-conformance; unavailable checks block acceptance. Documentation-only
    work verifies conformance, consistency and links without claiming code tests/builds ran.
11. Delegate closure, current-main integration, commits, publication and merge using their separate skills
    (`implementation-closure`, `implementation-main-sync`, `implementation-verification`, `implementation-commit`,
    `implementation-publish-pr`, `review-merge`) only within explicit authorization. Do not treat story approval as
    commit/push/PR/archive/merge permission. Preserve human acceptance and renewed checks for changed revisions.
    GitHub-confirmed merge into main alone establishes delivery; archived unfinished notes do not.
