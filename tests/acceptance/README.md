# Acceptance catalog foundation

[ADR-0007](../../.docs/Architecture/Decisions/ADR-0007-Acceptance-catalog.md) owns the acceptance contract.
The typed [catalog](Catalog.ts) is currently empty because no application/service behavior exists.
Tooling fixture records are not business requirements and never enter this inventory.

## Authoring and discovery

Add approved declarative records to the catalog, using the
[typed contracts](validation/IAcceptanceCatalog.model.ts). Inventory features and public HTTP operations
independently of tests. Criteria reference feature/API IDs, scenarios reference criterion/persona/dataset IDs,
and specs reference scenarios. Do not declare reverse relationships or import product code.

Keep each ID stable and unique across the catalog. Every record needs a title and source references;
criteria need Given/When/Then outcomes and at least one feature/API; scenarios need criteria and concrete
persona/data definitions. Required business tests must stay visible even when not implemented yet.
Missing scenarios/tests are validation failures, not skips.

Specs live under `tests/scenarios/<capability>/` with the `.spec.ts` suffix. Each spec declares its scenario
IDs with one exact top-level line per ID:

```ts
// @scenario SC-001
```

Metadata is read statically, without executing specs. Missing, duplicate, and unknown scenario metadata is
rejected; tests outside capability-owned discovery cannot fulfill a mapping. Symbolic links in the scenario
tree fail discovery explicitly. Each metadata declaration must correspond to meaningful assertions in the
actual Playwright test; metadata completeness cannot establish assertion quality.

The future first application story must extend this mapping to actual per-test Playwright execution results,
fail on skipped/focused or retry-only scenarios, and run a fresh entire Testcontainers stack without caching.
Static discovery does not establish that a file executes or that its assertions satisfy a criterion.

## Commands and reports

- `pnpm catalog-check`: compile tooling, validate the approved catalog and discovered spec mappings, and write
  forward/reverse traceability beneath `tests/artifacts/<run-id>/acceptance-report/`.
- `pnpm tooling-check`: compile and execute technical catalog and workspace verification controls, writing
  diagnostics beneath `tests/artifacts/<run-id>/tooling-verification/`.

Reports say `execution.status: "not-run"` and `execution.results: null`; no product outcomes are invented.
Validation failures print record IDs/reasons, retain `validation.json`, and exit nonzero.
Exceptional filesystem failures propagate rather than becoming an empty inventory.
Generated artifacts, compiled output, and dependencies are ignored by Git and discovery.
