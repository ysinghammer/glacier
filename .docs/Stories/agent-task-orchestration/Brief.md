---
created: 2026-10-04
tags:
  - story
---

# Agent task orchestration - Brief

## Problem

Story execution needs explicit worker isolation and safe concurrency without allowing the coordinating agent to
implement changes or invent task history.

## Intended outcome

Contributors can discover and select a story, then coordinate fresh bounded workers through documented execution waves
while preserving human approvals and all existing delivery gates.

## Scope

- In scope: ADR-0006/0008, agent/workflow summaries, Story Tasks template, document-tasks skill, a new
  implementation-develop skill, and this proportionate story.
- Out of scope: application behavior, dependency changes, reflection task migration, Git operations, archival,
  implementation of an automated runner, and general branch-policy weakening.

## Requirements and constraints

Main agents remain orchestration-only during execution: read-only inspection, clarification, approval requests,
dispatch, coordination, and report evaluation; no code, tests, fixes, or direct repository edits.
Every execution attempt uses a fresh worker with bounded ownership and no recursive delegation. Parallel work requires
ready dependencies and independent files/resources; shared evidence has one writer. Human gates remain human decisions.
Strict test-first and separate commit, publication, acceptance, and merge permissions remain unchanged.
Preserve existing dirty reflection tasks byte-for-byte. Record actual bootstrap evidence, never retroactive worker history.

## Acceptance criteria

These are story-local documentation criteria, not application catalog criteria.

- **AC-001 - Discovery and selection:** The development skill discovers active stories read-only, distinguishes archived
  unfinished work from delivery, and asks the user which story to execute even for one candidate.
- **AC-002 - Fresh bounded workers:** Policy and skill prohibit main-agent implementation and direct edits; every task
  attempt has a new context, bounded write/resource scope, stop policy, and no nested worker delegation.
- **AC-003 - Safe waves:** Task contracts contain numbered ordered waves with exact worker counts, prerequisites,
  ownership, and concurrency rationale; remaining tasks appear exactly once, dependencies are acyclic, human waits
  use zero workers, and evidence updates serialize.
- **AC-004 - Preserved gates:** Approval, strict test-first, validation, closure, and separate Git authorizations survive;
  unavailable delegation blocks execution rather than enabling a main-agent fallback.
- **AC-005 - Consistent adoption:** ADRs, relevant summaries, template, skills, and this complete three-document story
  agree; links and skill discovery are valid, reflection tasks remain unchanged, and the branch exception is story-specific.

## Open questions

None within the approved documentation scope.

## References

- User's explicit 2026-10-04 approval supplied in the worker kickoff; recorded in [plan approval](Plan.md#approval).
- [Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)

## Related notes

- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
