# Architecture decisions

Decision titles must start with `ADR-<four-digit number>: <decision>`, and filenames must start with the same zero-padded identifier (for example, `ADR-0001-Techstack.md`). Use the [decision template](../../Templates/Decision.md): accepted status, creation date, `ADR` tag, Context, Decision, and Consequences, with related links when useful. Include material alternatives in Context rather than a separate section. Binding rules in Decision must use "must".

ADRs are living records of accepted decisions. Update the existing ADR when its decision changes, keeping its original number and creation date; use Git history to track revisions. Create a new numbered ADR only for a distinct decision, and add it to this index. Every project change must be checked for conformance against all active ADRs before it is accepted. If a change conflicts with an ADR, revise the change or update the ADR before acceptance.

- [ADR-0001 Techstack](ADR-0001-Techstack.md)
- [ADR-0002 Package architecture](ADR-0002-Package-architecture.md)
- [ADR-0003 Code style](ADR-0003-Code-style.md)
- [ADR-0004 React conventions](ADR-0004-React-conventions.md)
- [ADR-0005 Testing strategy](ADR-0005-Testing-strategy.md)
- [ADR-0006 Workflow](ADR-0006-Workflow.md)
- [ADR-0007 Acceptance catalog](ADR-0007-Acceptance-catalog.md)
- [ADR-0008 Story documentation](ADR-0008-Story-documentation.md)
