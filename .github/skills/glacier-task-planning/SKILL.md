---
name: glacier-task-planning
description: Decompose approved Glacier stories into executable tasks in a fresh planning session. Use for stable task IDs, dependency graphs, file ownership, independent checks, and explicit agent/resource approval.
---

# Glacier task planning

## Triggers

Use at phase 3 after approval of the technical story set, or when the user approves
a revision to the task execution plan.

## Inputs and prerequisites

Require a fresh planning context, integration branch/production prerequisite
revisions, readable approved ignored local epic and stories, exact approval
responses and plan content/version identifiers, prerequisite contracts, all policies,
and available session/subagent
tools. Read [workflow](../../../.policies/0013-development-workflow.md) and inspect
permitted models and current quality commands rather than assuming availability.
Isolated planners must obtain ignored local copies with matching identifiers
before work; missing/stale plans block entry. All `.plan/` files stay secret-safe,
local-only and never committed, force-added or copied into tracked locations;
tracked plans require a safe approved resolution.

## Procedure

1. Spawn one planning subagent per story as required by policy 0013. Give each the
   complete epic/story/approval context, prerequisite contracts, and policies.
   Assign only its story file; explicitly forbid product implementation and edits
   to other stories. If required delegation is unavailable, stop for resolution.
2. Add a `Tasks` section to each story. Use stable `STORY-NNN/TASK-NNN` IDs starting
   at `TASK-001`; reserve `TASK-000` for story completion, never implementation.
3. For every task specify objective, exact steps and owned files, inputs/outputs,
   acceptance criteria, tests with exact current commands and expected results,
   dependencies by ID, initial status, and completion evidence fields distinguishing
   local plan versions from actual product commit references.
4. State sequential or parallel execution explicitly, naming tasks that may run
   safely alongside it. Represent actual prerequisites, not list order. Reject
   missing dependencies, cycles, and concurrent shared-file ownership.
5. Specify each task's proposed execution-subagent count, bounded responsibilities,
   proposed available models, and complexity/risk rationale. A task needing no
   further delegation must explicitly say so; its story agent remains responsible.
   Respect user-configured defaults and override permissions.
6. Reconcile cross-story dependencies, integration revisions, and shared-file
   ownership. Check complete story-to-task coverage and independent verification
   after prerequisites. Plan isolation or serialized Git/implementation operations
   where isolated checkouts cannot be provided.
7. Present aggregate counts, concurrency, model assignments, and dependency
   schedule for explicit user approval. Record the approved configuration exactly
   and save approved ignored local task snapshots before implementation handoff.

## Outputs and handoff evidence

Each story contains a complete approved task plan with statuses/evidence fields.
Supply the fresh implementation orchestrator readable ignored local epic/story
paths, content/version identifiers and exact approval responses, separately from
the branch and production prerequisite revisions. Include prerequisite contracts,
dependency schedule, exclusive file ownership, approved resources, current checks,
and remaining blockers. Isolated receivers must obtain matching ignored local
copies before admission; product checkout alone does not supply local plans.

## Approval and stop gates

No product edits in this phase. Missing fresh context, unauthorized resource
overrides, unapproved plans, unavailable isolation without an approved serialized
resolution, cycles, or incomplete coverage blocks execution. Any later change to
approved agent counts/models requires renewed approval.
