---
name: glacier-workflow
description: Coordinate a new Glacier change through discovery, fresh-agent planning, implementation, verification, user acceptance, and publication. Use to enter or resume the policy 0013 workflow and enforce its prerequisites and handoffs.
---

# Glacier workflow

## Triggers

Use for a new feature, fix, maintenance, documentation change, or resumption of
an existing epic. Questions, recommendations, and reading this skill do not
themselves authorize implementation or agent launches.

## Inputs and prerequisites

Read [all policies](../../../.policies/0001-compliance.md) and the full
[workflow](../../../.policies/0013-development-workflow.md), inspect the working
tree, and identify active accepted ADRs. Inspect available skills, session tools,
agent isolation, permitted models, current manifests, and CI commands. Require
[glacier-interview](../glacier-interview/SKILL.md) for both discovery sessions.
All `.plan/` artifacts, including approvals and status/evidence, must remain
ignored, secret-safe, local-only and never committed, force-added or copied into
tracked locations. Tracked plans block work until a safe resolution is approved.

## Procedure

1. Determine whether this is a new epic or continuation. Read existing approvals,
   planning artifacts, branch state, revisions, and evidence before resuming.
   Do not treat a renamed session as a fresh agent.
2. For a new epic, obtain Git authorization before fetching and creating the
   required integration branch from fresh `origin/main`. Follow policy 0013's
   branch types; preserve dirty/unrelated work and stop if safe switching is
   impossible. Only an explicit user request permits reuse of a clean existing
   branch; record the branch and exact approval in the local epic. Reuse does not
   authorize fetch/switch or history rewriting. Never automatically stash, reset,
   overwrite branches, or carry unrelated work into the change. Continue an epic
   on its existing branch.
3. Run [discovery](../glacier-discovery/SKILL.md), obtain epic/criterion approval,
   and save its approved ignored local snapshot before handing off.
4. Create a fresh technical agent for
   [technical planning](../glacier-technical-planning/SKILL.md). Require story
   approval and approved durable application scenarios before implementation.
5. Hand off to another fresh context for
   [task planning](../glacier-task-planning/SKILL.md). Require explicit resource,
   dependency-schedule, and task approval plus approved ignored local snapshots.
6. Hand off to a fresh [implementation](../glacier-implementation/SKILL.md)
   orchestrator. Admit dependent work only after prerequisite integration and
   story gates pass. Use only approved delegation and resource assignments.
7. Require [verification](../glacier-verification/SKILL.md) after every story and
   again for the final epic. Send accepted results to
   [acceptance and publication](../glacier-acceptance-publication/SKILL.md).

## Outputs and handoff evidence

Maintain `.plan/EPIC.md` and `.plan/stories/STORY-NNN.md` according to policy 0013,
with stable story/task IDs, approvals, statuses, exact checks, and actual product
commit evidence. Each handoff supplies readable ignored local paths, exact approval
responses and plan content/version identifiers, separately from the integration
branch and production prerequisite revisions. Include approved scope/criteria,
contracts and passing evidence, exclusive ownership, approved resources, remaining
blockers, and the receiving phase. An isolated receiver must obtain ignored local
copies with matching identifiers before admission; missing/stale plans block work.
Use host session IDs returned by tools; do not invent IDs or fresh-context availability.

## Approval and stop gates

Each phase approval is distinct: epic, technical story set, task/resources,
implementation/Git, acceptance, and publication. None grants unrelated Git, dependency, or model
permissions. Higher-priority host restrictions prevail; obtain an explicit
resolution for an unavailable required capability rather than silently omitting
a phase. Do not automatically install skills or infer permission to run a
large multi-agent workflow. No implementation before approved plans, no completion
on failed checks, and no push/PR before explicit acceptance and authorization.
