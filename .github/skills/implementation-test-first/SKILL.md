---
name: implementation-test-first
description: Apply strict test-first development to public UI, public HTTP, and library package-root API changes per ADR-0005/0006. Use before implementing such behavior.
---

Follow `.docs/Architecture/Decisions/ADR-0006-Workflow.md` and `ADR-0005-Testing-strategy.md`. Start only after the story
plan and acceptance criteria are approved and, for application/service behavior, the criteria are in the acceptance
catalog (see `documentation-acceptance-catalog`).

Applies to every change to publicly accessible application UI, public HTTP behavior, or library package-root API
behavior. Behavior-preserving internal refactors, documentation, and tooling keep applicable verification but need no
artificial red test.

1. Write or update a meaningful public-contract test for the approved criterion/scenario:
   - applications/services: Playwright through the public UI/HTTP surface;
   - libraries: Vitest importing only the curated package-root exports;
   - type-only API changes: a type-contract check that fails on the old types.
2. Run it and observe the **expected contract failure**. Missing tooling, startup errors, import errors, or unrelated
   failures do not count; fix them and rerun until the failure is the intended assertion.
3. Implement the minimum behavior.
4. Rerun until green, then refactor with the tests passing.

Removals: first obtain approval of the changed requirement, then test the intended resulting public contract. Deleting
the old test alone does not satisfy test-first.

Cover error, authorization, and boundary behavior where applicable. Never skip, weaken, or retry-mask tests to turn
them green. Record the observed red result as evidence in the story's tasks. If behavior or scope must change, return
to the approval gate rather than adjusting tests silently.
