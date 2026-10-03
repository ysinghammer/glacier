---
created: 2026-10-03
tags:
  - story
---

# Split oversized ADRs - Tasks

This document owns execution, not requirements or design. Derived from the [plan](Plan.md) and [brief](Brief.md),
following [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md). Approval is recorded in the
[plan](Plan.md#approval); no implementation task may start before it.

## Task records

### T-001 - Review guidance and active ADRs

- Status: done
- Source: workflow gate (discovery).
- Dependencies: None
- Completion condition: ADRs 0001-0006, index, templates, and skills read.
- Evidence: read during discovery in the chat session.
- Blocker: None.

### T-002 - Confirm in-flight adoption on `feature/init`

- Status: done
- Source: workflow gate (branching).
- Dependencies: None
- Completion condition: User confirmed working on `feature/init` because it alone holds the documentation.
- Evidence: user chose to stay on `feature/init`; no origin/main-based branch was created.
- Blocker: None.

### T-003 - Obtain approval of plan and brief criteria

- Status: done
- Source: workflow gate (approval); [Plan approval](Plan.md#approval).
- Dependencies: T-001, T-002
- Completion condition: Explicit user decision recorded in the plan's Approval section.
- Evidence: Recorded in the [plan's approval](Plan.md#approval).
- Blocker: None.

### T-004 - Inventory moved rules and inbound links

- Status: done
- Source: P-001.
- Dependencies: T-003
- Completion condition: Inventory of bullets and links is complete.
- Evidence: Moved sections located (ADR-0005 lines 178-263, ADR-0006 lines 33-100) and 16 inbound references found by grep.
- Blocker: None.

### T-005 - Create ADR-0007 (Acceptance catalog)

- Status: done
- Source: P-002; AC-001, AC-003.
- Dependencies: T-004
- Completion condition: File exists with template sections and verbatim moved rules.
- Evidence: Created [ADR-0007](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md); verifier reports moved text identical to the original.
- Blocker: None.

### T-006 - Create ADR-0008 (Story documentation)

- Status: done
- Source: P-003; AC-001, AC-003.
- Dependencies: T-004
- Completion condition: File exists with template sections and verbatim moved rules.
- Evidence: Created [ADR-0008](../../Architecture/Decisions/ADR-0008-Story-documentation.md); verifier reports moved text identical apart from link targets and one pointer (see Plan note).
- Blocker: None.

### T-007 - Trim ADR-0005 and ADR-0006

- Status: done
- Source: P-004; AC-002.
- Dependencies: T-005, T-006
- Completion condition: Moved sections removed, pointers added, Context/Consequences narrowed.
- Evidence: ADR-0005 now ~1,740 words and ADR-0006 ~1,930 words; each keeps a pointer section and narrowed Context/Consequences.
- Blocker: None.

### T-008 - Repair references and indexes

- Status: done
- Source: P-005; AC-004.
- Dependencies: T-007
- Completion condition: All links resolve and the decisions index lists ADR-0007/0008.
- Evidence: Decisions index, stories index, guidelines, templates, techstack/dependency notes, CI note, and three skills updated; link/anchor script found no broken links except template placeholders.
- Blocker: None.

### T-009 - Run verification and manual ADR review

- Status: done
- Source: P-006; AC-001 to AC-005.
- Dependencies: T-008
- Completion condition: Validation table checks pass with observed output; manual review recorded.
- Evidence: Scripted comparison of moved bullets (before from `/tmp` copies of HEAD) matched; 'must' count 302 before, 303 after (one added consequence sentence reworded to be non-binding afterwards); manual read-through of ADR-0005 to ADR-0008 for conflicts.
- Blocker: None.

### T-010 - Prepare closure: archive story and update indexes

- Status: pending
- Source: workflow gate (closure).
- Dependencies: T-009
- Completion condition: Story moved to `Archive/` with indexes updated; merge task left pending.
- Evidence: None yet.
- Blocker: None.

### T-011 - Obtain commit authorization and commit

- Status: pending
- Source: workflow gate (commit).
- Dependencies: T-010
- Completion condition: Explicit user authorization; package-scoped Conventional Commit made, hooks passing.
- Evidence: None yet.
- Blocker: None.

### T-012 - Obtain push/PR authorization and publish

- Status: pending
- Source: workflow gate (publication).
- Dependencies: T-011
- Completion condition: Explicit authorization; PR to `main` opened.
- Evidence: None yet.
- Blocker: None.

### T-013 - Integrate current main and pass CI

- Status: pending
- Source: workflow gate (review).
- Dependencies: T-012
- Completion condition: Branch includes fetched origin/main; CI checks pass.
- Evidence: None yet.
- Blocker: None.

### T-014 - Human acceptance and merge authorization

- Status: pending
- Source: workflow gate (review/merge).
- Dependencies: T-013
- Completion condition: Explicit human decision for the current revision.
- Evidence: None yet.
- Blocker: None.

### T-015 - GitHub confirms merge into main

- Status: pending
- Source: workflow gate (merge).
- Dependencies: T-014
- Completion condition: GitHub reports the PR merged with a merge commit.
- Evidence: None yet.
- Blocker: None.

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
