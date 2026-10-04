---
name: review-adr-conformance
description: Review a diff or plan against every accepted, active ADR, dependency approvals, and documentation consistency. Use before human acceptance, for documentation-only changes, or when asked to check conformance.
---

Follow `.docs/Architecture/Decisions/Index.md`. Read the index and **every** accepted, active ADR in that directory
(do not rely on memory); then inspect the working diff or branch diff (`git diff origin/main...HEAD`).

For each ADR, state conforming, violating, or not applicable, with file/line evidence for violations. Also check:

- new direct runtime/dev dependencies are approved in the dependency tables (ADR-0001) and no unapproved ones appear;
- package boundaries and package-root API usage (ADR-0002), code style (ADR-0003), React conventions (ADR-0004),
  testing and catalog rules (ADR-0005, ADR-0007), workflow and story documents (ADR-0006, ADR-0008);
- affected wiki notes, indexes, and relative links are consistent and valid;
- test assertions genuinely establish their claimed behavior.

Output a concise findings list ordered by severity; report only real conflicts, not style preferences. A conflict
requires revising the change or updating the ADR first; never silently disregard it. This is review assistance and
does not replace explicit human acceptance.
