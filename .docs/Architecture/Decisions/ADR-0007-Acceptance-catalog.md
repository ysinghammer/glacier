---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0007: Acceptance catalog

## Context

[ADR-0005](ADR-0005-Testing-strategy.md) defines how libraries and the full application stack are tested. This
decision defines how the required public behavior of applications and services is specified, approved, registered, and
traced to Playwright scenarios within those boundaries. It was extracted from ADR-0005 because acceptance criteria and
their lifecycle change for different reasons than test execution, layout, and orchestration.

A validated, test-owned TypeScript acceptance catalog is chosen over a manually maintained feature-to-test table, which
could become stale without detection. The catalog holds the current approved acceptance criteria; story briefs propose
changes rather than making archived stories the source of current behavior. Criteria describe required outcomes, while
scenarios demonstrate them with concrete data.

## Decision

### Acceptance criteria lifecycle and structure

- Acceptance criteria for application/service public behavior must be drafted during story discovery from intended
  outcomes, public contracts, and relevant existing behavior, not inferred from the finished implementation.
  The story author or agent must resolve ambiguous outcomes, permissions, rejections, and boundaries with the user.
- A story brief must describe proposed additions, modifications, or removals with stable criterion IDs. Approval of
  the story plan must include user approval of those criteria before implementation. Approved changes must be
  registered in the catalog before feature implementation; planned scenarios without tests must remain visible as
  unfinished work rather than being removed to make validation pass.
- The acceptance catalog must hold the durable current approved behavioral baseline. Story briefs must preserve the
  proposed changes and rationale and reference the affected IDs; they must not become a second manually maintained
  current baseline. Archived story references must remain valid without moving active criteria out of the catalog.
- Criteria must use typed, declarative TypeScript records with the following contract. They must not contain executable
  test functions or require a Gherkin/Cucumber dependency.

```ts
/** Describes one approved public behavioral rule independently of its tests. */
interface IAcceptanceCriterion {
  readonly id: string;
  readonly title: string;
  readonly featureIds: readonly string[];
  readonly apiOperationIds: readonly string[];
  readonly given: readonly string[];
  readonly when: string;
  readonly then: readonly string[];
  readonly sourceReferences: readonly string[];
}
```

- Each criterion must describe one observable behavior. `given` must identify the actor, applicable permissions, and
  independently achievable public preconditions; `when` must describe one business action or public request; `then`
  must specify objectively assertable UI/API outcomes, including measurable bounds when timing or limits matter.
  Selectors, drivers, fixture implementation, internal calls, and database contents must not define acceptance criteria.
- Each criterion must reference at least one inventoried feature or public API operation and its documented requirement
  or public-contract sources. Distinct rejection and authorization rules must have separate criteria. One criterion
  may require several scenarios with concrete personas, datasets, and boundary cases.
- Existing IDs must be preserved when modifying the same behavioral rule. Distinct rules must receive new IDs, and
  IDs must not depend on filenames/story names or be reassigned to unrelated behavior.
- Changes to approved behavior and criterion removals must receive renewed user approval before updating the catalog.
  A removal must explain why the behavior is no longer required; failing or inconvenient tests must not justify it.
  Deprecated but still-supported public behavior and unaffected regression criteria must remain required.
  Implementation changes preserving the criteria must not require renewed behavioral approval. Git history must
  preserve previous definitions rather than a separate in-file revision log.
- Documentation-only, tooling-only, and library-only stories must retain their own acceptance criteria in the brief and
  applicable validation in the plan, without inventing business criteria for the application acceptance catalog.

### Acceptance catalog and verification

- A test-owned TypeScript acceptance catalog must live under `tests/acceptance/`. It must enumerate stable IDs for
  frontend features, public backend API operations, acceptance criteria, and required acceptance scenarios. Entries must
  reference the documented requirements or public contracts they cover; API entries must identify their public
  operation, such as its HTTP method and path.
- The feature/API inventory must be maintained independently of implemented tests. It must not be inferred solely
  from test discovery or populated by importing application/service source. New or changed public behavior must update
  the inventory and its required scenarios.
- Relationships must be declared in one direction only: criteria must reference feature/API IDs, scenarios must
  reference criterion IDs and concrete persona/data definitions, and Playwright tests must reference scenario IDs.
  Reverse mappings must be derived, not duplicated in criterion records or a second manual table.
- Every frontend feature and public backend API operation must map through criteria to required acceptance scenarios
  covering applicable success, rejection, authorization, and boundary behavior.
- Catalog validation must reject malformed criterion/scenario records, unknown/duplicate IDs, features/API operations
  without criteria, criteria without scenarios, scenarios without criteria or discovered tests, and dangling persona/data references. Missing planned
  tests may cause failures during development, but all required mappings must be complete before acceptance.
  A generated report must show feature/API-to-criterion-to-scenario-to-test mappings and execution outcomes.
- Review must verify that each test's assertions genuinely establish its claimed behavior. Catalog completeness must
  not be treated as proof of assertion quality, and Playwright feature/contract coverage must not be described as
  instrumentation-based code coverage.
- Before accepting a change, the complete Playwright suite and catalog validation must pass locally and in CI through
  pnpm/Turborepo, alongside applicable library checks. Filtered runs must provide feedback only, not replace the complete
  acceptance run. Required scenarios must not be skipped or excluded by focused tests.
- A scenario that fails and passes only on retry must not satisfy the acceptance gate. Retries used for diagnostics
  must not conceal flaky failures.

### Story plans and traceability

- Every plan created in the [Stories directory](../../Stories/Index.md) must contain an `E2E tests` section.
- For new or modified application/service features, that section must describe the acceptance scenarios to create or
  update, identify the catalog feature/API, criterion, and scenario IDs, and name the intended Playwright test files.
  The plan must identify the brief's proposed criterion changes included in its approval.
- Before story completion, the section must contain relative links to the implemented E2E test files and relevant
  catalog entries, with scenario IDs identifying the specific tests. Planned paths must not be presented as links to
  completed tests before those tests exist.
- Plans without application/service feature changes, including documentation-only, tooling-only, and library-only
  work, must retain the section and explain why E2E changes are not applicable. Applicable library and other validation
  must still be described in the plan's `Validation` section.

## Consequences

The acceptance catalog and story links make omissions visible, but require maintenance and review as public behavior
changes. Criteria agreed before implementation prevent redefining acceptance to match the implementation; renewed
approval adds coordination when required behavior changes.

The scaffolding required by [ADR-0005](ADR-0005-Testing-strategy.md) includes the criterion/scenario catalog
validation and reporting that its black-box task and CI gates execute.

## Related notes

- [Architecture decisions](Index.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](ADR-0006-Workflow.md)
- [ADR-0008: Story documentation](ADR-0008-Story-documentation.md)
- [Testing guidelines](../../Engineering/Guidelines/Overview.md#testing)
- [Stories](../../Stories/Index.md)
- [Story brief template](../../Templates/Story%20Brief.md)
- [Story plan template](../../Templates/Story%20Plan.md)
