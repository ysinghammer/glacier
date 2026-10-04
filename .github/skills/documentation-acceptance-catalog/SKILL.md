---
name: documentation-acceptance-catalog
description: Add, modify, or remove acceptance criteria, scenarios, and feature/API inventory in the tests/acceptance catalog per ADR-0007. Use for application/service behavior changes.
---

Follow `.docs/Architecture/Decisions/ADR-0007-Acceptance-catalog.md`. Application/service behavior only; documentation,
tooling, and library-only stories keep criteria in their brief and must not invent catalog criteria.

Before editing the catalog, confirm the user approved the brief's proposed criteria (additions, modifications,
removals) with the story plan. Resolve ambiguous outcomes, permissions, rejections, and boundaries with the user.

Catalog (`tests/acceptance/`, typed declarative TypeScript, no executable test functions, no Gherkin):

- Inventory features and public API operations (method and path) independently of tests and without importing
  application/service source.
- Criteria follow `IAcceptanceCriterion`: one observable behavior each; `given` = actor, permissions, achievable public
  preconditions; `when` = one action/request; `then` = objectively assertable outcomes with measurable bounds. No
  selectors, drivers, fixtures, internal calls, or database contents. At least one feature/API ID and source reference.
  Separate criteria for distinct rejection and authorization rules.
- Scenarios reference criterion IDs and concrete persona/data definitions; Playwright tests reference scenario IDs.
  Declare relationships one way only; reverse mappings are derived.
- Preserve IDs when modifying the same rule; new IDs for distinct rules; never tie IDs to files or story names or
  reuse them. History lives in git, not in-file revision logs.
- Removals need renewed approval and a reason the behavior is no longer required; failing tests are not a reason.
  Deprecated-but-supported behavior and unaffected regression criteria stay.
- Planned scenarios without tests stay visible as unfinished work; never delete them to pass validation.

Run catalog validation (malformed records, unknown/duplicate IDs, unmapped features/APIs/criteria/scenarios, dangling
persona/data, scenarios without tests). Register entries before feature implementation. Update the story plan's
`E2E tests` section with IDs and intended test paths; link completed tests only once they exist.
