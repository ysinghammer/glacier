---
name: implementation-closure
description: Prepare a story for final review by updating lasting docs, linking tests, and archiving the story per ADR-0006/0008. Use after verification, before PR publication.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md` ("Prepare closure") and `ADR-0008-Story-documentation.md`.
Edit only the story branch; closure changes are committed only with explicit authorization.

Before final review the PR must contain:
- lasting documentation updates (architecture, engineering, dependency/techstack notes) for what the story changed,
  and any ADR/index updates made consistently;
- completed implementation and verification tasks with evidence, in `Tasks.md`;
- the plan's `E2E tests` section updated with relative links to implemented tests and catalog entries (scenario IDs
  identify tests), or a stated reason it is not applicable;
- the story moved from `Stories/` to `Archive/`, with Stories and Archive indexes, relative links, and catalog source
  references updated without changing stable IDs.

Archived notes must distinguish pre-merge readiness from confirmed delivery: leave the final merge task pending until
GitHub confirms the merge, and do not imply delivery from the archive location. No follow-up docs commit may be
required just to record that confirmation. Do not add release, deployment, or CD steps.

Verify all changed links and indexes resolve before reporting closure ready.
