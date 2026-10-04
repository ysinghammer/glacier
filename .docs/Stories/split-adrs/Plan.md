---
created: 2026-10-03
tags:
  - story
---

# Split oversized ADRs - Plan

This document owns implementation design and verification, not requirements or execution progress.

## Approach

Move text without rewriting it. Create ADR-0007 and ADR-0008 from the existing sections, leave short pointers in
ADR-0005 and ADR-0006, then repair references. Alternatives considered: trimming wording in place (rejected here; a
separate follow-up story because it risks silent rule changes) and splitting by amending ADR-0005/0006 only with new
subsections (rejected; the decisions index asks for a numbered ADR per distinct decision).

Follow [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md); plan approval does not authorize
commits, publication, or merging. Because ADR-0006 is itself being edited, the pre-split text governs this story.

## Affected areas

- `ADR-0005-Testing-strategy.md`: remove the three moved sections; keep a pointer to ADR-0007; narrow Context and
  Consequences to testing strategy.
- `ADR-0006-Workflow.md`: remove the two moved sections; keep a pointer to ADR-0008; narrow Context and Consequences to
  the workflow; update internal references to story documents and skills.
- New `ADR-0007-Acceptance-catalog.md` and `ADR-0008-Story-documentation.md`.
- `Decisions/Index.md`, `Stories/Index.md`, `Engineering/Guidelines/Overview.md` (including the ADR-0005 anchor),
  `Templates/*`, `Architecture/*`, `Archive/Index.md`, `Engineering/Index.md`, `AGENTS.md`, and `.github/skills/*`
  where they cite moved sections.

## Implementation steps

- **P-001 - Inventory:** List every bullet, anchor, and external reference in the moved sections and every link that
  targets them. Dependencies: none.
- **P-002 - Create ADR-0007:** Move the three ADR-0005 sections verbatim; write Context (why the catalog is separate,
  alternatives such as a manual feature-to-test table), Consequences, and Related notes. Dependencies: P-001.
- **P-003 - Create ADR-0008:** Move the two ADR-0006 sections verbatim; write Context, Consequences, and Related notes.
  Dependencies: P-001.
- **P-004 - Trim ADR-0005 and ADR-0006:** Delete moved sections, add one-line pointers, divide Context/Consequences, and
  fix intra-ADR references. Dependencies: P-002, P-003.
- **P-005 - Repair references:** Update the decisions index, guidelines, stories index, templates, skills, `AGENTS.md`,
  and other notes found in P-001. Dependencies: P-004.
- **P-006 - Verify and review:** Run the checks under Validation and manually review all active ADRs for conformance.
  Dependencies: P-005.

## Data, lifecycle, and failure handling

Not applicable beyond content integrity: the risk is silently dropping or altering a rule. Mitigation is the
mechanical comparison described under Validation. No runtime behavior, data, or resources are involved.

## Validation

| Criterion | Verification method                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | Script compares moved bullets before (from `git show HEAD:`) and after, normalizing whitespace and link targets; the diff must be empty.  |
| AC-002    | Search for distinctive phrases of moved rules in ADR-0005/0006; only ADR-0007/0008 match.                                                 |
| AC-003    | Manual review of Context and Consequences of all four ADRs against the decision template.                                                 |
| AC-004    | Script resolves every relative link and `#anchor` in `.docs/`, `AGENTS.md`, `.github/skills/`; the decisions index lists both new ADRs.   |
| AC-005    | Manual review: total count of "must" bullets before equals after, and a read-through for contradictions across ADR-0001 through ADR-0008. |

Applicable gates: Oxfmt/Oxlint pre-commit checks on changed files if they cover Markdown. Code build/test/Playwright
checks are not applicable to documentation-only work and are not claimed.

## E2E tests

Not applicable: documentation-only story with no application/service feature change. Verification is described under
Validation; no entries enter the acceptance catalog.

## Dependencies, risks, and open decisions

- Risk: ADR-0006 is both the governing workflow and a subject of the change; mitigated by following its current text
  until the PR merges.
- Risk: the story-document rules reference ADR-0005's catalog identity; mitigated by linking ADR-0008 to ADR-0007.
- Open decision: numbering of the new ADRs (see the brief's open questions).

## Migration and rollout

Archived and in-flight notes that cite "ADR-0005" or "ADR-0006" for a moved rule keep working through the pointers;
links with anchors are updated. No migration of IDs.

## Approval

Approved on 2026-10-03 by the user's explicit chat decision ("Agree implement all your proposed changes"), given after
reviewing the drafted brief and plan. Scope: this plan and brief criteria AC-001 to AC-005, with ADR-0007 for the
acceptance catalog and ADR-0008 for story documentation. Bounded exclusion: wording trims, de-duplication in
`Stories/Index.md` and the guidelines, moving folder-layout trees, and splits of ADR-0001 to ADR-0004 are not approved
here. This is not authorization to commit, publish, or merge.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
