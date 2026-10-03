---
name: documentation-plan
description: Create or revise a story Plan.md from a sufficiently settled brief, covering executable design, sequencing, criterion verification, E2E traceability, risks, migration, and approval. Use when asked to document a story implementation plan.
---

Author only the story's `Plan.md`. Use `.docs/Templates/Story Plan.md` for structure and
ADR-0006 for workflow and approval and ADR-0008 for document ownership. Preserve ADR-0007's E2E and acceptance-catalog rules.

1. Read `AGENTS.md`, `.docs/Home.md`, the decisions index, all accepted active ADRs, relevant repository facts, and
   the intended story's brief and existing plan/tasks. Follow implementation-branching before edits, confirming the
   story association of approved in-flight work and preserving unrelated changes.
2. Require a sufficiently settled brief. If it is missing or has an unbounded material requirements gap, ask for the
   decision or have documentation-brief establish it before producing an executable plan. Do not invent requirements.
   A settled but unapproved brief may support a clearly unapproved plan draft. Report needed companion/index updates
   rather than silently author them.
3. Draft from existing architecture and approved intent. Inspect code, interfaces, tooling, dependencies, and constraints.
   Ask only for decision-critical implementation choices facts cannot settle; do not automatically start a grilling
   interview. Use planning-grilling when explicitly requested or when an authorized interview is needed.
4. Retain Approach, Affected areas, Implementation steps, Data/lifecycle/failure handling, Validation, E2E tests,
   Dependencies/risks/open decisions, Migration/rollout, Approval, and Related notes using the template's headings.
   Use stable story-local step IDs such as `P-001` and explicit sequencing/dependencies. Explain material alternatives,
   affected packages/public interfaces, applicable contracts and error/resource behavior. Keep detail proportionate;
   justify inapplicability rather than manufacture design or demand exhaustive file-by-file instructions.
5. Map every brief criterion ID to a verification method. Identify applicable test-first evidence, local/CI gates,
   manual checks, and unavailable blockers without claiming execution. Preserve the mandatory E2E section even when
   inapplicable. For application/service changes, identify proposed criterion changes, catalog feature/API/criterion/
   scenario IDs, and intended Playwright paths. Do not duplicate derived catalog reverse mappings or link planned
   files as implemented. For other work, explain E2E inapplicability and applicable validation.
6. Resolve or explicitly bound material risks and unknowns with the user before approval. Identify migration/adoption
   and recovery needs without extending workflow completion to release or deployment. New direct dependencies and
   conflicting ADR changes need explicit approval; the plan must not imply those permissions have been granted.
7. Compare the design with the brief, existing tasks, and active ADRs. Raise contradictions for an explicit decision.
   Do not silently change requirements or rewrite tasks. Material requirement/design changes invalidate affected
   approval; mark the plan unapproved until the user renews it and report necessary downstream updates.
8. In Approval, record only an actual explicit user decision, date, approved plan scope and brief criterion IDs, and
   bounded exclusions. Otherwise state unapproved. Approval covers requirements/design, not completed execution,
   commits, publication, or merge. Do not duplicate task progress or overall story status.
9. Verify all criteria have methods, steps/dependencies are coherent, sections and links are valid, and policy is
   consistent. Report the documented plan and necessary blockers. Do not implement code, create tasks, self-approve,
   commit, push, publish, or merge.
