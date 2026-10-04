---
created: 2026-10-04
tags:
  - story
---

# Agent task orchestration - Plan

## Approach

Revise the existing workflow and story-documentation decisions in place, then align their summaries, task authoring
contract, and a discoverable implementation-develop skill. Main-agent implementation fallback and implicit parallelism
are excluded by the approved design. This bootstrap uses one fresh documentation worker, not invented historical
per-task agents.

## Affected areas

Exact bootstrap write scope (no package or public API changes):

- `AGENTS.md`
- `.docs/Architecture/Decisions/ADR-0006-Workflow.md`
- `.docs/Architecture/Decisions/ADR-0008-Story-documentation.md`
- `.docs/Engineering/Guidelines/Overview.md`
- `.docs/Stories/Index.md`
- `.docs/Templates/Index.md`
- `.docs/Templates/Story Tasks.md`
- `.github/skills/document-tasks/SKILL.md`
- `.github/skills/implementation-develop/SKILL.md`
- `.docs/Stories/agent-task-orchestration/Brief.md`
- `.docs/Stories/agent-task-orchestration/Plan.md`
- `.docs/Stories/agent-task-orchestration/Tasks.md`

## Implementation steps

- **P-001 - Confirm scope and approval:** Read guidance, all active ADRs, branch/dirty state, and the supplied approval.
  Dependencies: none.
- **P-002 - Establish documentation contracts:** First record the named branch exception in ADR-0006; revise
  ADR-0006/0008, summaries, task template/skill, and add the development skill and story. Dependencies: P-001.
- **P-003 - Verify documentation:** Check all five criteria, all active ADRs, relative links, sequence coverage/counts,
  graph acyclicity, skill frontmatter/discovery, changed-file Oxfmt, and reflection checksum. Dependencies: P-002.
- **P-004 - Retain future gates:** Leave closure, authorized commits/publication, current-main checks, human acceptance,
  and confirmed merge pending; use delegated fresh workers only after the respective authorization. Dependencies: P-003.

## Data, lifecycle, and failure handling

No runtime lifecycle changes. Workers own explicit paths/resources; shared Tasks evidence has one serialized writer.
Failures retain attempts and blockers and block dependents. Missing skills/delegation never permit coordinator edits.

## Validation

| Criterion | Verification method                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| AC-001    | Inspect read-only discovery, archived separation, and unconditional ask_user selection protocol.            |
| AC-002    | Inspect fresh-context, ownership, no-recursion, no-code/direct-edit, retry and stop rules.                  |
| AC-003    | Check wave counts and coverage, task DAG, readiness/barriers, shared writer and human wait rules.           |
| AC-004    | Review against all eight ADRs and inspect explicit preserved approval/test-first/Git gates.                 |
| AC-005    | Check template sections, changed relative links, skill frontmatter/discovery, Oxfmt and preserved checksum. |

Documentation-only: code builds, runtime tests, coverage, red tests, and acceptance-catalog changes are inapplicable.
Do not claim those checks ran. Applicable CI/current-main and human acceptance remain future gates, not local completion.

## E2E tests

Not applicable: no application/service public behavior changes, catalog changes, or Playwright scenarios.

## Dependencies, risks, and open decisions

No new dependencies. Risks are shared-file races, false historical evidence, and accidental reflection modification;
single-writer sequencing and an unchanged checksum mitigate them. No unresolved design decisions.

## Migration and rollout

New executions use the skill. Existing stories adopt sequence contracts when revised; no silent reflection migration
or bulk historical rewrite. Archival and publication are not authorized by this documentation task.

## Approval

The user explicitly approved this plan and criteria on 2026-10-04, as supplied verbatim in the fresh worker kickoff:
update ADR-0006/0008, workflow guidance, Story Tasks template and document-tasks; add implementation-develop with fresh
per-task workers, explicit safe execution waves, and orchestration-only main agents. This record covers P-001–P-004
and [Brief](Brief.md) AC-001–AC-005 without inventing an earlier approval or execution history.

The user separately approved the narrowly scoped ADR-0006 exception for this named documentation story on existing
`feature/glacier-reflection`, with dirty reflection Tasks preserved. No fresh-main branch creation is claimed.
Excluded permissions: branch switching, commits, push, PR, archive, merge, and dependency installation. Future human
and Git gates remain pending; this approval is not authorization to execute them.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
