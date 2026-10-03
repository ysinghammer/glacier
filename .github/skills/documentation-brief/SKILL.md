---
name: documentation-brief
description: Create or revise a story Brief.md in the Obsidian vault with implementation-independent outcomes, scope, constraints, and verifiable acceptance criteria. Use when asked to document story requirements or write a story brief.
---

Author only the story's `Brief.md`. Use `.docs/Templates/Story Brief.md` for structure,
`.docs/Stories/Index.md` for navigation, and ADR-0008 for story meaning and ADR-0006 for workflow. ADR-0007 governs
application/service criterion identity, approval, and acceptance-catalog ownership.

1. Read `AGENTS.md`, `.docs/Home.md`, the decisions index, every accepted active ADR, and relevant source and vault
   notes. Locate the intended story and read its existing brief, plan, and tasks when present. Verify repository facts
   rather than ask the user for discoverable information.
2. Before editing, follow implementation-branching: obtain permission for a new story branch or confirm the association
   of approved in-flight work. Preserve unrelated staged/unstaged changes. If the story or outcome is ambiguous, ask
   before choosing its identity or expanding scope. Do not create the other documents or alter indexes implicitly;
   report needed companion work.
3. Describe one coherent, independently reviewable outcome, including technical or documentation work. Draft
   immediately from settled intent and facts; ask only about decision-critical missing audience, outcomes, scope,
   constraints, permissions, rejection behavior, or boundaries. Do not automatically launch grilling; use an explicitly
   requested interview or recommend ideation-grilling when uncertainty warrants it.
4. Retain the template's Problem, Intended outcome, Scope, Requirements and constraints, Acceptance criteria,
   Open questions, References, and Related notes sections. Keep why/what independent of implementation choices.
   Use proportionate detail and explicit reasons for inapplicability; state when no open questions remain.
5. Give each criterion an objectively verifiable result and stable ID. For application/service behavior, record
   proposed additions/modifications/removals, catalog feature/API IDs, public Given/When/Then behavior, and source
   references under ADR-0007. Preserve IDs for the same rule and explain removals. For other work, use story-local
   IDs such as `AC-001`; do not fabricate catalog business criteria or register catalog changes through this skill.
6. Compare requirements with the existing plan/tasks and relevant approved contracts. Resolve contradictions explicitly
   with the user rather than silently redefine intent. A material change invalidates affected approval; report that
   the plan's approval record and downstream artifacts need authorized updates. Do not edit them through this skill.
7. Link to the plan's joint requirements/design approval record; do not duplicate or invent approval or an overall story
   status. If the plan does not exist, label its path as planned rather than link to a nonexistent file. An unresolved
   material requirement blocks approval unless explicitly bounded by the user. Drafting does not authorize implementation.
8. Verify section completeness, criterion identity and clarity, references, and conformance with active ADRs. Report
   the written requirements and only necessary unresolved decisions or companion updates. Do not implement code,
   approve the brief yourself, commit, push, publish, or merge.
