---
name: document-tasks
description: Create or revise a story Tasks.md from a sufficiently concrete plan with stable task IDs, statuses, dependencies, completion conditions, blockers, and evidence. Use when asked to document story execution tasks or update their progress.
---

Author only the story's `Tasks.md`. Use `.docs/Templates/Story Tasks.md` for task records and
ADR-0006 for workflow gates and ADR-0008 for task records. Preserve ADR-0007's criterion, test-first, and E2E obligations.

1. Read `AGENTS.md`, `.docs/Home.md`, the decisions index, all accepted active ADRs, and the intended story's brief,
   plan, and existing tasks. Inspect relevant repository facts. Follow implementation-branching before edits, confirm
   approved in-flight story association, and preserve unrelated work.
2. Require a sufficiently concrete plan and its criteria. If missing or materially ambiguous, ask for the blocking
   decision or have documentation-plan establish it. Tasks may be drafted from an unapproved plan, but implementation
   tasks must depend on explicit approval. Do not invent requirements or choices to fill gaps.
3. Derive actionable records from plan steps, acceptance criteria, and applicable workflow gates. Use stable story-local
   IDs such as `T-001`; preserve IDs when revising the same task and never renumber or reuse them. Each record must name
   its action, status, source reference, task dependencies, completion condition, evidence, and blocker. Keep task size
   proportionate and reference design rather than copy it.
4. Use only `pending`, `in_progress`, `blocked`, and `done`. Dependencies must exist, be acyclic, and be satisfied before
   dependent execution. Record none where appropriate. Blocked tasks must describe the actual blocker and needed
   resolution. A done task must have observed results or explicit authorization satisfying its completion condition;
   verify user-reported evidence where discoverable. Never infer completion from document existence or approval.
5. Include applicable discovery/branch adoption, plan/criteria approval, dependency/ADR approval, catalog registration,
   public-contract test-first, implementation, validation, documentation/archival, commit, publication, current-main
   integration/checks, human acceptance, and merge gates. Record justified inapplicability instead of claiming a check
   ran. Do not fabricate historical branching, approvals, failing-test evidence, or successful tooling execution.
6. For progress updates, verify what occurred and preserve unrelated records. A failed check or unmet prerequisite must
   remain visible. Changed PR revisions invalidate affected checks/acceptance/merge permission. If the dependency graph
   or plan has become inconsistent, ask for the needed decision and report companion plan/brief updates; do not silently
   rewrite them. Do not automatically launch a grilling interview.
7. Link to the plan's approval record instead of duplicating it or an overall story status. Archive location does not
   mean delivery. Keep the final merge task pending until GitHub confirms a merge commit into main; GitHub remains
   authoritative, with no post-merge documentation commit required solely to update the note.
8. Verify task identity, sources, dependency ordering, completion conditions, evidence, blockers, links, and gate
   coverage. Report documented progress and necessary blockers. Invoking this skill does not execute tasks, change
   code, grant approval, commit, push, publish, or merge.
