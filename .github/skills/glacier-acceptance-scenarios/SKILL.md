---
name: glacier-acceptance-scenarios
description: Propose, maintain, and verify Glacier application/service acceptance scenarios. Use for approved capability Markdown, stable scenario IDs, public-only Playwright journeys, fresh real-stack execution, and truthful coverage mappings.
---

# Glacier acceptance scenarios

## Triggers

Use during application/service discovery, approved scenario baseline updates,
Playwright implementation, catalog verification, or acceptance review.
Libraries/tooling/documentation use local criteria instead of invented business
capability entries.

## Inputs and prerequisites

Read every policy, especially [full-stack testing](../../../.policies/0011-full-stack-testing.md)
and [acceptance catalog](../../../.policies/0012-acceptance-catalog.md).
Require intended outcomes/public UI or HTTP contracts, preserved behavior,
existing scenario baseline, approved proposals, current harness, and real-stack
prerequisites. Criteria must originate in discovery, not completed code.

## Procedure

1. Propose additions/modifications/removals with stable globally unique IDs,
   source references, observable criteria, and rationale. Resolve outcomes,
   permissions, rejections, and boundaries through
   [glacier-interview](../glacier-interview/SKILL.md). Renew approval for behavioral
   changes/removals; preserve IDs for the same rule and unaffected regressions.
2. After approval and before implementation, update
   `tests/scenarios/<capability>/README.md` with purpose/business value, public
   contracts including HTTP method/path, and the complete required scenario index.
   The global `tests/scenarios/README.md` links every capability and describes its
   value without duplicating definitions/mappings.
3. Each scenario records ID, title, verified value, requirement sources, concrete
   test-owned personas/data, Given/When/Then criteria, and actual test links.
   Preconditions must be independently achievable through public flows. Define
   measurable timing/limit bounds where relevant; separate distinct rejection and
   authorization rules. Do not use selectors, storage contents, or internal calls
   as criteria. Document cross-capability journeys once under their outcome.
4. Mark approved unimplemented scenarios explicitly unfinished with intended paths
   as plain code, not completed links. Completed entries link every needed test and
   identify the corresponding tests by scenario ID. Keep the durable Markdown
   baseline authoritative; do not add a duplicate typed inventory or revision log.
5. Implement workspace-root `tests/scenarios/**/*.spec.ts` against public UI/HTTP
   only. Static foundation metadata requires one exact top-level
   `// @scenario SC-001` line for each actual documented ID. Test discovery must
   reject malformed/missing/duplicate/unknown IDs and symbolic links.
6. Keep fixtures/data/drivers/stack/reporting in policy 0011's root paths; never
   use `tests/acceptance/` or package-local application tests. Tests must not import
   production code/types, inspect internals, access storage directly, mock services,
   intercept fabricated responses, or use test-only setup/reset endpoints.
7. Every run, even filtered diagnostics, starts one fresh complete real stack via
   Testcontainers, shares it across workers, and tears it down. Use real artifacts,
   migrations/infrastructure and provider sandboxes, bounded readiness, observable
   startup/cleanup errors, and independent unique public-flow data. No developer
   stack reuse, fixed readiness sleeps, direct seeds, or reduced selected stacks.
8. Use Chromium only for browser journeys; HTTP-only tests need no browser launch.
   Validate docs/discovered-test consistency through current workspace tasks.
   Static reports remain `execution.status: "not-run"` and `execution.results: null`
   until actual execution. The first application must add per-test results and
   skipped/focused/retry-only failure controls.
9. Acceptance requires catalog validation and the full actual uncached suite
   locally/CI. Store reports/traces/logs in ignored root
   `tests/artifacts/<run-id>/` policy-owned subdirectories. Review linked assertions,
   not just mapping completeness; retain `validation.json` and explicit failures.

## Outputs and handoff evidence

Supply approved proposals/baseline references, stable IDs, actual test mappings,
public criterion assertions, exact commands/results, invocation-isolated report
paths, and unfinished work. Derive capability-to-scenario-to-test execution
summaries from Markdown and discovered tests, not a manually duplicated inventory.

## Approval and stop gates

Missing approvals, scenarios/tests/source links, real dependencies, required
execution, or meaningful assertions blocks completion. Missing planned tests must
fail rather than disappear. No skips/focused runs/cache/retry-only successes as
acceptance; no Playwright feature coverage claims as instrumentation code coverage.
