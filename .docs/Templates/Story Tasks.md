---
created: { { date:YYYY-MM-DD } }
tags:
  - story
---

# [Story title] - Tasks

This document owns execution, not requirements or design. Derive tasks from the [plan](Plan.md) and
[brief](Brief.md), following [ADR-0006: Workflow](../Architecture/Decisions/ADR-0006-Workflow.md).
Draft tasks may exist before approval, but implementation must depend on approval. Do not duplicate an overall story
status or approval record here; link to the [plan's approval](Plan.md#approval).

## Task records

Use stable story-local IDs; never renumber or reuse an ID for unrelated work. Use only `pending`, `in_progress`,
`blocked`, or `done` for status. Dependencies are task IDs, must be acyclic, and must be satisfied before dependent
execution. Record "None" when a field genuinely has no dependencies, evidence yet, or blocker.

### T-001 - [Concrete action]

- Status: pending
- Source: [Plan step P-001](Plan.md#implementation-steps), criterion ID, or applicable workflow gate.
- Dependencies: None.
- Completion condition: [Objectively checkable result.]
- Evidence: None yet. When done, record the result, observed check, or explicit authorization and link it if available.
- Blocker: None. When blocked, describe what must be resolved and by whom.

Repeat this record for actionable implementation and verification tasks. Keep task size proportionate; do not
introduce new requirements, copy the design, infer approval, or claim a check or authorization that has not occurred.
For a genuinely inapplicable gate, record the rationale as its completion evidence rather than claim execution.

## Execution sequence

Declare numbered stable wave IDs in dispatch order. Each actionable task appears exactly once in the remaining
planned sequence. Preserve completed historical rows/evidence separately, without implying future dispatch.

| Wave/order | Task IDs | Exact concurrent workers | Prerequisites                         | Owned files/resources   | Concurrency rationale              |
| ---------- | -------- | ------------------------ | ------------------------------------- | ----------------------- | ---------------------------------- |
| W-001 / 1  | T-001    | 1                        | [Completed dependencies and approval] | [Exact paths/resources] | [Why serial or safely independent] |

For each human gate use `0 while waiting; fresh 1 after authorization for verification`, not an agent deciding approval.
Check acyclic dependencies, earlier completion, and readiness at dispatch; whole-wave barriers are safe.
Parallelize only ready independent write/resource scopes. Serialize global gates, manifests/lockfiles/root exports,
shared docs and mutable resources unless demonstrably isolated. Shared Tasks has one writer: serialize evidence-worker
or task-worker updates, never concurrent writes. Runtime limits may lower concurrency through an explicit worker-authored
revision; never increase unsafely. Each attempt gets a fresh worker/context with no recursive delegation or reuse.
Log actual attempts, scope, results/checks and failures in task evidence; preserve IDs and block dependents on failure.
Do not invent historical workers or infer all tasks can run in parallel.

## Workflow coverage

Create task records for applicable gates, not merely this reminder list:

- Guidance and active-ADR review; outcome/scope discovery; story branch isolation or confirmed in-flight adoption.
- Explicit user approval of the plan and brief criteria; applicable dependency and conflicting-ADR approvals.
- Application criterion/scenario registration before feature implementation, where applicable.
- Public-contract test-first evidence before public behavior/type-contract implementation, where applicable.
- Implementation, acceptance-criterion verification, applicable local checks, and manual ADR/contract review.
- Lasting documentation, implemented E2E/catalog links or justified inapplicability, and pre-review archival preparation.
- Separately authorized commits with applicable hooks, then separately authorized push and PR publication.
- Current-main integration, renewed local/CI checks, and resolution of blocking review feedback.
- Human acceptance and explicit merge authorization for the current revision.
- GitHub confirmation of a merge commit into main.

Behavioral or material design changes return to the approval gate. Changed PR revisions require renewed checks and
acceptance. Archiving means pre-merge preparation, not confirmed delivery; leave the final merge task pending until
GitHub confirms the merge. GitHub is the delivery authority; no post-merge documentation commit is required solely
to update this record.

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
