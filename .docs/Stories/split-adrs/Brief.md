---
created: 2026-10-03
tags:
  - story
---

# Split oversized ADRs - Brief

This document owns why and what, not implementation design or task progress. Follow
[ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md) with proportionate detail.
Requirements and criteria are unapproved until the user approves them with the [plan](Plan.md#approval).

## Problem

ADR-0005 (about 2,700 words) and ADR-0006 (about 2,900 words) each record more than one distinct decision. ADR-0005
combines the test strategy with the acceptance-criteria and catalog lifecycle. ADR-0006 combines the delivery workflow
with the story-document model and its authoring skills. Contributors and maintainers must read and amend a large ADR to
change one subject, and the [decisions index](../../Architecture/Decisions/Index.md) asks for a new ADR per distinct
decision.

## Intended outcome

Each of the four affected subjects has its own focused ADR with unchanged binding rules, and every reference to a moved
rule resolves to its new location.

## Scope

- In scope: extract the acceptance-criteria lifecycle, acceptance catalog, and story-plan E2E traceability rules from
  ADR-0005 into a new ADR-0007; extract the story-meaning, document-ownership, and story-documentation-skill rules from
  ADR-0006 into a new ADR-0008; update the decisions index, ADR cross-references, indexes, guidelines, templates, and
  skills that cite moved sections.
- Out of scope: changing, adding, or removing any binding rule; rewording for brevity; removing duplication in
  `Stories/Index.md` or the engineering guidelines; moving the folder-layout trees out of ADR-0005; splitting
  ADR-0001 through ADR-0004.

## Requirements and constraints

- Moved rules must keep their meaning and "must" wording; only surrounding Context and Consequences text is divided to
  match each ADR's subject.
- ADR-0005 and ADR-0006 keep their numbers, titles, and creation dates. New ADRs follow the
  [decision template](../../Templates/Decision.md) and the decisions index conventions (accepted status, `ADR` tag,
  Context, Decision, Consequences).
- Every ADR stays internally consistent: no dangling reference to a section that moved, and the remaining and new ADRs
  link to each other where they depend on one another.
- Stable identity rules (acceptance criterion IDs, `AC-`/`P-`/`T-` IDs) are unchanged and remain stated exactly once.
- All active ADRs, including the two new ones, remain binding and are checked together.

## Acceptance criteria

Documentation-only story; criteria are story-local and do not enter the application acceptance catalog.

- **AC-001 - Rule preservation:** Every binding bullet formerly under the moved ADR-0005 sections ("Acceptance criteria
  lifecycle and structure", "Acceptance catalog and verification", "Story plans and traceability") appears verbatim in
  ADR-0007, and every binding bullet formerly under the moved ADR-0006 sections ("Story meaning and document
  ownership", "Story documentation skills") appears verbatim in ADR-0008, except for link-target updates and the replacement of one relative phrase ("closure rules below") with a link to ADR-0006. No other
  binding text in ADR-0005 or ADR-0006 changes.
- **AC-002 - Single ownership:** No moved rule remains in its original ADR. ADR-0005 and ADR-0006 each retain only a
  short cross-reference to the ADR that now owns the subject.
- **AC-003 - Focused decisions:** ADR-0007 and ADR-0008 each have Context, Decision, and Consequences sections that
  describe only their own subject, and an ADR-0005/ADR-0006 split rationale is visible in Context.
- **AC-004 - Resolving references:** All relative links and anchors in `.docs/`, `AGENTS.md`, and `.github/skills/`
  that pointed to a moved section target its new location, the decisions index lists ADR-0007 and ADR-0008, and no
  broken wiki link remains.
- **AC-005 - Semantic parity:** A reviewer comparing the rules before and after finds the same binding requirements in
  total, with no new, lost, or contradicting rule across ADR-0001 through ADR-0008.

## Open questions

- Confirm the proposed numbering: ADR-0007 for the acceptance catalog and ADR-0008 for the story documentation model.
  Default if unanswered: as stated.

## References

- [Decisions index](../../Architecture/Decisions/Index.md)
- [ADR-0005: Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)

## Related notes

- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
