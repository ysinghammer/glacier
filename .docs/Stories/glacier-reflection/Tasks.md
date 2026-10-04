---
created: 2026-10-04
tags:
  - story
---

# Glacier reflection - Tasks

Execution records derive from the [brief](Brief.md), [plan](Plan.md#implementation-steps), and
[ADR-0006](../../Architecture/Decisions/ADR-0006-Workflow.md) /
[ADR-0008](../../Architecture/Decisions/ADR-0008-Story-documentation.md).
Requirements/design approval belongs only in [Plan.md#approval](Plan.md#approval).
This fresh document preserves T-001 through T-029 from the deleted HEAD document for equivalent work;
it does not restore that document's unverified implementation evidence.

## Observed baseline and dispatch rules

On 2026-10-04, the user authorized creating this file fresh on `feature/glacier-reflection`, preserving the
staged deletion. This turn authorizes document drafting and existing-branch adoption only: no implementation,
staging, commit, push, publication, or merge is being performed.

The authored package manifest, source, configuration and tests are absent from the inspected checkout.
Ignored `dist/` and `.turbo/` remnants exist beneath the package directory, but do not establish executable
tooling or completed implementation. Root `package.json`, `turbo.json` and quality CI do not yet wire library tests.
The discovery shell reports Node 25.5.0 and pnpm 11.9.0; it is not supported Node 24.21.0 validation evidence.
Historical task prose reported scaffolding and checks; those results are not reproducible from the present
authored files and are not carried forward as completion evidence. No historical worker identity is asserted.

The plan records explicit joint approval and dependency pins, but the dependency notes still limit
`@vitest/browser-playwright` and library `playwright` to React-library testing. T-004 blocks implementation
until separately authorized companion-note alignment records the approved non-React scope. Do not silently edit
Brief.md or Plan.md, weaken their contracts, or substitute dependency versions. No further direct dependency is
approved by this document.

During implementation, the main agent invokes `implementation-develop`, confirms story selection/readiness and
dispatches one fresh bounded worker/context per task attempt, with no recursive delegation. All waves below are
serial: decorators/discovery share normalization/storage, distribution/examples share build artifacts, and final
checks share global resources. Extra concurrency is not assumed merely because separate tests could be authored.
Before dispatch, verify all dependencies are done, approval still covers the intended slice, and file/resource
ownership is current. Missing/stale sequences block dispatch until a bounded document worker repairs them.

Only one designated writer may update this Tasks.md. In each serial wave the task worker hands off exact
attempt, scope, commands, revision, observed red/green results, failures and blockers; the designated writer
records that evidence after the worker finishes and before the next wave. No concurrent evidence writes.
Evidence handoff is included in each wave, not a second concurrent worker. Retries keep the stable task ID but
use a fresh worker. Failures block dependents. A runtime concurrency restriction requires an explicit
worker-authored sequence revision.

For every new public runtime or type contract in P-003 through P-007:
write meaningful public-root tests, observe the intended contract failure, implement only that slice, then
refactor with passing checks. Missing tools, missing exports alone, compilation setup errors and browser startup
failures are not intended red evidence. Type-only exports require independent accepted-use/rejected-misuse
checks; runtime coverage cannot cover erased types. Bootstrap may provide nonbehavioral API declarations needed
to observe meaningful assertions, but must not implement public behavior before its red gate.

## Task records

### T-001 - Review guidance and confirm in-flight story adoption

- Status: done
- Source: [P-001](Plan.md#implementation-steps); ADR-0006 discovery/isolation.
- Dependencies: None.
- Completion condition: Read binding guidance, all active ADRs and complete story documents; inspect repository and
  branch state; confirm authorized association of this drafting work with the existing story branch.
- Evidence: This drafting worker read AGENTS.md, Home.md, the decisions index, accepted ADR-0001 through ADR-0008,
  complete Brief.md and Plan.md, the task template, deleted HEAD Tasks.md, techstack/dependency notes and
  manifests/configuration/CI. Git reports `feature/glacier-reflection` and the staged Tasks.md deletion.
  The user explicitly said “Create it fresh on this branch.” This is adoption, not evidence of historical
  branch creation from freshly fetched main.
- Blocker: None.

### T-002 - Align companion requirements and story references

- Status: done
- Source: [P-001 and affected areas](Plan.md#implementation-steps); ADR-0008 companion ownership.
- Dependencies: T-001.
- Completion condition: Verify constructor-only mutation, instance lookup, AC-027, stable earlier criteria,
  companion approval links and the active story index are aligned.
- Evidence: Read Brief.md with AC-001 through AC-027 and explicit instance boundaries; Plan.md covers those criteria
  and links its approval; the inspected Stories index links Brief.md, Plan.md and Tasks.md.
  This confirms current alignment, not an invented prior editing attempt or authorization history.
- Blocker: None. Dependency-note alignment is separately outstanding in T-004.

### T-003 - Obtain joint plan and acceptance-criteria approval

- Status: done
- Source: [Plan approval](Plan.md#approval); P-001; ADR-0006 discover/approve.
- Dependencies: T-002.
- Completion condition: Verify dated explicit joint approval covers the complete intended API, steps, criteria and
  bounded exclusions, without treating it as authorization of later Git/review gates.
- Evidence: The inspected [approval record](Plan.md#approval) documents the user's explicit decision and scoped
  approval; this task links that authoritative record rather than recreating it. No new implementation was
  requested or executed in this drafting turn.
- Blocker: None. Material requirements/design changes require renewed approval there.

### T-004 - Resolve dependency scope and ADR prerequisites

- Status: blocked
- Source: [Dependencies](Plan.md#dependencies-risks-and-open-decisions); P-001/P-002; ADR-0001.
- Dependencies: T-003.
- Completion condition: Confirm approved pins and no runtime dependencies; align lasting dependency scope before
  adding packages; check all active ADRs and resolve any actual conflict through authorized document workflows.
- Evidence: Plan.md records approval of `vitest` 5.0.3, `@vitest/coverage-v8` 5.0.3,
  `@vitest/browser-playwright` 5.0.3 and `playwright` 1.63.0, including non-React browser verification.
  Current [frontend dependency notes](../../Architecture/Dependencies/Frontend%20Dependencies.md) still restrict
  the latter two to React libraries; [workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md)
  do not yet record their non-React scope. No installation or ADR update is claimed.
- Blocker: Obtain authorization to update the affected dependency notes and record the already approved scope.
  This one-file request does not authorize those edits. Any additional direct dependency, pin substitution or
  material ADR conflict requires separate explicit approval before implementation.

### T-005 - Record catalog and application-E2E applicability

- Status: done
- Source: [E2E tests](Plan.md#e2e-tests); ADR-0004/ADR-0005/ADR-0007.
- Dependencies: T-001.
- Completion condition: Determine catalog, application E2E, Testcontainers and React applicability from scope.
- Evidence: Library-only scope adds no application UI/HTTP behavior, personas or business criteria.
  Catalog registration, application Playwright scenarios and a Testcontainers stack are inapplicable.
  No React components/hooks means Storybook, jsdom, Testing Library and React-specific checks are inapplicable.
  Chromium via Vitest remains library-contract testing; existing root catalog/tooling checks remain required.
  These are applicability findings, not executed passing tests.
- Blocker: None. A scope change requires reassessment and relevant approvals.

### T-006 - Scaffold package-local build and test configuration

- Status: pending
- Source: [P-002](Plan.md#implementation-steps); AC-001, AC-026; ADR-0002/ADR-0003/ADR-0005.
- Dependencies: T-003, T-004, T-005.
- Completion condition: Create `packages/libraries/glacier-reflection` as `@glacier/reflection`, with root-only
  side-effectful ESM export map, ES2023 JS/declarations, strict build/type-contract configurations and root barrel.
  Configure Node/Chromium Vitest projects, exact discovery paths, test-owned compiler fixtures and ignored artifacts;
  no application bootstrap, aliases, public subpaths or untested behavior. Define scripts for T-007.
- Evidence: None. Only ignored generated remnants were observed; authored scaffolding is not present.
- Blocker: T-004 must be resolved before scaffolding/dependency additions.

### T-007 - Wire workspace, dependency installation and CI gates

- Status: pending
- Source: [P-002](Plan.md#implementation-steps), [Validation](Plan.md#validation); AC-026; ADR-0001/ADR-0005.
- Dependencies: T-006.
- Completion condition: Activate Node 24.21.0 session-locally and pnpm 11.9.0 without modifying global Node.
  Add only approved package-local development pins and update the lockfile through pnpm; restore dependencies only
  following manifest changes or missing-tool failures. Add root test/check routing through Turbo with build,
  real-fixture and type prerequisites, coverage inputs/outputs and fresh execution controls. CI installs Chromium
  only and retains root/library diagnostics on success/failure; preserve existing workspace checks.
- Evidence: None. Current root scripts/Turbo/CI do not provide library test integration.
- Blocker: Dependencies must be done; supported runtime activation and approved dependency availability must be demonstrated.

### T-008 - Demonstrate executable harness and coverage negative controls

- Status: pending
- Source: [P-002 and validation](Plan.md#validation); AC-026; ADR-0005/ADR-0006.
- Dependencies: T-006, T-007.
- Completion condition: Demonstrate actual Node/Chromium public-root discovery, independent type checking and genuine
  `experimentalDecorators` / `emitDecoratorMetadata` fixture emission on the supported runtime.
  Prove an unloaded relevant production file and an uncovered executable path fail overall/per-file thresholds;
  prove complementary Node/Chromium mapped coverage combines correctly. Remove test-owned controls and retain
  exact results, including failures. Harness controls are not metadata-API red evidence or final API coverage.
- Evidence: None verified in this checkout; no historical harness claims are adopted.
- Blocker: An unavailable harness or ineffective coverage control blocks all public-contract implementation.

### T-009 - Establish failing definition, address and instance contracts

- Status: pending
- Source: [P-003](Plan.md#implementation-steps), [criterion verification](Plan.md#validation);
  AC-003, AC-004, AC-005, AC-006, AC-014, AC-026, AC-027.
- Dependencies: T-008.
- Completion condition: Author DefinitionContract, AddressContract and InstanceLookupContract runtime scenarios,
  plus MetadataTypes, AddressTypes and InstanceLookupTypes type contracts. Check all scoped checked/dynamic
  signatures, brands/variance, value inference and rejected read-type invention. Include finite/optional/empty/rest
  tuples, overloaded/private/protected signatures, numeric/symbol/inherited keys, NoInfer target-widening rejection,
  constructor-only mutation, subclass/two-instance equivalence, shadowed constructors, plain/prototype rejection,
  static/constructor-parameter instance restrictions and observable inspection exceptions.
  Observe intended runtime and type-contract failures before T-010.
- Evidence: None. Planned filenames are defined in [Validation](Plan.md#validation), not implemented-test links.
- Blocker: Dependencies must be done; missing exports or unrelated diagnostics alone do not satisfy red.

### T-010 - Implement definition storage, addresses and lookup normalization

- Status: pending
- Source: [P-003](Plan.md#implementation-steps); AC-003, AC-004, AC-005, AC-006, AC-014, AC-026, AC-027.
- Dependencies: T-009.
- Completion condition: Implement definition identity/private brands, invariant contracts, explicit outcomes,
  shared address normalization and class-owned storage to pass T-009. Preserve atomic rejection and presence
  separate from undefined; resolve instances using canonical prototype data descriptors without constructing
  consumers, invoking getters or trusting instance-owned constructors. No public internal helpers or permissive
  checked fallback. Refactor with runtime/type contracts passing.
- Evidence: None.
- Blocker: Meaningful red evidence for each implemented slice is required.

### T-011 - Implement inheritance, deletion and collection ownership test-first

- Status: pending
- Source: [P-004](Plan.md#implementation-steps); AC-007, AC-008, AC-009, AC-010, AC-011, AC-012,
  AC-013, AC-014, AC-015, AC-016, AC-017, AC-026.
- Dependencies: T-010.
- Completion condition: Observe InheritanceContract/CollectionOwnership runtime failures and applicable type
  failures, then implement nearest whole-value replacement, ancestor-first duplicate-preserving lists and
  homogeneous records with whole-entry replacement, including reserved dictionary keys. Verify own-only modes,
  repeated direct-write replacement, present undefined/empty declarations, direct deletion revealing ancestors,
  matching-position inheritance without signature claims and no reset/suppression.
  Copy/freeze outer accumulating structures while retaining contained/replacement identity; green/refactor.
  Decorator-creation ownership is completed in T-012.
- Evidence: None.
- Blocker: Dependencies and each intended red gate must be satisfied.

### T-012 - Implement all legacy decorator locations test-first

- Status: pending
- Source: [P-005](Plan.md#implementation-steps); AC-002, AC-003, AC-005, AC-006, AC-012, AC-013, AC-017, AC-026.
- Dependencies: T-011.
- Completion condition: Observe LegacyDecoratorContract and DecoratorTypes failures, then implement class,
  instance/static property/method/accessor, constructor and instance/static method-parameter decorators.
  Genuine legacy fixtures cover inaccessible members/constructors and symbol/numeric keys; verify direct equivalence,
  accessor location sharing, constructor-only annotation normalization and void callbacks not replacing consumers.
  Snapshot accumulating values at decorator creation; invalid boundaries throw specified coded errors atomically.
  Implement only boundary-error behavior needed for observed contracts here; compiler codes/activation follow T-016.
- Evidence: None.
- Blocker: Dependencies and intended runtime/type red gates must be satisfied.

### T-013 - Implement both discovery directions test-first

- Status: pending
- Source: [P-005](Plan.md#implementation-steps); AC-004, AC-014, AC-015, AC-018, AC-019, AC-026, AC-027.
- Dependencies: T-012.
- Completion condition: Observe DiscoveryContract runtime/type failures, then implement address-scoped identity
  discovery and definition-owned location discovery. Verify own/inherited deduplication, present undefined/empty
  declarations, deletion cleanup, canonical numeric names/explicit sides, shallow-frozen target-free results,
  constructor-wide versus instance-filtered locations and readDynamic round trips. Do not imply enumeration
  of all members, ordering guarantees or recovered static parameter signatures; green/refactor.
- Evidence: None.
- Blocker: Dependencies and intended red gates must be satisfied; shared storage/exports serialize with T-012.

### T-014 - Verify decorator and discovery integration

- Status: pending
- Source: [P-005](Plan.md#implementation-steps); AC-002, AC-017, AC-018, AC-019, AC-026, AC-027.
- Dependencies: T-012, T-013.
- Completion condition: Run joined package-root runtime/type contracts in Node/Chromium; discover/read direct and
  decorated declarations on constructors/instances in both modes. Confirm shared isolation, ownership and rejection
  behavior, resolve regressions without weakening contracts, and record commands/revision/results before P-006.
- Evidence: None.
- Blocker: Any joined failure blocks compiler implementation.

### T-015 - Establish failing real compiler and import-boundary contracts

- Status: pending
- Source: [P-006](Plan.md#implementation-steps); AC-020, AC-021, AC-022, AC-023, AC-026.
- Dependencies: T-014.
- Completion condition: Compile real TypeScript fixtures importing the root before decorated declarations execute;
  observe missing automatic-recording/replacement/rejection failures in fresh Node processes and Chromium realms.
  CompilerMetadataContract and ImportCompatibility cover all three keys, unknown keys, malformed scalar/dense/sparse
  arrays, invalid targets/locations, unchanged old declarations, foreign-handler descriptors, unavailable Reflect,
  installation failure, repeated same-module imports versus duplicate physical copies and unrelated Reflect
  preservation. Resources have bounded startup, awaited completion and finally cleanup with observable failures.
  No module mocks, production reset/uninstall API or private inspection.
- Evidence: None.
- Blocker: Fresh-process/realm infrastructure must work; startup errors are not intended contract failures.

### T-016 - Implement automatic compiler recording and boundary errors

- Status: pending
- Source: [P-006](Plan.md#implementation-steps); AC-004, AC-020, AC-021, AC-022, AC-023, AC-026.
- Dependencies: T-015.
- Completion condition: Implement ordinary predefined value-definition constants, inbound checked compiler recorder
  and root-triggered Reflect installation to pass T-015. Snapshot/freeze compiler arrays before atomic storage;
  descendant arrays replace whole arrays, including empty arrays. Typed direct writes retain ordinary value identity.
  Global factory/callback reject observably with safe coded errors and preserved causes, without overwriting foreign
  handlers/descriptors or altering unrelated Reflect operations. Domain stays independent of activation.
  Re-run all custom runtime/type contracts with genuine emitted metadata present; green/refactor.
- Evidence: None.
- Blocker: Intended red evidence is required; global Reflect resources and root exports have a single owner.

### T-017 - Verify built-package Node and browser distribution contracts

- Status: pending
- Source: [P-007](Plan.md#implementation-steps); AC-001, AC-020, AC-023, AC-026.
- Dependencies: T-016.
- Completion condition: Independent Node 24/Chromium consumers use generated root ESM/declarations with no runtime
  dependencies or DI. DistributionContract checks root resolution, deep/subpath rejection, side-effect retention,
  runtime import ordering, type-only import inactivity and declaration inference/brands. Any newly required public
  correction first has an intended failing contract; passing development checks include built artifacts, not just
  transformed source. Chromium results do not claim Firefox/WebKit compatibility.
- Evidence: None.
- Blocker: Dependencies must be done; built outputs and consumer artifacts cannot be written concurrently.

### T-018 - Complete executable usage examples and lasting documentation

- Status: pending
- Source: [P-007](Plan.md#implementation-steps); AC-001, AC-012, AC-017, AC-024, AC-025, AC-027.
- Dependencies: T-017.
- Completion condition: Check and execute public-root examples showing emitted constructor representations plus
  explicit symbol identity for an interface dependency, without a DI resolver/token abstraction/registry.
  Complete README and contract JSDoc; update affected Engineering/Architecture/CI guidance for commands, runtime
  bounds, import effects/order, foreign-handler recovery, instance aliases, checked/dynamic limits, shallow ownership,
  position-only inheritance and erased interfaces/generics/parameter names. Examples supplement tests, not replace them.
  Any behavior change returns to its red gate and any material design change to plan approval.
- Evidence: None.
- Blocker: Dependencies must be done; shared source/JSDoc and documentation writes serialize.

### T-019 - Join distribution and adoption evidence

- Status: pending
- Source: [P-007 and criterion mapping](Plan.md#validation); AC-001 through AC-027; ADR-0008.
- Dependencies: T-017, T-018.
- Completion condition: Account for every criterion, public runtime export/method/constant and erased type contract
  against observed tests/examples/review; hand off real relative test links and exact revision/results.
  Reconcile documentation with the tested API without redefining acceptance or treating percentages as assertion quality.
- Evidence: None.
- Blocker: Missing criterion evidence or an infeasible promised signature blocks review; obtain companion-plan
  clarification/renewed approval rather than silently weakening the brief.

### T-020 - Integrate current main before final local verification

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 current-main integration.
- Dependencies: T-019.
- Completion condition: Freshly fetch `origin/main`, record refs and inclusion, and if needed merge it into this
  branch, never rebase. Resolve conflicts preserving contracts and identify the renewed-check revision.
  Obtain separate authorization before any integration commit; implementation permission does not grant Git writes.
- Evidence: None. No fetch, merge or current-main inclusion is claimed by this draft.
- Blocker: Await any required integration-commit authorization; changed code invalidates prior final checks/acceptance.

### T-021 - Run the complete local automated verification gate

- Status: pending
- Source: [P-008 and validation](Plan.md#validation); AC-026; ADR-0001/ADR-0003/ADR-0005/ADR-0007.
- Dependencies: T-020.
- Completion condition: On Node 24.21.0/pnpm 11.9.0, run `pnpm check` and explicit fresh
  `pnpm exec turbo run test --force`. Lint, formatting, build, independent type contracts, real fixtures,
  root catalog/tooling regressions and complete Node/Chromium library runtime tests pass.
  Combined mapped V8 coverage is 100% statements/branches/functions/lines overall and per relevant production file,
  including unloaded supporting code; no executable exclusions/ignore annotations, skipped cases or retry-only passes.
  Retain exact revision, commands, results and reports.
- Evidence: None. Application E2E inapplicability is established by T-005, not a passing executed suite.
- Blocker: Missing/failing supported tooling, runtime, Chromium or coverage gates block acceptance.

### T-022 - Review all ADRs, contracts and assertion quality

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); AC-016, AC-024, AC-026; ADR-0001 through ADR-0008.
- Dependencies: T-021.
- Completion condition: At the fixed checked revision manually review each active ADR, approved dependencies,
  inward/relative-import boundaries, curated root exports, strict typing/JSDoc, atomic errors, intentional activation,
  compiler/instance limits, assertions, coverage inclusion and changed links. Record conformance or specific justified
  inapplicability for each ADR. Corrections renew affected checks; AI review does not grant human acceptance.
- Evidence: None.
- Blocker: Unresolved conformance/assertion-quality findings block closure readiness.

### T-023 - Prepare archival, indexes and durable test links

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 closure; ADR-0007/ADR-0008.
- Dependencies: T-021, T-022.
- Completion condition: Finish lasting docs and implementation/verification evidence, link actual library tests,
  preserve E2E inapplicability and stable IDs, move the story to `.docs/Archive/glacier-reflection/`, and update
  Stories/Archive indexes and affected relative references. Recheck links/formatting and affected gates after closure
  edits. Archive means pre-merge preparation; T-029 stays pending. No catalog source changes are needed unless actual
  affected references are discovered; do not invent library business entries.
- Evidence: None.
- Blocker: All verification/review must pass before closure; this drafting request authorizes no archival move.

### T-024 - Obtain separate commit authorization

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 commit gate.
- Dependencies: T-023.
- Completion condition: Obtain explicit user authorization to commit the verified closure-prepared changes,
  identify library versus workspace ownership and exclude unrelated work, including unapproved staged state.
- Evidence: None. Fresh drafting and plan approval grant no commit permission.
- Blocker: Wait for separate explicit commit authorization; if declined stop this stage.

### T-025 - Create package-scoped commits with passing hooks

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006; implementation-commit skill.
- Dependencies: T-024.
- Completion condition: Under the exact authorization, stage only intended changes and create separate
  Conventional Commits scoped to the declared `@glacier/reflection` package and `workspace` as applicable,
  with correct type/SemVer breaking markers and required co-author trailer.
  Husky/lint-staged checks pass without bypass; record SHAs/hook results and renew affected checks after corrections.
- Evidence: None.
- Blocker: Dependencies must be done; failed hooks block commits.

### T-026 - Obtain publication authorization and publish the PR

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006; implementation-publish-pr skill.
- Dependencies: T-025.
- Completion condition: Obtain separate explicit push/PR authorization, then push this branch and create/update its
  GitHub PR targeting main. Link archived story, describe architecture/dependencies/behavior and actual validation
  with limitations, and record URL/head SHA. Do not infer merge permission or create another story PR on retry.
- Evidence: None.
- Blocker: Await publication authorization; if declined stop without pushing and await user initiation.

### T-027 - Renew current-main, CI and blocking-feedback evidence

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0001 CI/Snyk; ADR-0006 review.
- Dependencies: T-026.
- Completion condition: Recheck freshly fetched main against published head, merge updates if needed with separately
  authorized commits/pushes, then renew local gates and independently passing Actions build/lint/format/type/runtime/
  Chromium/coverage/catalog/tooling checks. Obtain current Snyk dependency scan evidence for manifests/lockfile;
  resolve blocking review/security findings without skipping requirements. Retain exact checked SHA/results/links.
  Every changed revision invalidates previous check/acceptance/merge permission.
- Evidence: None. Container-image scans are inapplicable because no deployable image is introduced.
- Blocker: Missing/stale/failed CI or Snyk, unresolved feedback, or unapproved correction commits/pushes blocks acceptance.

### T-028 - Obtain human acceptance and explicit current-revision merge authorization

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 human acceptance/merge.
- Dependencies: T-027.
- Completion condition: A human accepts the exact checked PR revision against criteria, meaningful assertions,
  active ADRs, dependency approvals and documentation, and explicitly authorizes merging that unchanged revision.
  Maintainer self-review is allowed; one explicit decision may express both gates, but AI review/earlier permissions
  cannot substitute. Record decision and accepted SHA.
- Evidence: None.
- Blocker: Wait for human acceptance and explicit merge authorization; any subsequent change invalidates both.

### T-029 - Merge and confirm GitHub delivery into main

- Status: pending
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 confirmed merge.
- Dependencies: T-028.
- Completion condition: Immediately recheck unchanged accepted head, passing checks and freshly fetched main inclusion.
  If stale, renew T-027/T-028 before proceeding. Use GitHub's merge-commit method preserving package commits;
  verify GitHub reports merged into main and identifies the merge commit. A closed PR, failed attempt, green checks
  or archival location is not delivery. No post-merge documentation commit is required solely to record confirmation.
- Evidence: None. GitHub confirmation is not available; this final task remains pending.
- Blocker: Dependencies must be done and permissions/checks/current-main freshness must remain valid.

## Completed records (observed, not historical dispatch)

| Task IDs | Observed evidence                                                             | Worker history                                                                |
| -------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| T-001    | Current guidance/ADR/repository inspection and user-confirmed branch adoption | This document-authoring attempt only; no historical branching worker asserted |
| T-002    | Current brief/plan/index alignment                                            | Prior editing worker not established                                          |
| T-003    | Linked plan approval record                                                   | No approval worker inferred                                                   |
| T-005    | Current library-only scope and applicability rationale                        | No test execution inferred                                                    |

The deleted note did not supply stable numbered historical execution waves. None are fabricated here.
Completed tasks are excluded from future dispatch; their task dependencies remain recorded above.

## Execution sequence

`L` below means exactly `packages/libraries/glacier-reflection`. `S` means exactly
`.docs/Stories/glacier-reflection/Tasks.md`, the single-writer evidence resource during these waves.
Directory scopes include only task-relevant files under that directory, not permission for arbitrary additions.
Planned source/test paths below are plain code because authored implementation files do not yet exist.
All prerequisite IDs must be completed before dispatch; a whole-wave barrier applies.

| Wave/order | Task IDs | Exact concurrent workers                                      | Prerequisites                                                                 | Owned files/resources                                                                                                                                                                                                                                                                                     | Concurrency rationale                                                                 |
| ---------- | -------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| W-001 / 1  | T-004    | 0 while waiting; fresh 1 after authorization for verification | T-003; companion-note edit authorization                                      | `.docs/Architecture/Dependencies/Workspace Dependencies.md`, `.docs/Architecture/Dependencies/Frontend Dependencies.md`; S                                                                                                                                                                                | Resolve documented scope mismatch before manifests; shared docs serialize             |
| W-002 / 2  | T-006    | 1                                                             | T-003, T-004, T-005                                                           | L `package.json`, `index.ts`, `tsconfig*.json`, `vitest.config.ts`, `tests/data/`, test preparation configuration; S                                                                                                                                                                                      | Single package manifest/export/config writer; no API behavior yet                     |
| W-003 / 3  | T-007    | 1                                                             | T-006                                                                         | L `package.json`; root `package.json`, `pnpm-lock.yaml`, `turbo.json`, `.github/workflows/quality.yml`, `.gitignore`; session-local runtime/dependency installation; S                                                                                                                                    | Lockfile/install/CI/shared workspace mutations serialize                              |
| W-004 / 4  | T-008    | 1                                                             | T-006, T-007                                                                  | L test configuration, `tests/scenarios/`, `tests/contracts/`, `tests/data/`, `tests/artifacts/`, temporary production controls under `src/` and `index.ts`; S                                                                                                                                             | One owner adds/removes controls and owns processes, Chromium, coverage/build outputs  |
| W-005 / 5  | T-009    | 1                                                             | T-008                                                                         | L `tests/scenarios/DefinitionContract.test.ts`, `AddressContract.test.ts`, `InstanceLookupContract.test.ts`; `tests/contracts/MetadataTypes.test-d.ts`, `AddressTypes.test-d.ts`, `InstanceLookupTypes.test-d.ts`, `tests/data/`, nonbehavioral contract declarations/root exports, `tests/artifacts/`; S | Red gate before implementation; shared root/declarations and checks serialize         |
| W-006 / 6  | T-010    | 1                                                             | T-009                                                                         | L `src/domain/`, `index.ts`, contract suites owned by T-009 for plan-preserving corrections, `tests/artifacts/`; S                                                                                                                                                                                        | Single storage/normalizer/root-export writer; green checks isolated                   |
| W-007 / 7  | T-011    | 1                                                             | T-010                                                                         | L `src/domain/`, `index.ts`, `tests/scenarios/InheritanceContract.test.ts`, `CollectionOwnership.test.ts`, `tests/contracts/MetadataTypes.test-d.ts`, `tests/data/`, `tests/artifacts/`; S                                                                                                                | Shared inheritance/storage plus slice-specific red/green in one context               |
| W-008 / 8  | T-012    | 1                                                             | T-011                                                                         | L `src/domain/`, `src/infrastructure/adapters/inbound/`, `index.ts`, `tests/scenarios/LegacyDecoratorContract.test.ts`, `tests/contracts/DecoratorTypes.test-d.ts`, `tests/data/`, `tests/artifacts/`; S                                                                                                  | Adapter depends on shared normalization/error contracts; no parallel discovery writer |
| W-009 / 9  | T-013    | 1                                                             | T-012                                                                         | L `src/domain/`, `index.ts`, `tests/scenarios/DiscoveryContract.test.ts`, `tests/contracts/MetadataTypes.test-d.ts`, `InstanceLookupTypes.test-d.ts`, `tests/data/`, `tests/artifacts/`; S                                                                                                                | Shared indexes/exports serialize after decorators                                     |
| W-010 / 10 | T-014    | 1                                                             | T-012, T-013                                                                  | L `src/domain/`, `src/infrastructure/adapters/inbound/`, `index.ts`, existing decorator/discovery/instance contract suites, `tests/artifacts/`; S                                                                                                                                                         | One integration/check owner; corrections preserve approved behavior                   |
| W-011 / 11 | T-015    | 1                                                             | T-014                                                                         | L `tests/scenarios/CompilerMetadataContract.test.ts`, `ImportCompatibility.test.ts`, `tests/contracts/MetadataTypes.test-d.ts`, `tests/data/`, fresh-process/realm test helpers under `tests/`, `tests/artifacts/`, nonbehavioral compiler declarations; S                                                | Fresh Node/Chromium resources and emitted fixtures cannot share mutable realms        |
| W-012 / 12 | T-016    | 1                                                             | T-015                                                                         | L `src/domain/`, `src/infrastructure/adapters/inbound/`, `index.ts`, established compiler/type suites for corrections, `tests/artifacts/`; global Reflect in isolated test realms; S                                                                                                                      | Automatic activation/root exports/global boundaries require a single owner            |
| W-013 / 13 | T-017    | 1                                                             | T-016                                                                         | L `tests/scenarios/DistributionContract.test.ts`, independent consumer fixtures under `tests/data/`, `tests/contracts/`, `tests/artifacts/`, `dist/`; L manifest/exports/source only for red-first distribution corrections; S                                                                            | Distribution builds/consumer artifacts serialize with examples                        |
| W-014 / 14 | T-018    | 1                                                             | T-017                                                                         | L `README.md`, JSDoc in existing `src/` files, checked examples under `tests/data/`; `.docs/Architecture/Techstack/Workspace Techstack.md`, both affected dependency notes, `.docs/Engineering/Guidelines/Overview.md`, `.docs/Engineering/CI/Overview.md`; L `tests/artifacts/`; S                       | Lasting docs/source/examples and builds have one writer                               |
| W-015 / 15 | T-019    | 1                                                             | T-017, T-018                                                                  | Read-only L and Brief.md/Plan.md criterion/test inventory; S evidence and real test links                                                                                                                                                                                                                 | Serialized evidence join, no implementation or companion redesign                     |
| W-016 / 16 | T-020    | 0 while waiting; fresh 1 after authorization for verification | T-019; any required integration-commit authorization                          | Story branch Git refs/index/worktree, fetched `origin/main`, conflicts in story-owned files only; S                                                                                                                                                                                                       | Global Git integration serial; never rebase or include unrelated work                 |
| W-017 / 17 | T-021    | 1                                                             | T-020                                                                         | Read-only authored workspace; root `dist/`, `.turbo/`, `tests/artifacts/`; L `dist/`, `.turbo/`, `tests/artifacts/`; Node/Chromium processes; S                                                                                                                                                           | Complete fresh checks own all generated outputs                                       |
| W-018 / 18 | T-022    | 1                                                             | T-021                                                                         | Read-only story implementation/tests, all eight ADRs, approval/dependency notes and changed links; S findings                                                                                                                                                                                             | Fixed revision manual review serial after automated checks                            |
| W-019 / 19 | T-023    | 1                                                             | T-021, T-022                                                                  | `.docs/Stories/glacier-reflection/` move to `.docs/Archive/glacier-reflection/`; `.docs/Stories/Index.md`, `.docs/Archive/Index.md`, directly affected relative references; archived Tasks.md as single writer; affected check artifacts                                                                  | Closure/index/link changes serialize; rerun affected checks before commits            |
| W-020 / 20 | T-024    | 0 while waiting; fresh 1 after authorization for verification | T-023                                                                         | Read-only verified diff/Git state; archived Tasks.md authorization evidence                                                                                                                                                                                                                               | Human decides commit permission, worker verifies scope only                           |
| W-021 / 21 | T-025    | 1                                                             | T-024                                                                         | Authorized story changes only, Git index/commits, Husky/lint-staged resources; archived Tasks.md                                                                                                                                                                                                          | Single Git writer; hooks never bypassed                                               |
| W-022 / 22 | T-026    | 0 while waiting; fresh 1 after authorization for verification | T-025; explicit publication permission                                        | Story branch remote push; one GitHub PR targeting main; archived Tasks.md evidence                                                                                                                                                                                                                        | Separate human publication gate and serialized remote mutation                        |
| W-023 / 23 | T-027    | 0 while waiting; fresh 1 after authorization for verification | T-026; owner-provided scans/checks and any correction commit/push permissions | Git refs/authorized story-owned conflicts or fixes, same PR/review threads, Actions/Snyk readout; root/L check artifacts; archived Tasks.md                                                                                                                                                               | Serial freshness/feedback loop; CI service jobs are not concurrent task workers       |
| W-024 / 24 | T-028    | 0 while waiting; fresh 1 after authorization for verification | T-027; exact-revision human acceptance and merge permission                   | Read-only current PR SHA/checks/criteria; archived Tasks.md decision evidence                                                                                                                                                                                                                             | Human acceptance is not agent approval                                                |
| W-025 / 25 | T-029    | 1                                                             | T-028; unchanged SHA, passing checks, fresh main inclusion                    | Read-only Git freshness; GitHub merge-commit operation and confirmation for same PR into main                                                                                                                                                                                                             | One authorized merge worker; stop on stale revision; no post-merge note commit        |

Reverification is not a cyclic dependency: failures or a changed PR revision invalidate affected task evidence,
and a designated writer revises the remaining sequence with fresh attempts for the same IDs before dispatch.
Material contract/design changes return to the plan approval gate. Further commits/pushes require their own
explicit permissions. Lowering concurrency is a documented sequence change; do not invent historical workers.

## Workflow coverage

| Obligation                                                                  | Records             |
| --------------------------------------------------------------------------- | ------------------- |
| Guidance/all ADRs/discovery and adopted story branch                        | T-001               |
| Companion alignment, joint plan/criteria and dependency prerequisites       | T-002, T-003, T-004 |
| Library-only catalog/application E2E/Testcontainers/React rationale         | T-005               |
| Runtime/tooling/bootstrap and demonstrable coverage enforcement             | T-006, T-007, T-008 |
| Runtime/type test-first, implementation and integration                     | T-009 through T-017 |
| Lasting docs/examples, complete criterion and export evidence               | T-018, T-019        |
| Fresh main integration before final local checks and manual ADR review      | T-020, T-021, T-022 |
| Real test links, indexes and pre-review archival, final merge still pending | T-023               |
| Separate commit permission, scoped commits and passing hooks                | T-024, T-025        |
| Separate push/PR permission, independent CI/Snyk and feedback resolution    | T-026, T-027        |
| Exact-revision human acceptance, merge permission and GitHub confirmation   | T-028, T-029        |

Each task's Source/Completion condition maps the brief criteria to the plan's existing verification methods.
Every AC-001 through AC-027 is covered; the authoritative design/test mapping remains
[Plan.md#validation](Plan.md#validation), not a second application-catalog reverse mapping.
Release, npm publication, deployment and consuming-application execution are outside completion.

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
- [Plan approval](Plan.md#approval)
- [Stories](../Index.md)
- [ADR-0005: Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
- [ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)
