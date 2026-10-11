---
name: glacier-implementation
description: Execute approved Glacier stories and tasks in a fresh orchestrator with dependency-aware integration. Use for bounded implementation, authorized agents/commits, independent checks, and story completion evidence.
---

# Glacier implementation

## Triggers

Use at phase 4 only after epic, stories, tasks, and resources are approved, or to
resume their explicitly authorized execution.

## Inputs and prerequisites

Require a fresh orchestrator context; committed epic/story/task plans; integration
branch and prerequisite revisions; exact approvals; all policies; active ADRs;
available isolation/delegation; and authorized Git operations.
Read [workflow](../../../.policies/0013-development-workflow.md) in full.

## Procedure

1. Inspect current branch/worktree and reconcile the actual state with approved
   plans. Do not overwrite user work or treat uncommitted changes as integrated
   prerequisite evidence. Stop on conflicting edits.
2. Spawn a story agent for each story, admitting dependent stories only after
   prerequisite integration and CI-equivalent story gates pass. Story agents
   spawn only approved task subagents with approved responsibilities/resources.
3. Concurrent implementation requires isolated worktrees/checkouts and exclusive
   file ownership. Derive internal work from the epic branch at the required
   revision, not unrelated `main`. If isolation is unavailable, obtain resolution
   and serialize implementation and Git operations while retaining fresh contexts.
   Never let agents independently stage/commit in the same shared checkout.
4. Task agents implement only approved scope, applying
   [architecture review](../glacier-architecture-review/SKILL.md),
   [library contracts](../glacier-library-contracts/SKILL.md),
   [acceptance scenarios](../glacier-acceptance-scenarios/SKILL.md), and
   [React/Storybook](../glacier-react-storybook/SKILL.md) where applicable.
   Preserve behavior, wire all affected surfaces, and update related docs/tests.
5. Run independent task checks and the code-change compliance gates from policies
   0001/0013 through current pnpm/Turborepo tasks. Record exact results and
   limitations. Failed/unavailable checks block task completion.
6. Update task evidence and create its own authorized completion commit. Read
   current scope rules; subjects include story/task numbers, for example
   `feat(reflection): STORY-001 TASK-002 add public metadata lookup`.
   Bodies explain meaningful changes and include required agent attribution.
   Stage only owned changes; never bypass hooks or amend without permission.
7. Integrate task history in dependency order. Story agents verify task integration,
   run [verification](../glacier-verification/SKILL.md), and commit the story's
   completion record using `TASK-000`, even if task commits contain all product work.
8. Integrate stories onto the epic branch preserving task/story history. Resolve
   conflicts and rerun affected checks before releasing dependents. After every
   story passes, rerun the final integrated epic gate before acceptance.

## Outputs and handoff evidence

Maintain task/story status, owned changes, independent criterion evidence, exact
commands/results, commit references, prerequisite revisions, and blockers in the
approved story files. Supply final epic outcomes and evidence to
[acceptance and publication](../glacier-acceptance-publication/SKILL.md).

## Approval and stop gates

No unapproved scope, dependency additions, agents, or model/count changes.
Missing prerequisites, unsafe ownership, unavailable checks, failed integration,
or absent commit authorization stops the affected work and its dependents.
Implementation approval is not user acceptance or permission to push/publish.
