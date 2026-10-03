---
name: documentation-adr
description: Write or revise an accepted architecture decision record in the Obsidian vault. Use when asked to document an architectural decision as an ADR.
---

Use `.docs/Templates/Decision.md` as the source of truth for the ADR layout and `.docs/Architecture/Decisions/Index.md` for naming and lifecycle conventions. ADRs are living, accepted decisions, not proposals.

1. Read the relevant existing ADRs and directly affected vault notes. Check whether an ADR already covers the decision. If so, revise that ADR in place, preserving its number and `created` date; do not create a replacement for the same decision. Check that the proposed decision is consistent with other active ADRs.
2. Draft immediately from the request and verifiable repository context. Do not invent motives, rejected options, or consequences. Ask only when a decision-critical gap prevents an honest accepted record, such as an unclear choice or a conflict with another active ADR that cannot be reconciled from the request.
3. For a distinct decision, find the highest existing four-digit ADR number in `.docs/Architecture/Decisions/`, increment it, and create `ADR-<number>-<short-title>.md` there. Use the matching `# ADR-<number>: <Decision title>` heading, `status: accepted`, and the current date in `created: YYYY-MM-DD`. Add a relative Markdown link to the new record in the decisions index in the same change.
4. Write a concise Context explaining the problem and any material alternatives, a Decision that states binding rules using "must", and Consequences covering meaningful benefits, costs, and follow-up implications. Keep useful relative links to stories or other vault notes in `Related notes`; omit that section if there are none. Do not add a separate Alternatives section or empty sections to a finished ADR.
5. When revising a decision, update Context, Decision, and Consequences coherently and keep useful links. Rely on Git history rather than an in-file revision log. Reconcile directly affected techstack, dependency, and other vault notes, and update the index entry if its title or link changes.
6. Verify the ADR's number, title, frontmatter, links, and index entry, and check the updated decision against all active ADRs and directly affected notes. Present the draft for review and revise it if requested; do not silently turn an unresolved conflict or missing rationale into an accepted policy.
