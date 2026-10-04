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

The original 2026-10-04 drafting authorization created this file fresh on `feature/glacier-reflection` while
preserving the then-staged deletion. That historical observation is not the current working-tree state.
T-004 attempt 1 observed a clean checkout on the same approved in-flight branch at `98ebe5b` before edits.
The user selected Glacier reflection and explicitly authorized dependency-note alignment and continued implementation;
this bounded attempt changes only the two dependency notes and this evidence file, without Git mutations.

At the pre-T-006 baseline, authored package manifest, source, configuration and tests were absent.
T-006 attempt 1 subsequently created only the nonbehavioral package/configuration and test-owned compiler inputs.
Ignored generated/build/test and dependency remnants exist beneath the package directory, but do not establish executable
tooling or completed implementation. T-007 attempt 1 subsequently wired root `package.json`, `turbo.json` and quality CI
for library tests; executable harness controls and public contracts remain for T-008 onward.
The discovery shell reports Node 25.5.0 and pnpm 11.9.0; it is not supported Node 24.21.0 validation evidence.
Historical task prose reported scaffolding and checks; those results are not reproducible from the present
authored files and are not carried forward as completion evidence. No historical worker identity is asserted.

The plan records explicit joint approval and dependency pins. T-004 attempt 1 aligned
`@vitest/browser-playwright` and library `playwright` to the approved non-React library scope in both dependency notes.
The scope prerequisite is resolved before package additions; tooling availability is still for T-007/T-008 to demonstrate. Do not silently edit
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

For every new public runtime behavior and every type behavior change after the first declaration bootstrap in P-003 through P-007:
write meaningful public-root tests, observe the intended contract failure, implement only that slice, then
refactor with passing checks. Missing tools, missing exports alone, compilation setup errors and browser startup
failures are not intended red evidence. Type-only exports require independent accepted-use/rejected-misuse
checks; runtime coverage cannot cover erased types. Only the first declaration bootstrap uses the bounded
[ADR-0006 exception](../../Architecture/Decisions/ADR-0006-Workflow.md#implement-and-verify) and
[dated plan approval](Plan.md#approval): author meaningful accepted-use/rejected-misuse public-root type fixtures
before the production declarations they cover, add only exact approved nonbehavioral declarations, and verify
intended inference/contracts/diagnostics afterward, including unused `@ts-expect-error` guards. Preserve fixture-first
order and check results as evidence, without claiming pre-declaration type red or inventing unsound production
signatures. Runtime behavior still requires meaningful red before implementation. Unchanged type contracts require
independent verification, not artificial failure; later type behavior changes retain meaningful type red.

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
- Blocker: None. Dependency-note alignment is recorded separately in T-004.

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

- Status: done
- Source: [Dependencies](Plan.md#dependencies-risks-and-open-decisions); P-001/P-002; ADR-0001.
- Dependencies: T-003.
- Completion condition: Confirm approved pins and no runtime dependencies; align lasting dependency scope before
  adding packages; check all active ADRs and resolve any actual conflict through authorized document workflows.
- Evidence: Plan.md records approval of `vitest` 5.0.3, `@vitest/coverage-v8` 5.0.3,
  `@vitest/browser-playwright` 5.0.3 and `playwright` 1.63.0, including non-React browser verification.
  Attempt 1 / W-001 on 2026-10-04 used one fresh bounded worker, with no recursive delegation and sole Tasks ownership.
  The user explicitly selected “Authorize dependency-note alignment and continue implementation (Recommended)”.
  Updated [frontend dependency notes](../../Architecture/Dependencies/Frontend%20Dependencies.md) and
  [workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md) before package additions.
  Both now cover non-React library browser testing while preserving Chromium-only installation/provider instances,
  application/service `@playwright/test`/Testcontainers boundaries and all unrelated React-only scopes.
  Read all accepted active ADR-0001 through ADR-0008 and complete Brief/Plan/Tasks; no ADR change is needed.
  ADR-0001/0005 conform through approved scopes and browser boundaries; ADR-0006/0008 conform through dated
  authorization, existing-branch adoption, bounded ownership and stable acyclic task/wave records.
  ADR-0007 conforms through preserved library-only catalog/E2E inapplicability; ADR-0002/0003/0004 code,
  package and React implementation rules are inapplicable to these documentation-only edits.
  Verified task IDs/dependencies, remaining wave coverage/order/counts/ownership, relative links and formatting;
  the inline documentation validator passed with `python3` after the initial `python` command was unavailable.
  It confirmed 29 stable tasks, an acyclic graph, all 24 remaining tasks exactly once in W-002 through W-025,
  earlier-wave prerequisites, declared serial worker counts/ownership, AC-001 through AC-027 coverage and valid
  relative links/anchors. T-006's prerequisites T-003/T-004/T-005 are done.
  `git diff --check` passed. Oxfmt's changed-file check passed on the observed Node 25.5.0 shell;
  this is documentation-format evidence only, not supported-Node code verification.
  No installation, code checks, staging, commit, fetch, branch switch or ADR update is claimed.
- Blocker: None for T-004. Additional direct dependencies, pin substitutions or material design/ADR conflicts
  still require separate approval; supported runtime/dependency/harness availability remains unverified.

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

- Status: done
- Source: [P-002](Plan.md#implementation-steps); AC-001, AC-026; ADR-0002/ADR-0003/ADR-0005.
- Dependencies: T-003, T-004, T-005.
- Completion condition: Create `packages/libraries/glacier-reflection` as `@glacier/reflection`, with root-only
  side-effectful ESM export map, ES2023 JS/declarations, strict build/type-contract configurations and root barrel.
  Configure Node/Chromium Vitest projects, exact discovery paths, test-owned compiler fixtures and ignored artifacts;
  no application bootstrap, aliases, public subpaths or untested behavior. Define scripts for T-007.
- Evidence: Attempt 1 / W-002 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Rechecked `feature/glacier-reflection` at
  `98ebe5b271a2af89345d7b7f35729e28ca947640`; the only pre-existing dirty files were the two dependency notes
  and Tasks.md from T-004. Preserved them; no authored package files or competing npm identity existed.
  Read full Brief/Plan/Tasks, AGENTS/Home, all eight active ADRs and applicable linked guidance; invoked
  scaffold-package, implementation-branching and document-tasks using the already-approved library identity,
  technology-independent target and existing in-flight branch. Ignored remnants are not scaffold evidence.
  Created nine authored files: package.json, empty index.ts, tsconfig.json, tsconfig.tests.json,
  tsconfig.contracts.json, tsconfig.fixtures.json, vitest.config.ts and two tests/data/compiler inputs.
  Manifest has only the root native-ESM/declaration export, sideEffects true, no dependencies or public subpaths.
  Shared strict NodeNext/ES2023 settings emit JS/declarations/maps; production has no Node/DOM ambient types.
  Independent contract checking, build-first legacy fixture preparation and later T-007 script wiring are defined.
  Vitest defines Node and headless Chromium projects with scenario-only discovery; shared scenarios run in both,
  while tests/scenarios/node is Node-only. Contracts/data/config are not runtime tests.
  V8 collection includes index.ts and all src TypeScript (excluding only declarations), with 100% metrics/per-file
  thresholds; results, screenshots, cache, coverage and compiler output use ignored tests/artifacts paths.
  No public behavior, declarations of the planned API, runtime dependency, README, root integration or install added.
  Existing local binaries report TypeScript 7.0.2 and all four approved residual test dependency pins.
  Diagnostic direct-binary build, test/config type check, contract-config check, real-fixture emission, Oxlint
  and Oxfmt checks passed on the observed Node 25.5.0 shell. Initial config checking rejected project-local
  passWithNoTests; corrected to the supported root option and reran successfully.
  Inspected newly emitted compiler JS for all three genuine design keys and the preceding public-root runtime import;
  this is emission evidence, not metadata recording or an executable harness claim.
  Diagnostic built-root import exposed zero runtime exports; deep/subpath imports rejected with
  ERR_PACKAGE_PATH_NOT_EXPORTED. git check-ignore confirmed build/compiler/coverage/cache artifacts are ignored.
  The requested pnpm command failed before formatting/Turbo execution with ERR_PNPM_UNSUPPORTED_ENGINE
  (expected Node 24.21.0, observed 25.5.0). pnpm attempted its automatic dependency-status install subprocess,
  which also failed the engine check; no successful installation, manifest dependency addition or lockfile change
  occurred. Did not bypass engine strictness or activate/install any runtime. Direct diagnostics do not substitute
  for required supported-runtime pnpm/Turbo gates. A shell rg lookup was unavailable; repeated emitted-output
  inspection successfully with the available rg tool.
  Final direct Oxfmt check passed on all nine authored files and Tasks.md; all four compiler configurations passed.
  git diff --check passed. The inline python3 validator confirmed 29 stable tasks, acyclic dependencies,
  all 23 remaining tasks exactly once in serial W-003 through W-025 with earlier prerequisites and worker/resource
  declarations, valid relative file links, root-only nonbehavioral manifest/build-output agreement and T-007 readiness.
  Preserved W-001 and added completed W-002 history without renumbering future waves. Final dirty state adds only
  these nine untracked authored package files alongside the original three dirty documentation paths;
  HEAD/branch stayed unchanged, with no Git writes. ADR-0001/0002/0003/0005 conform through dependency-free,
  strict, root-only tooling and test ownership; supported execution/coverage remain explicitly deferred.
  ADR-0004/0007 are inapplicable to this non-React library slice as established by T-005.
  ADR-0006/0008 conform through approved bounded ownership, fresh worker, preserved evidence and serial wave records.
- Blocker: None for the bounded nonbehavioral T-006 authored configuration. Supported-Node pnpm/Turbo checks
  are still unavailable and block code acceptance, not the explicitly sequenced T-007 runtime/wiring work.
  T-007 must activate Node 24.21.0, add approved pins/install and wire prerequisites; T-008 must prove executable
  Node/Chromium discovery and combined overall/per-file coverage controls before T-009. No tests or coverage pass
  is claimed for the empty public API or the currently absent scenario/type-contract suites.

### T-007 - Wire workspace, dependency installation and CI gates

- Status: done
- Source: [P-002](Plan.md#implementation-steps), [Validation](Plan.md#validation); AC-026; ADR-0001/ADR-0005.
- Dependencies: T-006.
- Completion condition: Activate Node 24.21.0 session-locally and pnpm 11.9.0 without modifying global Node.
  Add only approved package-local development pins and update the lockfile through pnpm; restore dependencies only
  following manifest changes or missing-tool failures. Add root test/check routing through Turbo with build,
  real-fixture and type prerequisites, coverage inputs/outputs and fresh execution controls. CI installs Chromium
  only and retains root/library diagnostics on success/failure; preserve existing workspace checks.
- Evidence: Attempt 1 / W-003 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Confirmed T-006 and its prerequisites done, joint approval in Plan.md, the approved
  `feature/glacier-reflection` branch and unchanged HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  Preserved the existing two dirty dependency notes, Tasks.md and all nine T-006 scaffold files.
  Read AGENTS/Home, all eight accepted active ADRs, full Brief/Plan/Tasks, dependency/techstack and relevant
  engineering/library/CI guidance; invoked implementation-branching and document-tasks for approved in-flight adoption.
  Official Node distribution and all four exact npm-version endpoints returned HTTP 200.
  Downloaded Node 24.21.0 darwin-arm64 beneath ignored
  `node_modules/.session-runtime/node-v24.21.0-darwin-arm64`, verified the official SHA-256 checksum,
  extracted it and removed download/checksum scratch files. Each supported command used
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`.
  `node --version` returned v24.21.0 and `pnpm --version` returned 11.9.0; global
  `/opt/homebrew/bin/node --version` still returned v25.5.0 afterward.
  Added only approved package-local direct devDependencies: vitest 5.0.3, @vitest/coverage-v8 5.0.3,
  @vitest/browser-playwright 5.0.3 and playwright 1.63.0; no runtime dependency or root dependency additions.
  After that manifest edit, `HUSKY=0 pnpm install` succeeded and generated pnpm-lock.yaml.
  `pnpm --filter @glacier/reflection list --depth 0` confirmed exactly those four installed direct pins.
  `pnpm install --frozen-lockfile` then passed without lockfile changes.
  Root `pnpm test` routes through Turbo and `pnpm check` includes test while preserving all existing gates.
  Turbo test depends on package build, independent type-check/contracts and real-fixture test:prepare;
  type-check depends on build so contract consumption of generated declarations cannot race emission.
  Build/type/test preparation/test inputs include default source/tests/configuration and root compiler baseline/lockfile.
  Test and fixture preparation are uncached; generated fixture and coverage/results artifacts are declared outputs.
  `pnpm exec turbo run test --dry=json` confirmed the acyclic prerequisite graph and cache:false for both tasks;
  retained the graph under L tests/artifacts/t007-dag.json.
  CI installs only Chromium via `pnpm --filter @glacier/reflection exec playwright install --with-deps chromium`;
  the existing always-run artifact step now retains root and library diagnostics, with unchanged security,
  timeout, pinned Actions and failure semantics. No Git ignore change was needed.
  `pnpm --filter @glacier/reflection exec playwright install chromium` passed; a package-local Playwright
  smoke command launched headless Chromium 153.0.8010.12, evaluated 2 + 2 as 4 and awaited browser.close in finally.
  This proves browser availability, not Vitest scenario execution or coverage correctness.
  Initial forced scaffold gates failed on turbo.json formatting; applied Oxfmt to the four authored integration
  files and reran successfully. The final supported-runtime command
  `pnpm exec turbo run build type-check lint format-check test:prepare catalog-check:root tooling-check:root --force`
  passed all 11 tasks, including both root/library builds, strict compiler/config/contracts, genuine fixture emission,
  Oxlint/Oxfmt, empty catalog validation, 34 catalog rejection controls and existing workspace technical controls.
  `pnpm test` and `pnpm check` both genuinely reached uncached Vitest 5.0.3 with V8 and the Node/Chromium projects,
  then failed with exit 1 because scenario files are not authored until T-008/T-009.
  Reports were written beneath L tests/artifacts; reported empty-API coverage was 0%, not successful coverage.
  During pnpm check Turbo cancelled the concurrent root tooling check after that expected missing-suite failure;
  the independent forced 11-task run above completed that gate successfully.
  These missing-suite failures are visible bootstrap evidence, not public-contract red, final acceptance or harness proof.
  Final `pnpm exec turbo run lint format-check --force` passed all four root/library tasks.
  `git diff --check` passed; the inline python3 validator confirmed 29 stable tasks, acyclic dependencies,
  22 unique remaining waves with earlier prerequisites, exact approved direct pins and uncached test routing.
  HEAD and branch stayed unchanged; no stage/commit/fetch/push/ref or branch mutation,
  API implementation, test-config edit, coverage control or new test was performed.
  ADR-0001/0005 conform through exact approved library-only deps, supported runtime, Chromium-only installation and
  uncached coverage routing; ADR-0002/0003 conform through retained root-only ESM/strict builds and actual Turbo checks.
  ADR-0004/0007 applicability remains T-005; ADR-0006/0008 conform through approval, bounded fresh worker and serialized
  stable task evidence. Harness verification remains explicitly T-008, not an inferred passing test suite.
- Blocker: None for completed T-007 installation/wiring. Full test/check acceptance remains blocked by absent
  scenarios and unproved executable/combined overall/per-file coverage controls; T-008 is ready for a fresh bounded worker.

### T-008 - Demonstrate executable harness and coverage negative controls

- Status: done
- Source: [P-002 and validation](Plan.md#validation); AC-026; ADR-0005/ADR-0006.
- Dependencies: T-006, T-007.
- Completion condition: Demonstrate actual Node/Chromium public-root discovery, independent type checking and genuine
  `experimentalDecorators` / `emitDecoratorMetadata` fixture emission on the supported runtime.
  Prove an unloaded relevant production file and an uncovered executable path fail overall/per-file thresholds;
  prove complementary Node/Chromium mapped coverage combines correctly. Remove test-owned controls and retain
  exact results, including failures. Harness controls are not metadata-API red evidence or final API coverage.
- Evidence: Attempt 1 / W-004 on 2026-10-04 dispatched to one fresh bounded worker, no recursive delegation,
  as sole Tasks writer. T-006/T-007 are done; approved in-flight branch and unchanged HEAD were rechecked.
  Read AGENTS/Home, complete Brief/Plan/Tasks, all eight active ADRs and relevant library/tooling guidance.
  Preserved all preceding dirty story files and adopted the explicitly approved in-flight branch without Git writes.
  All commands activated the T-007 session-local runtime with
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 and pnpm 11.9.0, without workspace dependency restoration or global runtime changes.
  Added temporary root-exported tooling control, a scenario in tests/scenarios and an independent
  accepted-use/expected-misuse contract in tests/contracts; none implements metadata behavior.
  Initial scenario self-import via `@glacier/reflection` resolved the built dist export: both assertions passed
  but source coverage was 0%, retained as `built-root-unmapped.log` and JSON reports, not a successful mapping.
  Corrected development scenarios to import the curated source root using `../../index.js`, the within-package
  relative import required by ADR-0003, without aliases, internal imports or manifest/export-map changes.
  Independent contracts and real compiler fixtures still consume the built package name. Future development
  scenarios must use that source-root path for source coverage; T-017 separately verifies built distribution.
  Each `pnpm exec turbo run test --force` genuinely executed Node and Chromium, with uncached prerequisites.
  An uncovered third path produced exit 1 in default per-file mode: statements/lines 80%, branches 75%,
  functions 100%, identifying HarnessCoverageControl.ts line 11. Repeating with
  `-- --coverage.thresholds.perFile=false` produced exit 1 for the same overall metrics.
  After removing that path, an unloaded src/domain/UnloadedHarnessControl.ts was included at 0% in all
  four metrics, while the loaded control had 100%. Default per-file execution failed with exit 1 on all four
  file metrics; the overall-mode repeat failed with exit 1 at 50% statements/branches/functions/lines.
  Removed the unloaded control. Separate `-- --project=node` and `-- --project=chromium` runs each passed
  their one assertion but exited 1 on 66.66% statements/lines and 50% branches (functions 100%).
  Combined default and overall-mode runs each passed two assertions and exited 0 at 100% for all four metrics.
  JSON-map verification confirmed identical original-source statement/function/branch locations and exact
  counter addition: Node branches [1,0], Chromium [0,1], combined [1,1]; no averaging or duplicate source files.
  Empty re-export-only index.ts has zero executable counters, not meaningful API coverage.
  Independent `pnpm exec turbo run type-check --force` with deliberately unused @ts-expect-error exited 1
  on TS2578 in HarnessTypes.test-d.ts; an immediately attempted Node-only run also stopped at that prerequisite,
  not runtime discovery. Restoring the rejected misuse made subsequent independent contract checks pass.
  Supported Turbo test:prepare emitted genuine __decorate/__metadata calls for design:type, design:paramtypes
  and design:returntype, with the runtime public-root import preceding decorated declarations. Retained emitted JS
  and machine-checked ordering/key evidence; no automatic metadata-recording result is claimed before T-015/T-016.
  Added explicit 10-second launch/connect/test/hook/teardown bounds in vitest.config.ts, preserving project
  concurrency and Chromium-only instances. Vitest owns readiness and resource cleanup; provider.close awaits
  page/context/browser closure. A deliberate assertion failure in each runtime exited 1 despite 100% coverage.
  `DEBUG=vitest:browser:playwright pnpm exec turbo run test --force --env-mode=loose` retained diagnostic
  "closing provider" then "provider is closed" after the failed assertions; loose environment mode only passed
  DEBUG for this diagnostic, not changed test gates. No cleanup error was observed or suppressed by authored code.
  Removed assertion, source, root-export and type controls after observations; retained only test-owned ignored
  diagnostics under L tests/artifacts/t008, including logs, source snapshots and mapped coverage JSON.
  With controls present, `pnpm exec turbo run build type-check lint format-check test:prepare
catalog-check:root tooling-check:root test --force` passed all 12 tasks and both assertions.
  Vite emitted a transitive Vitest module-runner dynamic-import analysis warning; no authored suppression was added.
  After cleanup, the same forced gate command without test passed all 11 tasks, including catalog/tooling controls
  (the latter performs its own disposable offline frozen-install/hook fixtures, not story checkout Git mutations).
  Fresh `pnpm exec turbo run test --force` then genuinely exited 1 because no scenarios remain; this is the
  expected pre-T-009 state, not contract red. Removed generated JS/declarations/maps for both temporary classes
  from dist and rebuilt the empty root; no control export or authored source/test control remains.
  Final git diff --check passed and global /opt/homebrew/bin/node still reports v25.5.0.
  ADR-0001/0005 conform through approved pins/runtime, Chromium-only real execution, restricted discovery and
  demonstrated V8 coverage/type gates. ADR-0002/0003 conform through curated root-only imports, no aliases or
  internal test imports, bounded awaited lifecycle and passing Turbo style/build/type checks. ADR-0004/0007
  remain inapplicable as established in T-005. ADR-0006/0008 conform through explicit approval, no Git mutation,
  one fresh bounded worker, removed temporary tooling controls and stable serialized task/wave evidence.
  Validated task/wave ordering, links and T-009 readiness; no concurrency revision was needed.
  These harness results are not metadata API intended-red evidence, final API coverage,
  final acceptance or permission to implement before T-009.
- Blocker: None for T-008. T-009 is ready only for its scoped intended public-contract failures;
  final test/check acceptance still requires real API scenarios and coverage in later tasks.

### T-009 - Establish failing definition, address and instance contracts

- Status: done
- Source: [P-003](Plan.md#implementation-steps), [criterion verification](Plan.md#validation);
  AC-003, AC-004, AC-005, AC-006, AC-014, AC-026, AC-027.
- Dependencies: T-008.
- Completion condition: Author DefinitionContract, AddressContract and InstanceLookupContract runtime scenarios,
  plus MetadataTypes, AddressTypes and InstanceLookupTypes type contracts. Check all scoped checked/dynamic
  signatures, brands/variance, value inference and rejected read-type invention. Include finite/optional/empty/rest
  tuples, overloaded/private/protected signatures, numeric/symbol/inherited keys, NoInfer target-widening rejection,
  constructor-only mutation, subclass/two-instance equivalence, shadowed constructors, plain/prototype rejection,
  static/constructor-parameter instance restrictions and observable inspection exceptions.
  For the first declaration bootstrap only, author meaningful accepted-use/rejected-misuse public-root type fixtures
  before the production declarations they cover; then add exact approved nonbehavioral declarations and independently
  verify intended inference/contracts/diagnostics and unused `@ts-expect-error` guards. Record fixture/declaration
  order and command results without claiming initial type red, missing-export/setup failures as intended red, or
  runtime coverage of erased types; do not manufacture red with unsound signatures. Observe meaningful runtime
  contract failures before T-010; no runtime behavior may precede its red. Later type behavior changes retain strict
  meaningful type red/green/refactor.
- Evidence: Attempt 1 / W-005 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, all eight accepted active ADRs, full Brief/Plan/Tasks, the task template
  and relevant library, engineering, CI, techstack and dependency guidance. Invoked implementation-test-first,
  document-tasks and implementation-branching; adopted the explicitly approved existing branch without Git writes.
  Rechecked T-008 done, complete joint approval and exact allowed ownership. Preserved every existing dirty file.
  Supported invocation used
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  Node returned v24.21.0, pnpm returned 11.9.0, branch remained feature/glacier-reflection and HEAD remained
  `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  Read-only baseline inspection found authored index.ts contains only `export {};` and the existing built root
  exposes no runtime exports. `pnpm --filter @glacier/reflection run type-check:contracts` exited 0 with no authored
  contract suites; this is configuration/baseline evidence, not accepted-use or rejected-misuse verification.
  Retained exact commands/output beneath L `tests/artifacts/t009/readiness.log`.
  Stopped at the type-red sequencing conflict before authoring declarations, placeholders or tests:
  [Validation](Plan.md#validation) requires observing the intended failing type contract before adding production
  declarations, while the absent public types can supply only prohibited missing-export failures.
  Supplying the exact approved declarations first would establish those type guarantees before their required red;
  deliberately loosening signatures/brands/variance merely to produce unused @ts-expect-error diagnostics would
  invent an unsound intermediate public contract not specified by the plan. Runtime bootstrap permission alone
  does not decide which type-contract sequencing is authorized.
  No meaningful runtime/type red, metadata behavior, API coverage or final acceptance is claimed. No Node/Chromium
  runtime scenario run was attempted after finding this blocking design-sequencing question; T-008 browser evidence
  remains unchanged. No dependencies, manifests/configuration, Brief/Plan, source, tests or Git state were changed.
  Documentation-only validation passed: supported-runtime
  `pnpm exec oxfmt --check .docs/Stories/glacier-reflection/Tasks.md`, `git diff --check`, and an inline python3
  check of 29 stable tasks, acyclic dependencies, 21 unique remaining waves and relative links. Final dirty-state
  inspection preserved the pre-attempt paths; only this evidence note and ignored T-009 diagnostics were written.
  Planned filenames remain in [Validation](Plan.md#validation), not implemented-test links.
  Prerequisite repair attempt 1 / W-005-R on 2026-10-04 used one fresh bounded documentation worker without
  recursive delegation, as sole Tasks writer. The explicit user decision is recorded only in
  [Plan.md#approval](Plan.md#approval). Updated existing ADR-0006, Plan.md and this note for the first-declaration
  exception; ADR-0005 has no pre-declaration-red mandate and remains unchanged. Read all eight active ADRs and
  full Brief/Plan/Tasks/templates and applicable guidance. Preserved attempt 1's blocker and absent-red observations
  above as history; this repair authors no declaration, fixture or runtime behavior and does not complete T-009.
  Documentation checks and conformance evidence are recorded under the repair wave below.
  Attempt 2 / W-005 on 2026-10-04 used one fresh bounded worker without recursive delegation, as sole Tasks writer.
  Rechecked T-008 completion, W-005-R repair and the exact dated exception; read AGENTS/Home, all eight active ADRs,
  full Brief/Plan/Tasks/template and relevant library, engineering, CI, techstack/dependency guidance.
  Adopted the explicitly approved in-flight `feature/glacier-reflection` at unchanged HEAD
  `98ebe5b271a2af89345d7b7f35729e28ca947640`; preserved all preceding dirty files and dependencies.
  All execution used the existing session-local PATH command above: Node v24.21.0, pnpm 11.9.0;
  no global Node change, dependency restoration, configuration/manifest edit or Git mutation.
  Authored the three public-root accepted-use/rejected-misuse type fixtures FIRST while index.ts still contained
  only `export {};` and no src files existed. Recorded UTC time and SHA-256 fixture hashes under ignored
  L `tests/artifacts/t009/attempt2/fixture-first.log` before the declaration patch.
  Added exact approved scoped type declarations/root exports SECOND, with a separate timestamp/hash record in
  `declaration-second.log`. Each source file has one primary export and JSDoc; the shared operation base remains
  internal to the public barrel. Distinct native private brands and explicit invariance survive declaration emission.
  Constructors expose declared name/kind types only; all direct/discovery bodies return a fixed invalid-target
  placeholder without inspecting targets, normalizing addresses or storing declarations. The decorator stub throws
  not-implemented and is not a successful decorator implementation. No storage, normalization, activation or public
  success behavior was implemented; compiler exports and later feature slices remain deferred.
  Initial supported `pnpm exec turbo run build type-check --filter=@glacier/reflection --force` passed four tasks,
  including built-package type consumption. Subsequent test strengthening changed no production signature.
  Formatting moved two expected-error directives away from their actual position errors; the first pre-runtime
  gate exposed TS2578 plus the intended TS2322 errors. Moved those fixture directives onto the position fields
  and reran successfully; this fixture-layout failure is not initial type red or runtime red.
  Final `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force` passed
  all eight root/library tasks. Independent `pnpm --filter @glacier/reflection run type-check:contracts` passed.
  The fixtures establish value/list/record inference, homogeneous possibly absent record entries, readonly outputs,
  every checked/dynamic operation signature, kinds, brands/invariance and rejected independent retrieval generics;
  finite/optional/empty/rest tuples, final overloads, inaccessible constructor tuples, numeric/symbol/inherited keys,
  optional callables/static tuples, NoInfer rejection and constructor-only mutations/instance-address restrictions.
  Generated diagnostic-only copies beneath ignored `tests/artifacts/t009/attempt2/unsuppressed/` removed all
  73 expected-error directives without changing expressions or line positions. Independent compiler execution exited
  1 with 76 intended diagnostics at exactly those 73 misuse locations (three instance-static calls each produced
  both side and key diagnostics). An initial summary assertion incorrectly assumed one diagnostic per misuse;
  corrected the diagnostic-accounting check to match unique locations, not fixture or production types.
  Verified every directive's next-line misuse has its intended error, with no missing-symbol/setup diagnostic.
  A separate generated copy added an expected-error directive to an accepted string write: independent compilation
  exited 1 with exactly one TS2578 and no other compiler errors. Production fixtures remain unchanged by controls.
  Retained independent-types.log, unsuppressed-diagnostics.log, unused-guard.log and type-verification-summary.json.
  This is post-declaration type verification under the approved exception, not initial type-red evidence;
  erased contracts are not runtime-covered.
  Authored named public-root runtime scenarios in
  [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts),
  [AddressContract](../../../packages/libraries/glacier-reflection/tests/scenarios/AddressContract.test.ts) and
  [InstanceLookupContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InstanceLookupContract.test.ts).
  Independent type suites are
  [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts),
  [AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts) and
  [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts).
  Runtime imports use only `../../index.js`; types consume the built `@glacier/reflection` root.
  Test-owned ContractTarget supplies ordinary public input shapes, not internal inspection or module mocking.
  Both fresh `pnpm exec turbo run test --filter=@glacier/reflection --force` invocations reached real Node/Chromium
  assertions after passing build/type/real-emission prerequisites; the final run exited 1 with 144 tests:
  136 failed assertions, eight passed, zero pending/skipped. EACH project ran 72 cases: DefinitionContract 13 failed,
  AddressContract 36 failed, InstanceLookupContract 19 failed/four passed. Machine-checked all 136 failures are
  AssertionError results, not import, compilation, browser startup or missing-tool failures.
  Examples: constructor name expected `"same"` but was undefined; valid class set expected `{ isValid: true }`
  but received fixed invalid-target; invalid position expected invalid-position but received invalid-target;
  instance static address expected instance-address-not-supported but received invalid-target; exceptional prototype
  and descriptor inspection expected the original thrown Error but the placeholder did not throw.
  Read/absence/present-undefined, same-name identity, distinct side/member/parameter addresses, numeric canonicalization,
  mutation atomicity, subclass/two-instance aliases in both modes, ignored shadowed constructors/getters,
  erased constructor targets and instance discovery filtering all have explicit public expected outcomes.
  The eight passing plain/prototype rejection assertions coincide with the fixed rejection stub and do not establish
  normalization. Additional coverage failures remain visible, but are NOT the intended-red evidence.
  Retained final-runtime-red.log, runtime-results.json and machine-checked runtime-summary.json under attempt2;
  the first runtime log remains separately retained. No retry masking or success implementation followed red.
  Final Tasks formatting and forced Turbo lint/format checks passed all four root/library tasks; git diff --check
  passed. The document validator confirmed 29 stable tasks, an acyclic DAG, all 20 remaining tasks exactly once
  in W-006 through W-025 with earlier prerequisites, exact serial/human-gate counts and 59 valid relative links/anchors.
  Final branch/HEAD and dirty-path inventory remained unchanged apart from the owned package files/Tasks evidence;
  global /opt/homebrew/bin/node still reported v25.5.0. No final full-suite/100%-coverage acceptance is claimed.
  ADR-0001/0005 conform through existing pins/runtime, Chromium-only execution, public-root assertion failures and
  independent type checks. ADR-0002/0003 conform through dependency-free domain declarations, single-primary files,
  curated relative root imports, strict emitted brands and passing Turbo style/build/type gates.
  ADR-0004/0007 applicability remains T-005. ADR-0006/0008 conform through the approved narrow exception,
  fixture-first evidence, preserved failed attempt/repair, unchanged runtime/later-type red and single-writer waves.
- Blocker: None for the completed red/bootstrap-verification task. Runtime behavior and final acceptance remain red;
  T-010 is ready for a fresh bounded implementation worker, not completed or authorized for Git operations.

### T-010 - Implement definition storage, addresses and lookup normalization

- Status: done
- Source: [P-003](Plan.md#implementation-steps); AC-003, AC-004, AC-005, AC-006, AC-014, AC-026, AC-027.
- Dependencies: T-009.
- Completion condition: Implement definition identity/private brands, invariant contracts, explicit outcomes,
  shared address normalization and class-owned storage to pass T-009. Preserve atomic rejection and presence
  separate from undefined; resolve instances using canonical prototype data descriptors without constructing
  consumers, invoking getters or trusting instance-owned constructors. No public internal helpers or permissive
  checked fallback. Refactor with runtime/type contracts passing.
- Evidence: Attempt 1 / W-006 on 2026-10-04 used one fresh bounded worker with no recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, all eight active ADRs, complete Brief/Plan/Tasks/template and applicable
  architecture, dependency, library, engineering and CI guidance. Invoked implementation-test-first and document-tasks.
  Rechecked T-009 attempt 2 done, its runtime/type reports, the approved first-declaration exception, ownership and
  `feature/glacier-reflection` at unchanged HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  Preserved all preceding dirty documents, scaffold, wiring and contract work; no branch/ref/index mutation.
  All execution activated the existing session-local runtime with
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  Node returned v24.21.0 and pnpm 11.9.0. No dependency restoration, configuration/manifest/lockfile change or
  global Node activation occurred.
  Before implementation, reran the three named suites using
  `pnpm --filter @glacier/reflection exec vitest run tests/scenarios/DefinitionContract.test.ts
tests/scenarios/AddressContract.test.ts tests/scenarios/InstanceLookupContract.test.ts
--coverage.enabled=false --outputFile=tests/artifacts/t010/attempt1/baseline-results.json`.
  It exited 1 with 144 cases, 136 intended AssertionError failures and eight passes, zero pending/skipped,
  in real Node/Chromium; machine-checked baseline summary agrees with T-009.
  Implemented eight domain files: the three distinct native-private/invariant definitions, shared operations,
  MetadataDiscovery and internal MetadataTarget/MetadataAddress/MetadataStorage. Root exports and all existing public
  signatures/type contracts remain unchanged. Class-owned weak maps retain typed declarations and a weak
  class-local identity/address index, without casts, untyped value retrieval or a strong class registry.
  Address validation copies/canonicalizes fields, separates all sides/kinds/positions, preserves numeric/symbol keys,
  rejects static prototype/invalid positions/combinations and mutation lookup options before storage.
  Presence is independent of undefined; direct replacement/deletion and only the nearest-ancestor lookup needed by
  T-009 are implemented. Instances resolve canonical prototype data descriptors, ignore shadowed constructors,
  never construct consumers or invoke target getters, filter unsupported address categories and preserve inspection
  exceptions. Baseline identity/location discovery supports T-009; full discovery freezing/ownership, collection
  accumulation, decorators and compiler integration remain sequenced under their later red gates.
  Initial checks exposed widened local address literals, an Oxfmt layout change, and accidental widening of kind
  declarations to string. Restored the exact established literal kinds through declared readonly fields assigned
  in constructors, avoiding both unsafe assertions and prefer-as-const lint warnings; no type fixture was weakened.
  Retained initial-gates.log, gates.log, gates-green.log and gates-green-final.log.
  The first runtime implementation run had 140 passes/four failures: exact discovery assertions exposed shared
  ContractTarget declarations left by earlier scenarios, not a storage defect. Corrected all three suites to create
  a fresh test-owned subclass before each case and deferred table target creation until after setup.
  This preserves every expected assertion and removes shared mutable class data; isolated-green then passed 144/144.
  Added plan-preserving malformed standalone lookup/inherited-field cases BEFORE correcting normalization.
  The AddressContract run exited 1 with six intended assertion failures/78 passes across both projects:
  extra location-option fields and an inherited incompatible class-address side incorrectly returned valid results.
  Corrected the shared normalizer after observing that red. options-red.log/results/summary retain this additional gate.
  Added public regressions for non-address inputs, canonical-looking nonconstructable arrows, prototype accessors,
  caller-address changes and intermediate instance prototypes; these verify scoped invariants without private hooks.
  Final named runtime invocation above, using expanded-runtime-results.json, exited 0 with 172/172 cases:
  each project ran DefinitionContract 13, AddressContract 49 and InstanceLookupContract 24; zero failures/skips.
  `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force` passed all eight
  root/library tasks. Independent `pnpm --filter @glacier/reflection run type-check:contracts` exited 0 against the
  built root. All three original type fixtures are unchanged; post-bootstrap public types were not broadened.
  Forced Turbo test with the same three named files and expanded-coverage-results.json passed all 172 assertions
  and build/type/real-fixture prerequisites, but exited 1 on the unchanged 100% per-file coverage thresholds.
  Combined scoped V8 metrics were 97.5% statements, 96.98% branches, 94.87% functions and 97.98% lines.
  MetadataAddress and all three definition classes reached 100% in all four metrics. Remaining diagnostic gaps
  include the deferred decorator body, private discovery constructor and unexercised storage/target branches.
  expanded-coverage.log/json retain the failures without lowering thresholds, executable exclusions or ignores.
  These are development-slice coverage results, NOT final full-suite/100%-coverage acceptance; T-021 remains pending.
  Vite's existing transitive module-runner import-analysis warning remains visible without an authored suppression.
  All commands/reports and revision/hash evidence are under ignored L `tests/artifacts/t010/attempt1/`.
  Final supported Turbo gates, independent types, Tasks formatting and git diff --check passed. The inline
  documentation validator's first regex was incorrectly greedy; corrected the validator, not task requirements,
  and verified 29 stable tasks, acyclic dependencies, all 19 remaining waves exactly once, declared worker counts,
  earlier-wave prerequisites and 59 valid relative links/anchors. final-validation.json confirms protected
  manifest/configuration/Plan/ADR/type-fixture hashes and unchanged branch/HEAD; global Node remains v25.5.0.
  ADR-0001/0005 conform through unchanged approved pins/runtime, Chromium-only public-root assertions and independent
  types; full acceptance/coverage remain deferred. ADR-0002/0003 conform through dependency-free class-first domain
  code, private state, unchanged curated exports, relative imports, contract JSDoc and supported Turbo checks.
  ADR-0004/0007 applicability remains T-005. ADR-0006/0008 conform through approved bounded scope, runtime red before
  behavior/correction, preserved earlier blockers, one fresh worker, sole evidence writer and stable serial waves.
- Evidence (attempt 2 / W-006-R / 15.1, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer; invoked implementation-test-first and document-tasks. Read AGENTS/Home, accepted active
  ADR-0001 through ADR-0008, full Brief/Plan/Tasks and task template. Verified T-009 done and retained T-019
  findings against the unchanged approved contract. Preserved all dirty work on feature/glacier-reflection at
  HEAD 98ebe5b271a2af89345d7b7f35729e28ca947640; no Git writes or dependency/configuration/signature changes.
  All supported commands used the existing session-local PATH activation recorded in attempt 1, with
  Node v24.21.0 / pnpm 11.9.0. Generated evidence is under ignored L tests/artifacts/t010/attempt2.
  Added ten named cases per runtime across the three existing public-root suites: two checked/dynamic
  absent-address deletions preserve another declaration and discovery index; four invalid normalized decorator
  locations throw invalid-decorator-location atomically; one noncanonical intermediate prototype cannot redirect
  an instance alias; three missing/mismatched/accessor constructor descriptors reject every checked/dynamic
  operation and both discovery methods without getter calls. No private inspection, mocks or new exports.
  First ran DefinitionContract, AddressContract, InstanceLookupContract and DiscoveryContract with V8:
  206/206 assertions passed, zero skips; exit 1 on unchanged 100% coverage thresholds. This is not meaningful
  behavior red. Actual source counters showed Storage/shared operations now complete; MetadataTarget retained
  a reachable malformed-constructor guard and the unreachable non-TypeError constructability rethrow.
  Added descriptor cases and removed only that rethrow: the owned construct trap always returns an object,
  executes no consumer constructor/trap/getter, and the intrinsic rejects a nonconstructable probe only with
  TypeError. Descriptor/prototype inspections occur outside the catch and still propagate exceptional failures.
  The canonical-prototype mismatch conditional is reachable and was retained/exercised, not deleted.
  MetadataStorage and MetadataDefinitionOperations required no production edits; the decorator's secondary guard
  is reachable through invalid positions/static prototype and remains intact. Public signatures are unchanged.
  This is behavior-preserving dead-path removal/assertion recovery, so no artificial runtime/type red is claimed;
  T-009/attempt-1 meaningful behavior-red history remains intact.
  `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force` passed all eight
  root/library tasks. Independent `pnpm --filter @glacier/reflection run type-check:contracts` passed against
  generated root declarations; all existing type fixtures/root exports/configuration/pins remained hash-identical.
  Final scoped V8 command was `pnpm --filter @glacier/reflection exec vitest run
tests/scenarios/DefinitionContract.test.ts tests/scenarios/AddressContract.test.ts
tests/scenarios/InstanceLookupContract.test.ts tests/scenarios/DiscoveryContract.test.ts
tests/scenarios/InheritanceContract.test.ts tests/scenarios/CollectionOwnership.test.ts
tests/scenarios/LegacyDecoratorContract.test.ts --coverage
--coverage.reportsDirectory=tests/artifacts/t010/attempt2/final-coverage
--outputFile=tests/artifacts/t010/attempt2/final-results.json`.
  All 256 assertions passed, zero failures/pending/skips: EACH Node/Chromium ran Definition 19, Address 52,
  InstanceLookup 25, Discovery 10, Inheritance 11, CollectionOwnership four and LegacyDecorator seven.
  Actual combined V8 production paths MetadataTarget, MetadataStorage and MetadataDefinitionOperations have
  100% statements/branches/functions/lines, with respectively 39/28/5, 70/38/9 and 50/20/13 covered
  statement/branch/function counters. No unloaded file exclusion, threshold change, ignores or private test hook.
  The coverage command correctly exited 1 for OTHER files: MetadataDecorator, MetadataDiscovery and both
  compiler adapters. Scoped aggregate 84.02% statements / 81.78% branches / 96.15% functions / 83.44% lines
  is not the full native suite or final acceptance; reduced compiler coverage reflects their unselected suites.
  Reran the same seven suites with `--coverage.enabled=false
--outputFile=tests/artifacts/t010/attempt2/green-results.json`: exit 0, 256/256 passes with zero skips.
  Fresh native compiler/distribution/example verification and full mapped coverage remain their bounded recoveries;
  native helper preparation was not rerun outside this attempt's allowed generated-artifact ownership.
  Retained baseline/final V8 JSON, green JSON, logs, counter/count summaries, authored SHA-256/revision and
  protected-path validation. Final supported Turbo style checks, Tasks formatting, git diff --check and
  stable DAG/sequence/link checks passed. The unchanged transitive Vite warning remains unsuppressed.
  ADR-0001/0002/0003/0005 conform for this bounded slice through unchanged approved tooling/API, class-first
  pure domain/private state, root-only assertions/types and Turbo gates; overall acceptance remains blocked.
  ADR-0004/0007 remain inapplicable as T-005 records; ADR-0006/0008 conform through approved in-flight scope,
  fresh sole writer, unchanged contracts, preserved historical failures and serial recovery evidence.
- Blocker: None for bounded T-010 recovery. T-012 attempt 2 is ready: renewed T-010 is done and T-011 historical
  green remains retained. The other recovery barriers, complete AC-026/type-operation inventory, full native
  coverage and final review remain unmet; no commit, publication, archival, current-main or merge permission.

### T-011 - Implement inheritance, deletion and collection ownership test-first

- Status: done
- Source: [P-004](Plan.md#implementation-steps); AC-007, AC-008, AC-009, AC-010, AC-011, AC-012,
  AC-013, AC-014, AC-015, AC-016, AC-017, AC-026.
- Dependencies: T-010.
- Completion condition: Observe InheritanceContract/CollectionOwnership runtime failures and applicable type
  failures for changes to established type behavior, then implement nearest whole-value replacement, ancestor-first duplicate-preserving lists and
  homogeneous records with whole-entry replacement, including reserved dictionary keys. Verify own-only modes,
  repeated direct-write replacement, present undefined/empty declarations, direct deletion revealing ancestors,
  matching-position inheritance without signature claims and no reset/suppression.
  Copy/freeze outer accumulating structures while retaining contained/replacement identity; green/refactor.
  Decorator-creation ownership is completed in T-012.
- Evidence: Attempt 1 / W-007 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, complete Brief/Plan/Tasks, all eight accepted active ADRs,
  architecture index, task template and applicable library/engineering/CI guidance. Invoked
  implementation-test-first and document-tasks; verified T-010 done, approved P-004/criteria, serial W-007
  ownership and in-flight feature/glacier-reflection at unchanged HEAD
  `98ebe5b271a2af89345d7b7f35729e28ca947640`. Preserved all earlier dirty work; no Git mutations,
  dependency restoration, configuration/manifest/adapter edits or additional exports.
  Every supported command used
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  Node returned v24.21.0 and pnpm 11.9.0; global Node remained v25.5.0.
  FIRST authored root-only
  [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts)
  and [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts).
  `pnpm --filter @glacier/reflection exec vitest run tests/scenarios/InheritanceContract.test.ts
tests/scenarios/CollectionOwnership.test.ts --coverage.enabled=false
--outputFile=tests/artifacts/t011/attempt1/red-results.json` exited 1 with 24 cases:
  22 intended AssertionError failures and two passing existing replacement cases, zero pending/skipped.
  Each real Node/Chromium project ran nine inheritance cases (eight failed) and three ownership cases (all failed).
  Failures observed nearest-only list results rather than ancestor contributions, dropped nonconflicting record
  entries, mutated caller list contents, non-null-prototype record output and missing snapshot-time getter failure.
  Machine-checked all 22 failures as AssertionErrors, not missing exports, tooling/startup or threshold failures.
  THEN implemented four domain files: MetadataStorage collects present nearest-first contributions;
  MetadataDefinitionOperations resolves fixed definition meaning while replacement stops at the nearest declaration;
  ListMetadataDefinition snapshots/freezes inputs and returns frozen ancestor-first concatenation without deduplication;
  RecordMetadataDefinition snapshots/freezes own enumerable string entries into null-prototype dictionaries and
  returns frozen ancestor-first whole-entry replacement. Values retain identity, snapshots complete before writes,
  explicit undefined/empty presence remains separate from absence, and deletion/instance/address behavior is preserved.
  No decorator behavior, discovery ownership, compiler activation or distribution behavior was added.
  Established public method signatures/type behavior remain unchanged; the existing MetadataTypes contracts already
  cover homogeneous entries, readonly outputs, possibly absent keys, inference, invariance and rejected misuse.
  No new type behavior is claimed and no artificial type red or bootstrap exception was used.
  Initial green ran all five suites in both projects: 196/196 passed. Refactored replacement collection to stop
  before unnecessary ancestor inspection, then strengthened unchanged-contract regressions for real differing
  constructor/method signatures, absent versus empty records, own-only frozen outputs and shared contained identities.
  Final `pnpm --filter @glacier/reflection exec vitest run --coverage.enabled=false
--outputFile=tests/artifacts/t011/attempt1/final-results.json` exited 0: 202/202 passed, no failures/pending/skips.
  Each project ran DefinitionContract 13, AddressContract 49, InstanceLookupContract 24,
  InheritanceContract 11 and CollectionOwnership four cases. Public tests cover all six address categories,
  repeated value/list/record replacement, direct deletion revealing ancestors, matching positions without signature
  equivalence, same-shaped replacement versus accumulation, reserved keys, inherited/symbol/nonenumerable exclusion,
  shallow identity, snapshot failure atomicity and inherited/own constructor/instance retrieval.
  `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force`
  passed all eight root/library tasks both before and after refactoring. Independent
  `pnpm --filter @glacier/reflection run type-check:contracts` passed against generated root declarations.
  Existing root exports and all three established type fixtures remain unchanged.
  Exact logs/results and machine-checked red/green summary are retained beneath ignored
  L `tests/artifacts/t011/attempt1/`: red.log/red-results.json, gates.log, green.log/green-results.json,
  final-gates.log, final-green.log/final-results.json, independent-types.log and summary.json.
  The existing transitive Vite module-runner analysis warning remains visible without suppression.
  No final coverage run was requested at this incomplete feature stage; the 100% overall/per-file gate remains
  unchanged, T-010's diagnostic coverage failure remains visible and T-021/final acceptance remain pending.
  Final Tasks formatting, forced Turbo style checks, git diff --check and task/wave/link validation passed.
  ADR-0001/0005 conform through approved unchanged runtime/pins, Chromium-only public-root tests and independent
  types; ADR-0002/0003 through dependency-free class-first private domain behavior, curated exports, strict
  signatures/JSDoc and supported Turbo checks. ADR-0004/0007 applicability remains T-005.
  ADR-0006/0008 conform through approved scope, actual red before implementation, one fresh worker,
  single-writer evidence and stable serial task/wave records. No final acceptance or Git authorization is inferred.
- Blocker: None for completed T-011. T-012 is ready only for a fresh bounded decorator red/green attempt;
  decorator-creation ownership remains T-012, discovery/compiler/distribution and final coverage remain pending.

### T-012 - Implement all legacy decorator locations test-first

- Status: done
- Source: [P-005](Plan.md#implementation-steps); AC-002, AC-003, AC-005, AC-006, AC-012, AC-013, AC-017, AC-026.
- Dependencies: T-011, T-010.
- Completion condition: Observe meaningful LegacyDecoratorContract runtime failures and DecoratorTypes failures
  for changes to established type behavior; independently verify unchanged type contracts, then implement class,
  instance/static property/method/accessor, constructor and instance/static method-parameter decorators.
  Genuine legacy fixtures cover inaccessible members/constructors and symbol/numeric keys; verify direct equivalence,
  accessor location sharing, constructor-only annotation normalization and void callbacks not replacing consumers.
  Snapshot accumulating values at decorator creation; invalid boundaries throw specified coded errors atomically.
  Implement only boundary-error behavior needed for observed contracts here; compiler codes/activation follow T-016.
- Evidence: Attempt 1 / W-008 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, complete Brief/Plan/Tasks, all eight accepted active ADRs,
  architecture index and library guidance; invoked implementation-test-first and document-tasks.
  Rechecked T-011 done, approved P-005/criteria and exact serialized ownership. Preserved all prior dirty work
  on feature/glacier-reflection at unchanged HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  Every supported command activated the existing session-local runtime using
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 and pnpm 11.9.0. No Git mutations, dependency restoration, configuration,
  manifest, lockfile, companion-document, other-suite or global-runtime changes.
  FIRST authored [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts),
  [DecoratorTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DecoratorTypes.test-d.ts)
  and test-owned LegacyLocations.ts under tests/data/compiler before changing behavior or declarations.
  Initial preparation exposed missing generated-fixture declarations, an optional descriptor and a mismatched
  test-input element. Fixed those test setup issues; they are not meaningful red.
  A diagnostic `tsc --project tsconfig.fixtures.json --declaration` initially rejected inferred inaccessible
  fixture types; supplied an explicit test-owned output interface, then preparation and baseline types passed.
  Replaced the generated-declaration dependency with an authored test-owned ambient module declaration in
  tests/data/LegacyFixtureModules.d.ts referring to the fixture's exact source type. Removed its generated .d.ts
  and verified ordinary unchanged `test:prepare`/Turbo commands work without that diagnostic emission option.
  The runtime suite imports real emitted JS, not source transformed into decorators by Vitest.
  Before implementation,
  `pnpm --filter @glacier/reflection exec vitest run tests/scenarios/LegacyDecoratorContract.test.ts
--coverage.enabled=false --outputFile=tests/artifacts/t012/attempt1/red-results.json`
  exited 1 in actual Node/Chromium: ten failed cases, zero passes/pending/skips.
  FOUR failures are meaningful AssertionErrors: genuine decorated declarations and creation of a valid
  decorator were expected not to throw, but the established not-implemented body threw.
  The other six failures are direct executions reaching that same stub, not independently counted assertion red.
  No missing export, import, compiler, browser-startup or coverage-threshold failure is counted as intended red.
  Baseline DecoratorTypes accepted-use/rejected-misuse checks passed against established declarations;
  no established public type behavior/signature changed, so no artificial type red or bootstrap exception was used.
  THEN implemented MetadataDecorator canonical constructor/prototype normalization, definition-owned callbacks,
  creation-time accumulating snapshots and only the required MetadataBoundaryError/root exports and code type.
  Domain remains independent of inbound infrastructure: legacy address translation is a pure domain operation.
  No compiler bridge, predefined compiler constants, Reflect activation or new discovery behavior was implemented.
  Callbacks return void, never replace classes/descriptors, and use the same normalized locations/storage as
  direct operations. Invalid targets/locations throw safe coded errors before mutation; inspection/snapshot
  exceptions remain observable. List/record inputs snapshot at creation; contained/replacement identities survive.
  Initial green was 210/212: genuine TypeScript numeric-property emission passes a numeric callback key.
  The actual emitted fixture exposed that normalization gap as two AssertionErrors before correction.
  Canonicalized numeric callback keys without widening the established string/symbol legacy callable types;
  corrected the test's initially mistaken numeric-invalid row to a malformed object key, preserving approved
  numeric-key support. Strengthened source-root numeric/symbol equivalence cases so built-fixture success is
  not substituted for mapped source coverage.
  Genuine fixtures verify class, instance/static fields, methods, getters/setters, constructor and method parameters,
  private/protected constructors/members, numeric/symbol keys and static/instance isolation without construction
  or getter/setter execution. Root cases verify accessor sharing, void identity-preserving callbacks,
  creation-time snapshots, repeated direct replacement, position-only inheritance/own-only absence,
  atomic boundary rejection, safe error/cause behavior and exceptional inspection/snapshot propagation.
  Final `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force`
  passed all eight root/library tasks. Independent `pnpm --filter @glacier/reflection run type-check:contracts`
  passed. Generated diagnostic copies with all six DecoratorTypes expected-error directives removed produced
  exactly six intended TS2345/TS2322 misuse diagnostics, not missing-symbol/setup failures; this independently
  verifies unchanged types, not production type-change red.
  Final `pnpm --filter @glacier/reflection exec vitest run --coverage.enabled=false
--outputFile=tests/artifacts/t012/attempt1/final-results.json` passed 216/216, zero failures/pending/skips:
  each project ran the preceding 101 cases plus seven decorator cases.
  `pnpm exec turbo run test --filter=@glacier/reflection --force --
--outputFile=tests/artifacts/t012/attempt1/coverage-results.json` passed all 216 assertions and genuine
  build/type/emission prerequisites, but exited 1 on unchanged 100% per-file thresholds.
  Combined scoped metrics: 99% statements, 98.37% branches, 97.82% functions, 99.6% lines.
  MetadataDecorator, MetadataBoundaryError and MetadataDefinitionOperations each reached 100% in all four metrics.
  Remaining gaps are in previously existing MetadataDiscovery/MetadataStorage/MetadataTarget; no exclusions,
  ignores, lowered thresholds, skipped cases or private hooks were introduced to conceal them.
  This is scoped development coverage, not final acceptance; T-021 remains pending.
  Exact logs/results, unsuppressed diagnostic copies and summary are retained beneath ignored
  L tests/artifacts/t012/attempt1. Initial setup errors and intermediate green failure remain visible.
  The existing transitive Vite module-runner analysis warning remains unsuppressed.
  Final supported style checks, git diff --check and task/wave/link validation passed.
  ADR-0001/0005 conform through unchanged approved pins/runtime, Chromium-only public-root contracts and
  independent types; ADR-0002/0003 through dependency-free private class-first domain behavior, curated root
  exports, inward imports and strict supported Turbo gates. ADR-0004/0007 applicability remains T-005.
  ADR-0006/0008 conform through observed red before behavior, preserved earlier evidence, one fresh worker,
  sole Tasks ownership and stable serialized waves. No final acceptance or Git authorization is inferred.
- Evidence (attempt 2 / W-008-R / 15.2, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer; invoked implementation-test-first, document-tasks and implementation-branching for approved
  in-flight adoption. Read AGENTS/Home, all eight accepted active ADRs, full Brief/Plan/Tasks and task template;
  verified T-010 attempt 2 summary and T-011 historical green against actual T-019 uncovered rows.
  Preserved preceding dirty work on feature/glacier-reflection at unchanged HEAD
  98ebe5b271a2af89345d7b7f35729e28ca947640. No Git mutation, install, configuration, dependencies,
  public exports/signatures, other production file or companion-document changes.
  All supported commands used the existing session-local PATH activation recorded above:
  Node v24.21.0 / pnpm 11.9.0; Vitest/V8/browser provider 5.0.3 and Playwright 1.63.0 unchanged.
  Baseline seven-suite Node/Chromium V8 run passed 256/256 cases with zero skips but exited 1 on
  unchanged per-file thresholds. Actual MetadataDecorator counters were 19/23 statements, 24/35 branches,
  1/1 functions: 82.60% statements, 68.57% branches, 100% functions, 81.81% lines. This diagnostic differs
  from retained T-019 full-suite coordinates and is not meaningful behavior red.
  Added only [DecoratorMappedContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DecoratorMappedContract.test.ts),
  importing the curated source root, separately from unchanged genuine built-root LegacyDecoratorContract.
  Four new cases per runtime assert 17 valid class/member/static/descriptor/numeric/symbol/constructor/method
  callback shapes and 25 malformed argument/target/key/descriptor/position rows. Assertions verify void returns,
  direct equivalence, exact discovery identities, own/inherited reads, untouched descriptors/no consumer execution,
  creation-time list/record snapshots, shallow contained/replacement identity, frozen mutation rejection and repeated
  declaration replacement. Typed coded errors preserve class, both member sides and discovery atomically;
  snapshot/inspection exceptions propagate without overwriting declarations. No private imports/inspection,
  mocks, testing hooks, exclusions, ignore annotations, skips or threshold changes.
  No production behavior or types needed correction: this is unchanged-contract mapped assertion recovery,
  not artificial runtime/type red; original meaningful T-012 red remains retained.
  Initial eight-task gate caught two TS2741 test-input errors because replacement objects lacked the inferred
  label field. Corrected only test input labels, without weakening assertions; retained gates.log.
  Final `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force`
  passed all eight root/library tasks. Independent
  `pnpm --filter @glacier/reflection run type-check:contracts` passed against generated root declarations.
  Final scoped command is `pnpm --filter @glacier/reflection exec vitest run
tests/scenarios/DefinitionContract.test.ts tests/scenarios/AddressContract.test.ts
tests/scenarios/InstanceLookupContract.test.ts tests/scenarios/DiscoveryContract.test.ts
tests/scenarios/InheritanceContract.test.ts tests/scenarios/CollectionOwnership.test.ts
tests/scenarios/LegacyDecoratorContract.test.ts tests/scenarios/DecoratorMappedContract.test.ts --coverage
--coverage.reportsDirectory=tests/artifacts/t012/attempt2/final-coverage
--outputFile=tests/artifacts/t012/attempt2/final-results.json`.
  All 264 cases passed, zero failures/pending/skips, 132 per Node/Chromium: Definition 19, Address 52,
  InstanceLookup 25, Discovery 10, Inheritance 11, CollectionOwnership four, LegacyDecorator seven and
  DecoratorMapped four. Actual mapped MetadataDecorator has 23/23 statements, 35/35 branches, 1/1 functions
  and 22/22 lines: 100% in every metric. T-010's three recovered files remain fully covered.
  Coverage correctly exits 1 for three OTHER files: MetadataDiscovery and both compiler adapters.
  Scoped aggregate 85.12% statements / 85.56% branches / 96.15% functions / 84.74% lines is not full
  native-suite or final acceptance coverage. Separate same-eight-suite `--coverage.enabled=false` run passed
  264/264 with exit 0. Unchanged genuine fixture executed in both projects; retained emitted JS explicitly
  verified public-root runtime import before all three design-key emissions. Built/source identities stay separate,
  without foreign-handler coexistence or private reset workarounds. No fixture preparation outside owned outputs.
  Baseline/final coverage JSON, green results, gate/type logs, counter summaries and protected hashes are retained
  beneath ignored L tests/artifacts/t012/attempt2. Final supported style/document formatting, protected-hash,
  task DAG/sequence/link checks passed. Existing transitive Vite warning remains visible and unsuppressed.
  ADR-0001/0002/0003/0005 conform for this bounded slice through unchanged approved runtime/API/dependencies,
  root-only meaningful assertions, source/built identity isolation and supported Turbo/independent type checks;
  full AC-026 acceptance remains blocked. ADR-0004/0007 applicability remains T-005. ADR-0006/0008 conform
  through approved fresh bounded single-writer recovery, preserved history and serialized sequence.
- Blocker: None for bounded T-012 recovery. T-013 attempt 2 is ready for a fresh worker after this barrier.
  MetadataDiscovery/compiler recovery, complete operation/type inventory, full native mapped coverage and
  T-018/T-019 renewals remain pending; no commit, publication, archival, current-main or merge permission.

### T-013 - Implement both discovery directions test-first

- Status: done
- Source: [P-005](Plan.md#implementation-steps); AC-004, AC-014, AC-015, AC-018, AC-019, AC-026, AC-027.
- Dependencies: T-012.
- Completion condition: Observe meaningful DiscoveryContract runtime failures and type failures for changes to
  established type behavior; independently verify unchanged type contracts, then implement address-scoped identity
  discovery and definition-owned location discovery. Verify own/inherited deduplication, present undefined/empty
  declarations, deletion cleanup, canonical numeric names/explicit sides, shallow-frozen target-free results,
  constructor-wide versus instance-filtered locations and readDynamic round trips. Do not imply enumeration
  of all members, ordering guarantees or recovered static parameter signatures; green/refactor.
- Evidence: Attempt 1 / W-009 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer; status progressed pending → in_progress → done. Read AGENTS/Home, all eight
  accepted active ADRs, full Brief/Plan/Tasks, the task template and applicable architecture/library/engineering
  guidance. Invoked implementation-test-first and document-tasks. Rechecked T-012 done, approved P-005/criteria
  and serialized ownership on feature/glacier-reflection at unchanged HEAD
  `98ebe5b271a2af89345d7b7f35729e28ca947640`. Preserved all earlier dirty work.
  Every supported command used
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  Node v24.21.0 and pnpm 11.9.0 were used without dependency restoration, global runtime changes or Git mutations.
  FIRST authored public-root
  [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts)
  and strengthened the existing
  [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts)
  for readonly identity/address arrays, complete canonical discovery unions even through erased constructor
  references, dynamic own-mode round trips and rejection of checked-address/identity-write misuse.
  Baseline `pnpm --filter @glacier/reflection run type-check:contracts` passed; public types/signatures are unchanged,
  so this is independent established-contract verification, not type-change red or another bootstrap exception.
  `pnpm --filter @glacier/reflection exec vitest run tests/scenarios/DiscoveryContract.test.ts
--coverage.enabled=false --outputFile=tests/artifacts/t013/attempt1/red-results.json`
  exited 1 with 16 cases: four intended AssertionError failures, 12 passes, zero pending/skips across
  real Node/Chromium. The two failing cases per runtime observed mutable definition arrays and mutable
  discovered addresses instead of the approved shallow-frozen outputs. The initial run observed the location
  array failure first; reordered that case to assert address freezing first and reran red before implementation.
  Missing tooling/exports, startup errors and coverage thresholds were not the red evidence.
  Existing identity/address indexing already satisfies the remaining discovery semantics; THEN changed only
  MetadataStorage to freeze independent canonical address snapshots and both result arrays, including empty
  arrays, without freezing/copying definitions or adding target references. Updated its contract JSDoc.
  No new root exports, public signature changes, adapters, compiler activation, manifests/configuration,
  other runtime suites, dependencies or companion docs were changed.
  Discovery scenarios verify actual same-name identities across all definition kinds, exact address scoping,
  own/inherited deduplication, undefined/empty presence, replacement and direct-deletion index cleanup,
  independent snapshots, numeric string canonicalization, symbol identity, explicit sides, all parameter kinds
  and positions, constructor-wide versus instance-filtered results, two instances/shadowed constructor getters,
  typed rejection and preserved proxy exceptions. Every discovered location round-trips through readDynamic;
  own retrieval explicitly supplies inheritance: own. Tests do not require ordering, runtime member existence,
  recovered signatures, all-member inventories, internal access, module mocks or a class registry.
  Initial all-suite green passed 232/232; strengthened own-mode coverage of every address and exact
  side/parameter/numeric aliases without changing behavior. Final
  `pnpm --filter @glacier/reflection exec vitest run --coverage.enabled=false
--outputFile=tests/artifacts/t013/attempt1/final-results.json`
  exited 0 with 234/234 passes and zero failures/pending/skips: each runtime ran the prior 108 cases plus
  nine discovery cases. Both `pnpm exec turbo run build type-check lint format-check
--filter=@glacier/reflection --force` invocations passed eight root/library tasks. Final independent
  `pnpm --filter @glacier/reflection run type-check:contracts` passed against generated root declarations.
  `pnpm exec turbo run test --filter=@glacier/reflection --force --
--outputFile=tests/artifacts/t013/attempt1/coverage-results.json`
  passed all 234 assertions and build/type/genuine-fixture prerequisites, but exited 1 on unchanged 100%
  per-file thresholds. Combined scoped metrics: 99% statements, 98.78% branches, 97.82% functions,
  99.6% lines. Remaining diagnostic gaps: MetadataDiscovery private constructor function (66.66% functions),
  MetadataStorage (98.57% statements/97.36% branches) and MetadataTarget (95.12% statements/
  93.33% branches/97.05% lines). No threshold, exclusion, ignore, skip or private hook was introduced.
  Full coverage/final acceptance remain T-021, not inferred from scoped runtime green.
  Exact logs/JSON and machine-checked assertion/count summary are retained under ignored
  L tests/artifacts/t013/attempt1; red failures are AssertionErrors, not setup failures. The existing transitive
  Vite module-runner warning remains visible and unsuppressed.
  Final supported Tasks formatting, forced Turbo style checks, git diff --check and task/wave/link validation
  passed. ADR-0001/0005 conform through unchanged pins/runtime, Chromium-only root-contract tests and independent
  types; ADR-0002/0003 through dependency-free private class-first domain behavior, unchanged curated exports,
  strict signatures/JSDoc and Turbo gates. ADR-0004/0007 applicability remains T-005.
  ADR-0006/0008 conform through observed runtime red, unchanged type behavior, fresh bounded sole writer,
  stable task/wave evidence and preserved separate authorization gates. No final acceptance or Git authorization.
- Evidence (attempt 2 / W-009-R / 15.3, 2026-10-04): One fresh bounded worker without recursive delegation,
  sole Tasks writer; invoked implementation-test-first and document-tasks. Read AGENTS/Home, all eight accepted
  active ADRs, complete Brief/Plan/Tasks, the task template and actual T-019 line findings/current sequence.
  Verified T-012 attempt 2 summary: 264 passes, zero skips, MetadataDecorator fully covered; T-010's three
  recovered files remain fully covered. Preserved feature/glacier-reflection at unchanged HEAD
  98ebe5b271a2af89345d7b7f35729e28ca947640, existing dirty work and all protected authored paths.
  Commands activated the existing session-local Node v24.21.0 / pnpm 11.9.0; exact approved test pins,
  Chromium-only configuration, exports, production API, dependencies and thresholds remain unchanged.
  Reviewed all ten named DiscoveryContract cases: both public static operations already have observable identity,
  inheritance, own-mode, canonical-location, empty/undefined, deletion, readonly, instance-filtering, typed rejection
  and exceptional-inspection assertions. Fresh eight-suite Node/Chromium V8 execution passed 264/264 with zero
  failures/pending/skips; EACH project includes ten discovery cases. Actual MetadataDiscovery counters have
  8/8 statements, 4/4 branch arms and 2/3 functions covered, with 100% lines. Its sole uncovered function is the
  empty private constructor at current line 13; both public methods execute. Coverage correctly exits 1 at
  66.66% Discovery functions and the two compiler adapters' remaining gaps, not assertion failures.
  Aggregate scoped metrics remain 85.12% statements / 85.56% branches / 96.15% functions / 84.74% lines;
  this is not full native-suite coverage or final acceptance. T-010/T-012 recovered metrics remain 100%.
  Added only an explicit generated-root type assertion that typeof MetadataDiscovery is not assignable to an
  abstract public constructor signature, without constructing it even in a type fixture. Eight forced Turbo
  build/type/lint/format tasks and independent type-check:contracts passed. This verifies unchanged approved
  typing, not new type behavior, artificial red or reuse of the bootstrap exception.
  Diagnostic-only constructor alternatives remain under ignored L tests/artifacts/t013/attempt2 and are never
  runtime-imported/invoked. TypeScript rejects a bodyless private constructor with TS2390, and a declare private
  constructor with TS1031/TS2390. Removing the constructor makes the class publicly constructible: a conditional
  type counterexample fails with TS2322. The first probe command stopped at TS5112 (explicit files require
  --ignoreConfig in the installed compiler); reran with that flag and retained the actual syntax/type diagnostics.
  Neither setup failure nor these alternative diagnostics is claimed as a production behavior-red gate.
  An abstract class, namespace/static object or exported facade would change the approved class/private-constructor
  design; an internally constructed sentinel/singleton would merely manufacture constructor execution with no
  discovery-contract purpose. No such rewrite, public constructor, runtime private invocation, cast, private
  inspection, mock, test hook, executable exclusion, ignore annotation or threshold change was introduced.
  Exact logs/results/counters, revision, protected hashes and blocked summary are retained under ignored
  L tests/artifacts/t013/attempt2. Supported document formatting, git diff --check and task DAG/remaining-sequence
  validation passed. Existing transitive Vite warning remains visible. ADR-0001/0002/0003/0005 boundaries and
  unchanged public-root contracts are preserved; ADR-0005 final coverage remains unmet, not waived.
  ADR-0004/0007 applicability remains T-005; ADR-0006/0008 conform through bounded single-writer recovery,
  honest failures and stopping at a material design decision. No Git mutation, dependency restoration, companion
  edit, archival, final checks, CI/Snyk or acceptance is claimed.
- Historical attempt 2 blocker: The approved emitted runtime class with an explicit private constructor retains a constructor function
  that no approved public discovery operation creates. No demonstrated executable-scaffolding removal preserves
  that exact private-constructor declaration while meeting unmodified 100% function coverage without artificial
  execution. User decision is required: approve a revised nonconstructible static-object/facade API in Plan.md
  (and review resulting type/runtime contracts), or separately approve a narrowly scoped ADR-0005 coverage-policy
  exception for this inaccessible constructor. Neither option is authorized or applied here; ordinary abstract/public
  constructors are not equivalent to the approved private constructor. T-016 is not dispatch-ready because its
  T-013 prerequisite remains blocked; later recovery waves retain their order and must not bypass this barrier.
- Prerequisite facade repair attempt 1 / W-009-F / 15.3.1, 2026-10-04: One fresh bounded documentation worker,
  no recursive delegation, sole Plan/Tasks writer. Read AGENTS/Home, all accepted active ADR-0001 through ADR-0008,
  full Brief/Plan/Tasks, templates, relevant technology/dependency/library guidance and exact discovery implementation
  and public contracts. Adopted the confirmed in-flight feature/glacier-reflection branch, preserving dirty work.
  Invoked documentation-plan, document-tasks, review-adr-conformance and implementation-branching.
  The actual user decision is recorded only in [Plan approval](Plan.md#approval).
  Revised the exact facade declarations, source/export counts and class-first implementation design there;
  preserved attempt 2's 264 passing assertions/eight Turbo gates, 66.66% functions and rejected alternatives
  as historical evidence, not fresh execution. No runtime/type check, implementation, coverage success or
  T-013 completion is claimed by this repair. ADR-0003 requires no change: substantial behavior stays in
  purpose-specific class methods and the facade is a readonly data record of those references.
  T-013 attempt 3 must first observe readonly-binding type red and frozen-record runtime red, then implement
  the approved shape and verify unchanged NoInfer signatures/nonconstruction plus mapped 100% discovery coverage.
- Evidence (attempt 3 / W-009-R / 15.3.2, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer; invoked implementation-test-first, document-tasks and implementation-branching.
  Verified the approved facade declaration/design, T-012 attempt 2 completion and current serialized ownership.
  Preserved feature/glacier-reflection and HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  All commands used the existing session-local Node v24.21.0 / pnpm 11.9.0; Vitest/V8/browser 5.0.3,
  Playwright 1.63.0 and Chromium only, without installation or dependency/configuration changes.
  BEFORE production edits, authored root-only readonly-binding, noncallable/nonconstructible, absent prototype
  and absent class-instance-type fixtures in InstanceLookupTypes/DistributionTypes. Independent generated-root
  contracts failed with six intended TS2578 unused-expect-error diagnostics: the old class permitted binding
  mutation, prototype access and instance typing. Existing nonconstruction, generic NoInfer, finite-position
  and readonly result contracts were retained; missing symbols/setup failures were not claimed as type red.
  Added two public-root runtime cases for freeze/record identity, exact operation descriptors and binding
  stability, plus detached operation identities/empty results/typed rejections. Initial runtime red had four
  failures: record-kind mismatch and an incorrect empty-member rejection fixture. Empty names are valid;
  corrected only that fixture to the existing invalid-position contract and put freeze first, still BEFORE
  production edits. Verified red then had exactly two intended Object.isFrozen assertion failures, one per
  Node/Chromium project, and 22 passes. The initial diagnostic run remains retained, not concealed.
  Replaced only the approved discovery export representation with the non-exported IMetadataDiscovery
  contract and camelCase Object.freeze record of direct internal MetadataDiscoveryOperations static-method
  references. The new class retains normalization/storage behavior, no this dependency or explicit constructor.
  Existing root re-export and all other named exports remain unchanged; no new root class/type/helper API.
  Generated declarations match the approved readonly generic NoInfer/result signatures. Scoped discovery green
  passed 24/24; fresh eight-suite Node/Chromium V8 execution passed 268/268, zero failures/pending/skips.
  Actual source-mapped counters: MetadataDiscovery 1/1 statements and 1/1 lines, no executable functions or
  branches (0/0); MetadataDiscoveryOperations 8/8 statements, 2/2 functions, 4/4 branches and 6/6 lines.
  Both included production files therefore meet 100% in all four metrics without exclusions/ignores.
  MetadataDecorator/MetadataTarget/MetadataStorage/MetadataDefinitionOperations also retain all-metric 100%.
  Coverage correctly exits 1 solely for the two compiler adapters owned by T-016; aggregate scoped results
  are 85.16% statements / 85.56% branches / 98.03% functions / 84.78% lines, not full native acceptance.
  Independent generated-root types and eight forced Turbo root/library build/type/lint/format tasks pass.
  The first Turbo run rejected five type-fixture lint warnings (self-assignment/unused expression); corrected
  fixtures with detached aliases and void access, without suppressions, then reran all eight gates successfully.
  Exact red/green logs, runtime JSON, mapped coverage/LCOV, revision, protected hashes and summary persist
  under ignored L tests/artifacts/t013/attempt3. Verified all 476 protected authored file hashes unchanged.
  Final supported Tasks formatting and git diff --check pass; validated 29 stable task records, an acyclic DAG,
  14 uniquely ordered remaining waves with prerequisite/count checks and 176 relative links/anchors.
  ADR-0001/0002/0003 conform through unchanged pins/runtime/root exports and class-first inward domain behavior;
  ADR-0005 through actual included-file counters, independent types and meaningful dual-runtime root assertions.
  ADR-0004/0007 remain library-only/non-React inapplicable. ADR-0006/0008 conform through explicit material-design
  approval, strict observed red before replacement, preserved history, fresh bounded sole writer and sequence.
  No production test export, private invocation, unsafe cast, mock, artificial constructor, threshold workaround
  or Git mutation. README/companions remain protected for T-018; full mapped/native verification remains T-017/T-021.
- Blocker: None for T-013. T-016 attempt 2 / W-012-R is now dispatch-ready after this barrier.
  Compiler mapped-coverage recovery, T-017 distribution/operation accounting, T-018 documentation renewal and
  T-019 rejoin remain required; no final acceptance, commit, publication, merge or archive authorization is inferred.

### T-014 - Verify decorator and discovery integration

- Status: done
- Source: [P-005](Plan.md#implementation-steps); AC-002, AC-017, AC-018, AC-019, AC-026, AC-027.
- Dependencies: T-012, T-013.
- Completion condition: Run joined package-root runtime/type contracts in Node/Chromium; discover/read direct and
  decorated declarations on constructors/instances in both modes. Confirm shared isolation, ownership and rejection
  behavior, resolve regressions without weakening contracts, and record commands/revision/results before P-006.
- Evidence: Attempt 1 / W-010 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer; status progressed pending → in_progress → done. Read AGENTS/Home, accepted active
  ADR-0001 through ADR-0008, full Brief/Plan/Tasks, task template and applicable architecture/library guidance.
  Verified T-012/T-013 done and approved P-005 scope on feature/glacier-reflection at unchanged HEAD
  `98ebe5b271a2af89345d7b7f35729e28ca947640`; preserved all preceding dirty work and performed no Git mutations.
  Invoked document-tasks and implementation-test-first before strengthening existing public-root assertions.
  All commands used `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 / pnpm 11.9.0, without restoration, dependency/configuration changes or global activation.
  Inspected existing decorator, discovery and instance assertions; added one focused joined case to
  [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts)
  and strengthened genuine emitted-fixture discovery assertions in
  [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts).
  Joined direct descendant and decorated ancestor list/record declarations establish both discovery directions,
  constructor/two-instance equivalence, inherited/own modes, static filtering, shadowed-constructor avoidance,
  same-name/unrelated-class isolation, creation snapshots, shallow readonly results/contained identity,
  atomic decorator/direct rejection and deletion revealing ancestors while retaining other definitions.
  Genuine emitted annotations at all 23 Consumer locations now round-trip through presence/read and both discovery
  directions in both modes, without constructing consumers or invoking accessors.
  Initial forced runtime run exited 1 with two failed assertions and 234 passes: using source-root discovery
  against genuine fixture declarations from the separate built-root module returned no definitions. This is
  test module-identity coupling, not a production defect or intended new-behavior red. Corrected the fixture
  assertions to consume MetadataDiscovery from the same built public package root as the fixture; retained
  source-root joined integration for mapped coverage. No internal import, mock, private inspection, public type
  change or production correction was needed; no artificial runtime/type red or bootstrap exception is claimed.
  `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force` passed eight tasks.
  An intermediate attempt to combine test arguments with those tasks failed because Turbo forwarded Vitest
  arguments to Oxlint; retained final.log and reran the supported commands separately, without changing tooling.
  Final separate gates passed eight tasks; `pnpm exec turbo run test --filter=@glacier/reflection --force --
--coverage.enabled=false --outputFile=tests/artifacts/t014/attempt1/final-results.json` passed six prerequisite/
  runtime tasks and 236/236 assertions across Node/Chromium (118 each), zero failures/pending/skips.
  Independent `pnpm --filter @glacier/reflection run type-check:contracts` passed all unchanged public type fixtures.
  Final coverage-enabled `pnpm exec turbo run test --filter=@glacier/reflection --force --
--outputFile=tests/artifacts/t014/attempt1/coverage-results.json` passed all 236 assertions but exited 1 at the
  unchanged 100% per-file thresholds: MetadataDiscovery functions 66.66%; MetadataStorage statements 98.57%/
  branches 97.36%; MetadataTarget statements 95.12%/branches 93.33%/lines 97.05%. Those pre-existing gaps remain
  for final verification; no threshold/exclusion/ignore/private hook or skipped test was introduced.
  Logs/JSON and revision/result summary are retained beneath ignored L tests/artifacts/t014/attempt1.
  Existing transitive Vite import-analysis warning remains visible. Final supported style checks, whitespace,
  stable task/dependency/wave/link checks passed. ADR-0001/0005 conform through unchanged pins/runtime,
  Chromium-only public-root assertions and independent types; ADR-0002/0003 through unchanged production/API,
  curated root-only tests and Turbo gates; ADR-0004/0007 remain inapplicable per T-005; ADR-0006/0008 through
  approved bounded ownership, fresh sole writer, honest failed-check history and serialized evidence.
- Blocker: None for scoped T-014 integration. T-015 is ready for a fresh bounded compiler-contract red worker;
  no compiler implementation/constants/activation were added. Coverage and full AC-026/final acceptance remain
  unmet until the remaining required contracts and T-021 gates pass. No commit/publication/archive permission.

### T-015 - Establish failing real compiler and import-boundary contracts

- Status: done
- Source: [P-006](Plan.md#implementation-steps); AC-020, AC-021, AC-022, AC-023, AC-026.
- Dependencies: T-014.
- Completion condition: Compile real TypeScript fixtures importing the root before decorated declarations execute;
  observe missing automatic-recording/replacement/rejection failures in fresh Node processes and Chromium realms.
  CompilerMetadataContract and ImportCompatibility cover all three keys, unknown keys, malformed scalar/dense/sparse
  arrays, invalid targets/locations, unchanged old declarations, foreign-handler descriptors, unavailable Reflect,
  installation failure, repeated same-module imports versus duplicate physical copies and unrelated Reflect
  preservation. Resources have bounded startup, awaited completion and finally cleanup with observable failures.
  No module mocks, production reset/uninstall API or private inspection.
- Evidence: Attempt 1 / W-011 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Invoked implementation-test-first and document-tasks; read AGENTS/Home, Brief/Plan/Tasks,
  all accepted active ADR-0001 through ADR-0008 and applicable architecture/engineering guidance.
  T-014 is done and the linked joint approval covers P-006 and AC-020/021/022/023/026. Preserved all preceding
  dirty work; no Git operation, dependency restoration, manifest/configuration/lockfile, compiler implementation,
  companion-document or global-runtime change. Revision remains the supplied
  `98ebe5b271a2af89345d7b7f35729e28ca947640`; this attempt performed no Git writes or Git-based freshness check.
  Supported commands used the existing session-local
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"` activation.
  FIRST extended [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts)
  with accepted-use/rejected-misuse compiler contracts and authored RecordedCompilerFixture.ts under tests/data/compiler.
  Retained fixture-first hashes/time before adding the six approved compiler declaration/constant files and root
  exports SECOND. The constants are exact ordinary ValueMetadataDefinition instances using already-established
  operations, not specialized compiler implementations. Added only IRuntimeType, ICompilerMetadataDecorator with
  ambient Reflect.metadata, ICompilerMetadataRejectionCode and the three predefined constants. No new storage,
  recorder, validation, installation, reset/uninstall, public helper or changed established signature was added.
  This is the approved first-declaration fixture-first verification, not initial type-red evidence.
  Independent `pnpm --filter @glacier/reflection run type-check:contracts` passed against generated public declarations.
  Diagnostic-only artifact copies removing all 37 MetadataTypes expected-error directives produced exactly
  37 intended diagnostics at the 37 misuse locations, including six new compiler misuse locations.
  A separate accepted-write control produced exactly one unused-directive TS2578; no missing-export/setup diagnostic
  is counted as type red. Runtime coverage makes no claim for erased types.
  Authored [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts)
  and [ImportCompatibility](../../../packages/libraries/glacier-reflection/tests/scenarios/ImportCompatibility.test.ts),
  with test-owned CompilerContractProbe, FreshCompilerRealm, CompilerRealmServer and CompilerContractRun.
  Node observations use fresh awaited child processes. Chromium observations use disposable native-module iframe
  realms, importing real generated ESM from a loopback-only test server; an import map resolves the public package
  root before genuine decorated declarations execute. No parent-module-runner injection, mock, private inspection
  or production cleanup API is used. Resources have eight-second readiness/observation/cleanup bounds, supervised
  execution, finally cleanup and observable failures; server readiness is checked with a real fetch. Duplicate
  physical copies are refreshed from the whole built ESM tree, not manufactured handlers or cache-busting imports.
  Initial direct-Vite iframe loading failed because Vitest's transformed dynamic import required the parent module
  runner; those 55 browser setup failures are NOT intended red. Corrected test-owned delivery with the native fixture
  server, without changing dependencies/configuration. Initial lint/small fixture-inference failures were corrected
  before recording meaningful red; their logs remain retained.
  Final `pnpm exec turbo run build type-check lint format-check test:prepare --filter=@glacier/reflection --force`
  passed all nine root/library tasks. TypeScript preparation genuinely emitted all three __metadata keys;
  machine-checked the runtime package-root import precedes their decorated execution.
  From repository root, final
  `node packages/libraries/glacier-reflection/tests/data/CompilerContractRun.ts --coverage.enabled=false
--outputFile=tests/artifacts/t015/attempt1/verified-results.json`
  launches and supervises the native fixture server and then invokes real `pnpm exec vitest run` in the library.
  It exited 1 with 350 cases: 112 intended AssertionError failures, 238 passes, zero pending/skips.
  Each real Node/Chromium project ran 175 cases: all 118 preceding custom cases passed, one new ordinary-constant
  case passed, and 56 compiler/import cases failed. Genuine emission reads were valid-but-absent instead of recorded
  String/Number/Function/Boolean representations; imports accepted foreign descriptors/unavailable Reflect/uninstallable
  slots instead of throwing the approved codes; repeated imports had no installed handler and duplicate copies
  did not conflict. All final failures are assertions, not imports, compiler/startup failures or coverage thresholds.
  Detailed rejection/replacement cases currently report missing activation, not independently exercised rejection
  branches: T-016 must activate the bridge and make their precise outcomes green, without treating this red baseline
  as successful atomic rejection verification. Cases cover all keys, unsupported string/symbol keys, malformed scalars,
  wrong/dense/sparse/holey arrays, immediate factory rejection, invalid targets/locations and unchanged old declarations.
  They also cover compiler-array snapshots/freeze, whole-array empty replacement, unavailable scalar replacement,
  readonly inferred contracts, direct ordinary-array identity, same-name isolation, foreign writable/locked/nonfunction/
  throwing-accessor descriptors, repeated same-ESM identity, physical-copy conflict and every unrelated Reflect descriptor.
  Exact logs/results, fixture/declaration order, independent diagnostic controls and machine-checked summary are under
  ignored L tests/artifacts/t015/attempt1. Final summary verifies 236 unchanged custom passes and 112 assertion failures.
  CompilerContractRun is the required native-realm invocation helper; invoking these browser cases without its live
  server is setup failure, not red. Future full-gate/CI integration must preserve native delivery and artifact readiness,
  rather than weaken isolation or count Vitest module-runner startup errors as contract evidence.
  The 100% overall/per-file coverage gate remains unchanged and pending; no coverage acceptance is claimed.
  Existing transitive Vite import-analysis warning remains visible. ADR-0001/0005 conform through unchanged pins,
  supported runtime, Chromium-only real public-root tests and independent types; ADR-0002/0003 through curated
  root imports, single-primary declarations, class-first test support and passing Turbo checks. ADR-0004/0007
  remain inapplicable per T-005; ADR-0006/0008 through approved bounded first declarations, actual runtime assertion
  red, preserved earlier history, single-writer evidence and serialized waves. No acceptance or Git authorization.
- Blocker: None for the scoped T-015 red task. T-016 is ready for one fresh bounded implementation worker using
  the native-realm runner; bridge activation/rejection semantics, normal full-gate/CI harness integration and final
  100% coverage remain unverified. Source-root and built-root module identities must not accidentally conflict
  when established genuine decorator suites are rerun after activation.

### T-016 - Implement automatic compiler recording and boundary errors

- Status: done
- Source: [P-006](Plan.md#implementation-steps); AC-004, AC-020, AC-021, AC-022, AC-023, AC-026.
- Dependencies: T-015, T-013.
- Completion condition: Implement ordinary predefined value-definition constants, inbound checked compiler recorder
  and root-triggered Reflect installation to pass T-015. Snapshot/freeze compiler arrays before atomic storage;
  descendant arrays replace whole arrays, including empty arrays. Typed direct writes retain ordinary value identity.
  Global factory/callback reject observably with safe coded errors and preserved causes, without overwriting foreign
  handlers/descriptors or altering unrelated Reflect operations. Domain stays independent of activation.
  Re-run all custom runtime/type contracts with genuine emitted metadata present; green/refactor.
- Evidence: Attempt 1 / W-012 on 2026-10-04 used one fresh bounded worker, without recursive delegation,
  as sole Tasks writer; status progressed pending → in_progress → done. Invoked implementation-test-first and
  document-tasks; read AGENTS/Home, full Brief/Plan/Tasks, all accepted active ADR-0001 through ADR-0008,
  architecture/techstack/dependency and library/task guidance. Verified T-015 done and its retained
  `tests/artifacts/t015/attempt1/summary.json` and native invocation evidence: 350 cases, 112 intended assertion
  failures, 238 passes, zero skips, including all 236 prior custom passes. That genuine red preceded this implementation.
  Adopted the approved in-flight story continuation and preserved all prior dirty work; no Git mutation, dependency
  restoration, manifest/configuration/helper change, companion-document edit or global runtime change.
  The supplied base revision remains `98ebe5b271a2af89345d7b7f35729e28ca947640`; no new commit or freshness claim.
  Supported commands activated the existing session-local runtime with
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 / pnpm 11.9.0. Exact approved dependencies and Chromium-only configuration are unchanged.
  Added only inbound CompilerMetadataRecorder/CompilerMetadataBridge adapters and root-triggered activation.
  Existing compiler constants remain ordinary ValueMetadataDefinition instances, with unchanged root exports/types.
  The internal recorder validates exact keys, scalar function/undefined representations and every own dense array
  entry, snapshots/freezes the complete emitted array at factory time, validates canonical class/member callback
  addresses and then invokes ordinary atomic set. Individual parameter callbacks reject. Ordinary typed set/decorator
  still retain whole-array/value identity; compiler inheritance replaces entire arrays, including empty arrays.
  Installation inspects the metadata descriptor without invoking foreign accessors, rejects occupied handlers,
  preserves descriptors on conflict/failure and touches no unrelated Reflect operation. Unavailable Reflect and
  uninstallable slots fail explicitly. Factory/callback rejections use safe coded MetadataBoundaryError instances;
  exceptional snapshot/inspection/installation failures preserve causes. The domain has no activation dependency,
  and no reset/uninstall/toggle, general Reflect API, helper export, registry or runtime dependency was introduced.
  Initial nine-task supported Turbo build/type/lint/format/emission gate passed. The required
  `node packages/libraries/glacier-reflection/tests/data/CompilerContractRun.ts --coverage.enabled=false
--outputFile=tests/artifacts/t016/attempt1/first-results.json` then ran real Node/Chromium native realms:
  336 assertions passed, but both LegacyDecoratorContract suites failed collection with foreign-handler.
  This was the anticipated source-root plus physical built-root identity conflict, not intended new-behavior red.
  Necessary correction was confined to the established LegacyDecoratorContract suite: use one built public-root
  identity consistently with its genuine emitted fixture, and strengthen exact unordered discovery sets to include
  each actually emitted compiler definition alongside the custom annotation. No assertion was skipped, no foreign
  handler replaced, and no helper/configuration or production coexistence exception was added. Existing fixture
  emission and all seven legacy cases remain intact. Corrected native run passed 350/350, zero failures/skips.
  Added four mapped public-root compiler cases for all three keys/isolation, factory-time frozen snapshots versus
  ordinary typed-decorator identity, safe preserved snapshot/target causes, and immediate/atomic rejection.
  These strengthen already-approved implemented behavior; no new public signature or behavior correction followed.
  Expanded native run passed 358/358 (179 each runtime), including all 236 earlier custom cases, zero skips.
  Refactored only the recorder's expected-error guard with green contracts; final native rerun passed 358/358.
  All native invocations used the unchanged test-owned CompilerContractRun owner, real loopback readiness,
  real compiler emission and finally cleanup; no missing-server direct browser run is counted as evidence.
  Final `pnpm exec turbo run build type-check lint format-check test:prepare --filter=@glacier/reflection --force`
  passed all nine tasks. Independent `pnpm --filter @glacier/reflection run type-check:contracts` passed;
  established type contracts/signatures are unchanged, so no artificial type-red or new bootstrap claim.
  A diagnostic native run without `--coverage` passed but did not collect coverage; retained separately,
  not described as a V8 result. Actual `CompilerContractRun.ts --coverage
--outputFile=tests/artifacts/t016/attempt1/coverage-enabled-results.json` passed 358 assertions but exited 1
  on unchanged 100% per-file thresholds. Combined mapped V8 metrics: statements 95.35%, branches 91.15%,
  functions 98.07%, lines 96.12%. Gaps include native-realm-only installation/error paths and source mapping
  of the corrected built-root legacy suite, plus existing Discovery/Storage/Target paths. These diagnostic
  failures remain visible; built/native execution is not falsely counted as mapped source coverage.
  No threshold/exclusion/ignore/private hook or retry masking was introduced. Final full-suite/100% acceptance
  remains T-021; standard Turbo test/CI native-server integration also remains explicitly unverified.
  Exact command logs, JSON results, emission/hash/count evidence and coverage are retained under ignored
  L `tests/artifacts/t016/attempt1/`. Existing transitive Vite module-runner warning remains unsuppressed.
  Final supported style checks and stable task/dependency/wave/link validation passed.
  ADR-0001/0005 conform through unchanged pins/runtime, Chromium-only public-root/native assertions and independent
  types; ADR-0002/0003 through inward relative adapter imports, independent domain, curated root, class-first
  implementation/JSDoc and strict supported Turbo gates. ADR-0004/0007 remain inapplicable per T-005.
  ADR-0006/0008 conform through approved scope, prior meaningful red, bounded fresh sole writer, necessary existing
  fixture-identity correction, honest coverage failures and serialized evidence. No final acceptance/Git permission.
- Evidence: Attempt 2 / W-012-R / 15.4 used one fresh bounded worker without delegation or Git mutation.
  Preserved the approved facade, API signatures, production behavior and prior dirty authored work.
  Invoked implementation-test-first and document-tasks. Added public-root sparse/invalid-array atomicity,
  canonical-owner rejection between callback normalization and storage, and consumer-thrown boundary-error cause
  assertions. Added real native Node/Chromium null-Reflect and throwing-Reflect import probes with descriptor
  preservation and safe causes. These establish existing approved behavior; no production change, artificial
  behavior/type red, type widening or new dependency was needed.
  Tested pinned V8 `autoAttachSubprocess` with generated-dist inclusion as a collection experiment.
  This yielded statements 99.03% (719/726), branches 97.07% (565/582), functions 68.30% (97/142),
  and lines 100% (309/309), but distinct transformed/generated function locations created duplicate
  constructor/prepare rows and zero-count generated uncovered companions. This is not a valid complete map join.
  Reverted the experimental configuration completely; no counter rewriting, exclusions or weaker thresholds
  remain. Pinned V8 conversion reads extended-context JavaScript without its external source map; its browser
  command also filters out scripts from the separate native server origin. Subprocess attachment alone therefore
  does not solve the Node and Chromium native mapping boundaries.
  Corrected an initial test-support nesting error; this was not behavior red. Final real native invocation passed
  **410/410** tests, zero failures/skips, using the existing bounded server/child/iframe owner and cleanup.
  Actual unchanged mapped coverage exits **1**: statements **98.35% (358/364)**, branches **97.93% (285/291)**,
  functions **100% (51/51)**, lines **98.38% (304/309)**. CompilerMetadataRecorder now has
  **36/36 statements, 32/32 branches, 3/3 functions, 32/32 lines (all 100%)**.
  CompilerMetadataBridge remains **19/25 statements (76%), 9/15 branches (60%), 3/3 functions (100%),
  17/22 lines (77.27%)**: native activation exceptions pass behaviorally but do not contribute mapped counters.
  Both discovery files and every other included production file remain all-metric 100%.
  Supported session-local Node 24.21.0 / pnpm 11.9.0, nine forced Turbo build/type/lint/format/fixture gates,
  and independent generated-root contracts passed. Experiment/corrected native results, coverage snapshot,
  exact metrics and gate logs remain under L `tests/artifacts/t016/attempt2/`.
  No full mapped acceptance, CI/Snyk, commit, publication, merge or archive claim.
- Evidence: Attempt 3 / W-012-R / 15.4 on 2026-10-04 used one fresh bounded worker without recursive
  delegation, as sole Tasks writer. Before implementation/checks, changed the existing serial recovery row to
  exactly one active worker with the user-specified allowed paths; verified T-013 recovery/T-015 prerequisites
  and the approved unchanged API/frozen class-backed discovery facade. No source, root exports, dependencies,
  manifests, Vitest configuration, global runtime or Git state changed. Authored only FreshCompilerRealm.ts,
  ImportCompatibility.test.ts and this file; generated evidence is under L tests/artifacts/t016/attempt3.
  Invoked implementation-test-first and document-tasks. This is behavior-preserving collection/test support:
  no new production behavior/type contract or artificial red is claimed; original T-015 meaningful red is retained.
  Exact root cause: pinned browser V8 collection filters scripts to the Vitest page origin, so native iframe
  scripts from the separate loopback server are behaviorally exercised but excluded from that collection.
  Auto-attached native dist and module-runner/source transforms additionally have different generated function
  ranges; attempt 2's include-dist experiment cannot safely merge those identities merely by source filename.
  Kept every original native Node/process and Chromium/built-ESM assertion. Added complementary fresh iframe
  imports of only the public source root, served from the existing Vitest/Vite origin with its exact transform/map.
  Node's complementary cases still use native built ESM, explicitly documented in the helper. Ten additional
  public-boundary cases per runtime cover occupied/accessor descriptors, undefined/null/throwing Reflect,
  uninstallable/locked slots, preserved safe causes, successful repeat identity and unrelated Reflect operations.
  No internals, private hooks, module mocks, reset API, synthetic instrumentation or test-owned replacement bridge.
  The iframe retains the existing bounded message/timeout/finally cleanup, and the native owner awaits children.
  Initial experiment accidentally nested suite registration in a test; its 402 passes/eight setup failures are
  observed during the initial run and are not behavior red. Corrected registration; first successful complement ran
  424/424 with all-metric 100%. Expanded cause/success assertions then ran **430/430**, zero failures/skips.
  Initial raw-file observer raced Vitest's coverage directory recreation; that observer failed, while its native
  owner completed 430/430 and cleaned up. A race-safe diagnostic observer then independently reran the complete
  suite and retained **22 untouched raw V8 JSON files**, named by their SHA-256 hashes, without modifying counters.
  Genuine Chromium bridge `activate` ranges are identical in ordinary and complementary source realms:
  **[428,1294]**. The complementary raw entry records **10** activations, **[513,602] count 2**
  (Reflect access catch), **[670,734] count 2** (unavailable guard), and **[1205,1291] count 2**
  (installation failure translation). Existing pinned URL/range merging and source maps produce the original
  three bridge function identities, not duplicate emitted/transformed functions. Overall cardinality remains
  exactly **51** functions. Function maps match attempt 2; actual statements/branches, not fabricated denominators,
  close the six missing statement/branch and five line counters. Raw/source identity audit is retained.
  A diagnostic CLI exclusion failed to remove the Chromium project suite (408 passes; still 100%); it is
  retained as an ineffective control, not asserted to prove missing-branch sensitivity. A proper Node-only
  control ran all **215/215** Node cases with zero skips, then correctly exited **1** at the unchanged bridge
  **19/25 statements, 9/15 branches, 3/3 functions, 17/22 lines**. Thus native behavioral passes alone do
  not manufacture mapped source counters. Normal full Node/Chromium execution was renewed afterward.
  Supported session-local **Node 24.21.0 / pnpm 11.9.0**: forced build/type/lint/format/fixture Turbo
  gates **9/9**, independent generated-root type contracts, explicit fresh root
  `pnpm exec turbo run test --force` **6/6** (zero cached), and `pnpm check` **12/12** passed.
  The check reused seven non-test task results; library preparation and actual native coverage tests still ran.
  Final complete suite is **430/430** (215 each runtime), zero failures/skips. Actual unchanged mapped V8:
  overall **364/364 statements, 291/291 branches, 51/51 functions, 309/309 lines (all 100%)**;
  bridge **25/25, 15/15, 3/3, 22/22**; recorder **36/36, 32/32, 3/3, 32/32**.
  All 17 executable production files meet all four 100% metrics; 35 erased-type files contribute no runtime
  counters and remain independently type-checked. All-production include, discovery and thresholds are unchanged.
  Protected-baseline audit preserved the 472 hashes outside the four permitted historical/current compiler-test
  changes (three were already changed by attempt 2; FreshCompilerRealm is this attempt's authorized addition).
  Both adapters and configuration retain their original hashes. Final task/DAG/sequence/link and style checks
  are recorded under attempt3; no final acceptance, CI/Snyk, commit, push, merge or archival permission inferred.
- Historical attempt 2 blocker: Attempt 2 did not complete native/source V8 combination for CompilerMetadataBridge.
  A fresh bounded T-016 recovery must validate original emitted-source offsets/maps and capture native Chromium
  server scripts before merging actual counters into the unchanged 100% gate. Duplicate/uncovered function
  identities cannot be repaired by invented counts. T-017 attempt 2 is **not dispatch-ready**.
  Earlier readiness remains historical: T-013 attempt 3 was done before this attempt.
  Attempt 1 remains historical scoped green, and T-017 subsequently demonstrated standard native-runner
  integration. T-019 reopened this ID for fresh compiler/import mapped-coverage recovery: retain fresh native
  failure realms, capture/remap their coverage or add equivalent valid public-boundary observations, and cover
  throwing Reflect access, unavailable/foreign/uninstallable descriptors, sparse/invalid entries and error paths.
  Preserve atomicity, causes, global activation and all previously passing contracts; no reset/coexistence hook,
  executable exclusion, broad suppression or implementation-private test is authorized.
- T-022 review finding F-022-001 reopens this stable ID for attempt 4, without erasing attempt 3's genuine
  successes. CompilerMetadataRecorder's catch converts consumer-thrown MetadataBoundaryError instances carrying
  invalid-decorator-target/location into expected rejections, losing the exceptional cause. See
  [T-022 attempt 1](#t-022---review-all-adrs-contracts-and-assertion-quality) for reproduced evidence.
  Fresh fix scope: only L src/infrastructure/adapters/inbound/CompilerMetadataRecorder.adapter.ts and
  tests/scenarios/CompilerMetadataContract.test.ts, S, and necessary generated build/native/coverage outputs.
  First extend the public-root consumer-thrown-error case to both colliding codes and observe meaningful
  cause-preservation assertion red in Node/Chromium; then distinguish normalizer-owned expected rejection from
  consumer inspection exceptions without widening public contracts. Preserve validation codes, safe messages,
  atomic old declarations, existing native realms, source maps and unchanged coverage/discovery thresholds.
  No dependency, export, configuration, facade, other source/test or companion-document change is authorized by
  this repair scope. If those two files cannot resolve it, report a narrower proposed scope before expanding.
- Evidence (attempt 4 / W-018-F / 18.1, 2026-10-04): One fresh bounded worker, no recursive delegation, sole
  Tasks writer; implementation-test-first and document-tasks invoked. Continued the approved in-flight story
  branch and existing complete API/failure-contract approval; no new design, dependency or Git authorization.
  F-022-001 is corrected in the owned recorder and CompilerMetadataContract suite only. Compiler-only address
  normalization now returns expected target/location rejections directly, using canonical domain target inspection
  and ordinary atomic set outcomes. There is no catch classifying consumer exceptions by class/code; exceptional
  inspection failures escape unchanged to the existing bridge's safe target-error wrapper with the exact cause.
  Class/member shape, numeric member conversion, invalid individual-parameter locations and validation priority
  remain unchanged. No shared normalizer, root export, API/type signature, bridge, config, manifest or doc changed.
  - Meaningful public-root red before implementation: initial collision selector yielded **4 failures / 2 passes**
    in Node/Chromium (106 unselected cases); both codes lost cause and location was misclassified. An expanded
    diagnostic accidentally nested added tests and yielded six failures; this was corrected before implementation,
    not counted as valid test-first evidence. Corrected independent extended red yielded **8 intended failures /
    6 passes**, 106 unselected: consumer descriptor/prototype collisions fail; value-getter controls preserve cause.
    Retained red.log/red-results.json, red-extended.log, red-corrected.log/red-corrected-results.json.
  - Focused green: **14 passes**, 106 unselected, after the minimal recorder correction. Assertions cover exact
    consumer error identity, wrapper code, private-message exclusion and unchanged old declarations; prototype,
    repeated canonical-owner inspection, parameter snapshot getters and noninvoked getter/construct traps are checked.
    Added ordinary cause-less validation/atomicity controls for null/string/nonconstructable targets, wrong arity,
    individual parameters, primitive/null descriptors and numeric-member success.
  - Commands use existing session-local Node **v24.21.0 / pnpm 11.9.0**, unchanged approved Vitest/V8/browser
    **5.0.3**, Playwright **1.63.0**, Chromium only. Focused red/green:
    `pnpm --filter @glacier/reflection exec vitest run tests/scenarios/CompilerMetadataContract.test.ts
-t 'consumer-thrown|retains .* identity|snapshot getters' --outputFile=tests/artifacts/t016/attempt4/<report>.json`.
    No dependency installation or global runtime change.
  - `pnpm --filter @glacier/reflection run test:prepare` passed; complete normal native runner initially passed
    **568 tests**, with an honest **98.69% branch** coverage failure from newly explicit normalization conditions.
    Public validation controls restored every branch; no exclusion, ignore, fake counter or weakened threshold.
    `pnpm --filter @glacier/reflection exec node tests/data/CompilerContractRun.ts --coverage
--outputFile=tests/artifacts/t016/attempt4/final-results.json` passed **570/570**, 24 suite results,
    **285 per Node/Chromium**, zero failed/pending/skipped/todo. Genuine emitted/native import, distribution,
    all old custom contracts, and source public compiler regressions ran.
  - `pnpm exec turbo run test --force` passed **6/6 tasks, zero cached**, **570/570** cases and 100% mapped V8.
    An initial read-only raw observer raced removal of the previous coverage directory; its runner independently
    passed 6/6. A race-safe observer renewed the same command successfully and retained **23 authentic raw V8
    reports**, including separately identified source/generated Node and source/generated Chromium script identities.
    Retained force-test.log, force-audited.log, force-exit.json, force-results.json, force-coverage-final.json,
    raw-v8 and exact compiler URLs/function ranges in summary.json. No generated/source function-map substitution.
  - Coverage is **100% overall and per production file**: statements **375/375**, branches **307/307**,
    functions **52/52**, lines **318/318**; 17 runtime-production files and 35 empty erased/support files retain
    honest inclusion. Original mapped coverage config is unchanged. Runtime numbers do not claim type coverage.
  - `pnpm exec turbo run build type-check lint format-check build:root type-check:root lint:root
format-check:root --force` passed **8/8**; then `pnpm exec turbo run lint:root format-check:root
type-check:root build:root catalog-check:root tooling-check:root lint format-check type-check build --force`
    passed **10/10**, zero cached, including independent contracts/examples, **34** catalog rejection controls,
    frozen-install/Turbo/compiler/actual-hook workspace fixtures. Empty application catalog reports not-run,
    not product acceptance. Direct generated public-root probes passed exact causes/safe codes/old Boolean for
    both collision codes and foreign-handler control (cause-reproduction.json).
  - HEAD remains `98ebe5b271a2af89345d7b7f35729e28ca947640`, feature/glacier-reflection. Baseline captures
    **487 authored hashes**; all **484 protected nonowned files** and Git index are unchanged. The two code/test
    hashes plus Tasks revision are in validation.json; summary.json retains checked implementation hashes.
    No staging, commit, fetch, push, publication, archival or merge occurred. ADR-0001/0002 boundaries and
    approved tooling conform; ADR-0003 cause preservation and ADR-0005 missing assertions are repaired,
    ADR-0004 is inapplicable; ADR-0006/0007/0008 remain scoped serial/library-only with separate gates intact.
    This scoped fix/check evidence does not replace fresh T-019, T-021 or formal T-022 review.
    Evidence directory: L `tests/artifacts/t016/attempt4/`, including baseline.json, summary.json and validation.json.
- Blocker: None for T-016 attempt4. F-022-001 implementation/assertion correction is complete; T-019 attempt3
  is ready to renew the evidence join. T-021 attempt2 and T-022 attempt2 must follow; final review/closure and
  all separately authorized Git/archival/human gates remain unmet.

### T-017 - Verify built-package Node and browser distribution contracts

- Status: done
- Source: [P-007](Plan.md#implementation-steps); AC-001, AC-020, AC-023, AC-026.
- Dependencies: T-016.
- Completion condition: Independent Node 24/Chromium consumers use generated root ESM/declarations with no runtime
  dependencies or DI. DistributionContract checks root resolution, deep/subpath rejection, side-effect retention,
  runtime import ordering, type-only import inactivity and declaration inference/brands. Any newly required public
  correction first has an intended failing contract; passing development checks include built artifacts, not just
  transformed source. Chromium results do not claim Firefox/WebKit compatibility.
- Evidence: Attempt 1 / W-013 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer; status progressed pending → in_progress → done. Invoked implementation-test-first and
  document-tasks; read AGENTS/Home, full Brief/Plan/Tasks, all eight accepted active ADRs, task template and
  applicable architecture/techstack/dependency/library guidance. Verified T-016's retained summary and its
  358 native Node/Chromium passes, including 236 preceding custom passes. Adopted the approved in-flight story,
  preserving prior dirty work and supplied revision `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  No Git mutation, dependency installation, root/Turbo/CI configuration write, source/root-export change,
  companion-document edit, archival or global runtime change. Every supported command activated existing
  `node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin` through session-local PATH;
  Node v24.21.0 / pnpm 11.9.0 and the four approved dependency pins remain unchanged.
  Added [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts),
  [DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts)
  and independent test-owned consumer/preparation fixtures. Preparation copies only the generated dist tree and
  package manifest into an isolated consumer's `node_modules/@glacier/reflection`; no workspace symlink, DI package,
  runtime dependency, source import, module mock or private hook. A fresh native Node `import.meta.resolve`
  matches exactly the copied manifest's root ESM entry. Independent strict NodeNext compilation consumes copied
  generated declarations, not source declarations. Chromium uses a root-only exact import map derived from that
  manifest entry and native loopback ESM delivery. Browser rejection concerns bare package subpaths; browsers
  do not enforce npm export maps on arbitrary HTTP URLs. Both runtimes verify all eight runtime exports,
  repeated-module identity, genuine emitted String/Number/Boolean representations for all three design keys,
  runtime-import-before-decorators, type-only import inactivity, and foreign-handler rejection/preservation.
  Four bare deep/subpath attempts reject with ERR_PACKAGE_PATH_NOT_EXPORTED in Node and TypeError in Chromium.
  A real ES2023 bundle built with the already-installed transitive Vite 8.3.2 retains activation from a
  side-effect-only root import, with no used runtime package export or opt-in. No direct bundler dependency added.
  Generated-declaration inference, readonly records, finite positions, NoInfer, distinct private brands and
  invariance pass independently. Removing eight expected-error directives in generated diagnostic copies produces
  exactly eight intended misuse diagnostics; adding one directive to an accepted write produces exactly one
  TS2578. These are unchanged-type verification/sensitivity controls, not post-bootstrap production type-red.
  No runtime API or public signature correction was needed, so no artificial API red or renewed bootstrap claimed.
  BEFORE the package script correction, standard
  `pnpm exec turbo run test --filter=@glacier/reflection --force -- --coverage.enabled=false
--outputFile=tests/artifacts/t017/attempt1/integration-before.json` exited 1: 302 passes/56 missing-native-server
  failures, zero skips. This demonstrates the real integration gap, not intended public-behavior red.
  Corrected only package scripts: test:prepare appends independent consumer preparation; test invokes the existing
  bounded CompilerContractRun owner with --coverage. Public scenario discovery, prerequisites, server readiness,
  finally cleanup, coverage thresholds and error propagation remain intact. Existing Turbo's uncached prepare/test
  graph and CI's pnpm check already route through these scripts, so no protected root/config write is required.
  Initial fixture validation caught a foreign-function comparison type error; fixed test-owned descriptor
  observation. An intermediate runtime run had 366 passes/two failures because an inferred field genuinely emits
  Object, not String; explicitly declared the intended string fixture type without weakening the assertion.
  Standard Turbo then passed all six prerequisite/runtime tasks and 368/368 assertions (184 per runtime),
  zero failures/skips. As an independent sensitivity control, changed ONLY the ignored copied manifest to
  sideEffects:false, rebuilt the bundle and used the native owner to select the retention assertion: both runtimes
  failed with intended AssertionErrors (installed and validCompilerCallback false instead of true).
  Eight unselected cases are recorded as filtered/skipped in that diagnostic-only control, not acceptance evidence.
  Normal preparation restored the pristine copy; no authored sideEffects flag was weakened.
  After the fixture-only single-primary-export refactor,
  `pnpm exec turbo run build type-check lint format-check test:prepare --filter=@glacier/reflection --force`
  passed all nine tasks. Required native invocation
  `node packages/libraries/glacier-reflection/tests/data/CompilerContractRun.ts --coverage.enabled=false
--outputFile=tests/artifacts/t017/attempt1/native-final-results.json` passed 368/368 with zero skips,
  including all 358 preceding compiler/custom contracts. Independent public types pass separately.
  Final NORMAL coverage-enabled `pnpm exec turbo run test --filter=@glacier/reflection --force --
--outputFile=tests/artifacts/t017/attempt1/final-coverage-results.json` executes native server delivery and all
  368 passing assertions without setup failures, then correctly exits 1 at unchanged 100% per-file thresholds:
  statements 95.34%, branches 91.46%, functions 98.07%, lines 96.11%. Native-only paths remain unmapped source
  coverage; Discovery/Storage/Target and compiler/decorator coverage gaps remain visible. No threshold,
  ignore/exclusion, skip masking, extra export or private hook was added. AC-026/final acceptance remains T-021.
  Commands/logs, copied consumer, bundle, root-resolution evidence, diagnostics, red/green JSON, screenshots,
  coverage snapshot, hashes and summary are retained under ignored L tests/artifacts/t017/attempt1.
  Automatically generated DistributionContract failure screenshots were moved from .vitest into these owned
  artifacts; unrelated screenshots/work remain untouched. Existing transitive Vite warning is unsuppressed.
  Final supported Turbo style checks and stable task/dependency/wave/link validation passed.
  ADR-0001/0005 conform through unchanged pins/runtime, Chromium-only public-root/native assertions and independent
  types; ADR-0002/0003 through unchanged curated production API, generated distribution consumption, class-first
  support, strict contracts and Turbo gates. ADR-0004/0007 remain inapplicable per T-005. ADR-0006/0008 conform
  through approved bounded single-writer scope, honest integration/sensitivity failures and serialized evidence.
- Historical blocker: T-016 attempt 2 remained blocked on actual native/source bridge coverage.
  Attempt 1 remains historical scoped distribution green, not failed distribution behavior.
  T-019 reopened this ID to aggregate recovery: add explicit named checks for all 35 erased root exports and
  the missing class/constant operation cells identified below, independently verify generated declarations,
  then rerun normal uncached Node/Chromium tests with combined mapped 100% overall/per-file coverage.
- Evidence (attempt 2 / W-013-R / 15.5, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer. Invoked implementation-test-first and document-tasks; verified the approved complete
  AC-001 through AC-027 baseline, facade revision, current serialized scope and T-016 attempt 3 prerequisite.
  Preserved feature/glacier-reflection and HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  Used existing session-local Node v24.21.0 / pnpm 11.9.0 and unchanged Vitest/V8/browser 5.0.3,
  Playwright 1.63.0 / Chromium-only configuration. No installation, production, configuration, index,
  manifest, root-tooling, dependency, companion-document or Git mutation.
  Added direct named equality, accepted assignment and rejected-misuse checks for the 13 formerly indirect
  erased contracts in
  [DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts):
  IMetadataBoundaryErrorCode, IConstructableClass, IMetadataKind, IMetadataSide, IMetadataLookup,
  IMetadataClassAddress, IInstanceMemberMetadataAddress, IInstanceMethodParameterMetadataAddress,
  IStaticMemberMetadataAddress, IStaticMethodParameterMetadataAddress, IDynamicInstanceMetadataAddress,
  IMetadataAddressRejectionCode and IMetadataAddressRejection. Finite keys/tuples, prototype exclusion,
  dynamic instance side restriction, readonly options/discrimination, error unions and no rejected-read value
  have explicit checks. Existing independent retrieval-type/variance/readonly facade guards remain intact.
  The fixture uses a compile-only equality class, not a runtime runner or new consumer dependency.
  Initial diagnostic gates exposed an incorrectly placed fixture block, missing expected-error placement on
  multiline property diagnostics, and importing Vitest into the deliberately ES2023-only independent fixture.
  Corrected only test-owned fixtures; final nine forced Turbo prerequisites pass. These setup/type-fixture
  repairs are not production behavior red. No changed API behavior or signature required artificial red;
  the first-declaration bootstrap exception was not reused.
  Added
  [PublicOperationMatrix](../../../packages/libraries/glacier-reflection/tests/scenarios/PublicOperationMatrix.test.ts):
  six definition objects × ten individually named inherited operation cells, plus three public-export
  identity/error/frozen-facade cases, **63 cases per runtime**. Fresh class targets isolate every case.
  Every set/setDynamic/read/readDynamic/has/hasDynamic/delete/deleteDynamic/locations/decorator cell
  verifies meaningful accepted results and applicable target/location rejection, own/inherited boundaries,
  mutation atomicity and/or absence/deletion boundaries. Lists assert exact ancestor-first concatenation;
  records assert whole conflicting-entry replacement; value definitions and all three predefined constants
  assert ordinary direct value identity. The parameter constant includes empty whole-array replacement.
  Discovery returns the exact definition object after operations/deletion, never a name-based substitute.
  Class constructors/name/kind, error code/safe message/cause and both detached frozen facade operations
  have explicit assertions. Existing compiler suites still establish genuine emission, validation and native
  installation failure behavior; custom direct annotations are not described as compiler emission or general
  JavaScript value validation. No private inspection, mocks, deep imports, test hooks or extra root exports.
  Changed only distribution preparation/delivery artifact references to the owned attempt2 consumer;
  preserved historical attempt1 outputs. A copied generated package, root-only manifest resolution, strict
  independent declarations and real transitive Vite bundle were freshly prepared. Native Node/Chromium
  DistributionContract's five cases remain unchanged and pass: exact eight-export root/emission/import order,
  type-only inactivity, side-effect retention, foreign-handler preservation and all four subpath rejections.
  Browser rejection is bare-specifier/import-map enforcement, not npm export-map enforcement of arbitrary URLs.
  Existing [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts),
  [AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts),
  [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts),
  [DecoratorTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DecoratorTypes.test-d.ts)
  plus renewed DistributionTypes directly account for **all 35 erased root exports**.
  Independently copied all five fixtures into the isolated consumer and compiled against copied generated
  declarations: exit 0. Test-runner-dependent existing fixtures use ES2023/DOM as their original contracts do;
  the distribution-only fixture separately passes with ES2023 and no test-runner imports.
  Diagnostic copies with every expected-error directive removed produce **124 intended diagnostics**;
  the distribution-only copy produces **27**. Adding a directive to its accepted error-code assignment
  produces exactly **one TS2578**. Normal authored/copied fixtures are restored/unchanged by controls.
  Named reference coordinates and accepted/rejected contracts persist in erased-type-inventory.json;
  erased declarations are independently checked, never claimed runtime-covered.
  Supported commands and results, under ignored L `tests/artifacts/t017/attempt2`:
  - `pnpm exec turbo run build type-check test:prepare lint format-check --filter=@glacier/reflection --force`:
    **9/9**, zero cached, after fixture corrections (gates-green.log).
  - `node packages/libraries/glacier-reflection/tests/data/CompilerContractRun.ts tests/scenarios/PublicOperationMatrix.test.ts tests/scenarios/DistributionContract.test.ts --coverage.enabled=false --outputFile=tests/artifacts/t017/attempt2/matrix-results.json`:
    **134/134**, zero skips, before the final extra constructor/constant identity case.
  - `pnpm exec turbo run test --force -- --outputFile=tests/artifacts/t017/attempt2/full-results.json`,
    independently renewed as `audited-results.json`: **6/6 uncached tasks; 556/556 cases**, 278 in each
    actual Node/Chromium project, zero failures/pending/skips. All preceding 430 cases remain present;
    126 additional matrix cases are named in operation-matrix.json.
  - `pnpm --filter @glacier/reflection run type-check:contracts`: exit 0 (independent-types.log).
    Independent copied-consumer `pnpm --filter @glacier/reflection exec tsc --project <consumer/all-contracts/tsconfig.json>`:
    exit 0 (all-independent-types.log); unsuppressed and unused-guard controls exit 1 as above.
  - `pnpm check`: **12/12** tasks, three cached non-test tasks; native preparation/test actually execute
    (full-check.log). This does not replace separately uncached test evidence or remote CI/Snyk.
    Fresh unchanged mapped V8 is **364/364 statements, 291/291 branches, 51/51 functions,
    309/309 lines**, all **100% overall and per executable production file**. All included files have
    covered counters; erased-type files have no executable counters. Every function map equals T-016 attempt3,
    including the bridge's original three identities. No fabricated counts, averaging, denominator changes,
    collection exclusion, ignore, threshold reduction or config change.
    The first raw observer raced coverage directory recreation; the native owner nevertheless completed 556/556
    and cleaned up. Retained its 12 partial diagnostic files separately, then reran with race-safe observation:
    **23 untouched fresh raw V8 files** are retained by content hashes. This is the unchanged source-origin
    collection strategy from T-016's 22-report baseline, with an additional matrix suite; capture is evidence
    of genuine counters, not an assertion that every raw file was intercepted. The complementary source Chromium
    bridge retains activate **[428,1294] count 10**, catch **[513,602] count 2**,
    unavailable **[670,734] count 2**, installation translation **[1205,1291] count 2**.
    Ordinary Chromium uses the identical activate range. Native generated ESM failure realms remain present,
    without merging different emitted/source function identities. coverage-audit.json, raw-bridge-identity.json,
    retained coverage-final.json and actual raw reports establish cardinality/counter evidence.
    Final forced build/type/lint/format gates pass **8/8**, zero cached; git diff --check passes.
    Validated **150 authored baseline hashes** (excluding five ignored Turbo logs), with only the four permitted
    existing test/helper files and Tasks changed; the new matrix is separately in the allowed scope.
    Validated 29 stable tasks, an acyclic DAG, 12 uniquely ordered remaining waves and 144 relative links/anchors.
    All **121 expected-misuse source locations** have actual independently unsuppressed diagnostics;
    the 124 diagnostics reflect multiple errors at some locations, not missing setup or symbol failures.
    protected-audit.json, task-validation.json and type-sensitivity-summary.json retain these exact checks.
    ADR-0001/0002/0003/0005 conform for this bounded slice through unchanged approved tooling/public API,
    root-only independent contracts, named meaningful assertions, strict types and supported Turbo gates.
    ADR-0004/0007 remain library-only/non-React inapplicable. ADR-0006/0008 conform through approved fresh bounded
    sole-writer execution, preserved historical failure evidence, unchanged signatures and serialized waves.
- Blocker: None for bounded T-017 attempt2. T-018 attempt2 / W-014-R is dispatch-ready for renewed facade
  README/JSDoc/examples and 28 native checks per runtime. T-019 still awaits that renewal; T-020/T-021
  current-main/final verification, remote CI/Snyk and separate human/Git gates are not satisfied here.

### T-018 - Complete executable usage examples and lasting documentation

- Status: done
- Source: [P-007](Plan.md#implementation-steps); AC-001, AC-012, AC-017, AC-024, AC-025, AC-027.
- Dependencies: T-017.
- Completion condition: Check and execute public-root examples showing emitted constructor representations plus
  explicit symbol identity for an interface dependency, without a DI resolver/token abstraction/registry.
  Complete README and contract JSDoc; update affected Engineering/Architecture/CI guidance for commands, runtime
  bounds, import effects/order, foreign-handler recovery, instance aliases, checked/dynamic limits, shallow ownership,
  position-only inheritance and erased interfaces/generics/parameter names. Examples supplement tests, not replace them.
  Any behavior change returns to its red gate and any material design change to plan approval.
- Evidence: Attempt 1 / W-014 on 2026-10-04 used one fresh bounded worker with no recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, full Brief/Plan/Tasks, accepted active ADR-0001 through ADR-0008,
  task template and relevant architecture/dependency/library/engineering/CI guidance. Invoked document-tasks,
  implementation-branching for approved in-flight adoption, and review-adr-conformance.
  Verified T-017 done and its retained distribution/preparation/runtime evidence; preserved all preceding dirty work
  on feature/glacier-reflection at unchanged supplied HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`.
  No fetch, stage, commit, push, archive, branch/ref/index mutation, dependency restoration, global-runtime change,
  public implementation/signature, runtime-suite/configuration/manifest, Brief or Plan edit.
  Completed [package README](../../../packages/libraries/glacier-reflection/README.md), contract-only JSDoc in
  ten existing domain files (shared public operations, three definition classes, discovery, error, all three compiler
  constants and ambient compiler protocol), and all five authorized lasting architecture/dependency/engineering/CI notes.
  Documented ordinary value compiler definitions, list/record meaning, direct replacement/deletion and own mode,
  dynamic versus checked guarantees, canonical instance aliases, shallow identity/ownership, position-only inheritance,
  erased interfaces/generics/parameter names, runtime import effects/order, foreign-handler fresh-realm recovery,
  package scripts and configured-but-unobserved CI. Removed stale guidance claiming no library/tests exist.
  Added [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts),
  [AdoptionTypes](../../../packages/libraries/glacier-reflection/tests/data/examples/AdoptionTypes.ts) and
  [native example owner](../../../packages/libraries/glacier-reflection/tests/data/AdoptionExampleRun.ts).
  The fixture imports only generated @glacier/reflection root exports; genuine legacy emission supplies constructor
  Object, member Function and return String representations. Explicit Symbol identity annotates an interface dependency
  without resolver, token class, registry or consumer construction. It checks inference, undefined/absence, own/inherited
  lookup, lists/records/outer snapshots/contained identity, discovery/dynamic round trips, shadowed constructor avoidance,
  deletion and changed-constructor position-only inheritance. Examples supplement, not replace, existing contract suites.
  Every supported command activated existing
  `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 / pnpm 11.9.0, with unchanged approved dependency pins.
  `pnpm exec turbo run build type-check lint format-check test:prepare --filter=@glacier/reflection --force`
  passed all nine tasks, including genuine fixture emission and independent generated declaration/distribution preparation.
  `node packages/libraries/glacier-reflection/tests/data/AdoptionExampleRun.ts` passed 28 explicit checks in native
  Node and 28 in fresh native Chromium 153.0.8010.12, using generated ESM and root import-map delivery, real loopback
  readiness, awaited browser/server finally cleanup and observable failures. No Firefox/WebKit was configured or run.
  `pnpm --filter @glacier/reflection run type-check:contracts` independently passed all public contracts and documentation
  examples, including two rejected-misuse guards. No changed public behavior/types required meaningful red;
  no artificial failure or new bootstrap exception is claimed for documentation and supplementary examples.
  `node packages/libraries/glacier-reflection/tests/data/CompilerContractRun.ts --coverage.enabled=false
--outputFile=tests/artifacts/t018/attempt1/runtime-results.json` passed all 368 assertions across 20 suites
  (184 each Node/Chromium), zero failures/pending/skips. This is regression execution, not V8 coverage.
  T-017's unchanged 100% gate failure (95.34% statements, 91.46% branches, 98.07% functions, 96.11% lines)
  remains visible; no final coverage/acceptance, remote Actions/Snyk or current-main freshness claim.
  Retained exact logs/results and example counts under ignored L tests/artifacts/t018/attempt1.
  Final supported formatting/Turbo checks and task DAG/wave/link/whitespace verification passed.
  The initial documentation validator's greedy title regex consumed later records; corrected only that validator.
  The final check verified 29 stable tasks, an acyclic graph, all 11 remaining waves exactly once, earlier
  prerequisites/worker counts, T-019 readiness, 150 relative links/anchors, and genuine import-before-emission
  for all three compiler keys. Read-only working-note diff review and git diff --check passed.
  ADR-0001/0002 conform through unchanged approved pins, dependency-free curated generated root, no aliases/subpaths;
  ADR-0003 through class-first strict typed support, contract JSDoc and supported Turbo lint/format/build/type checks.
  ADR-0004 is inapplicable (no React); ADR-0005 conforms for this bounded documentation/example task through real
  public-root supplementary checks and independent types, with failing final coverage explicitly unwaived.
  ADR-0006/0008 conform through approved in-flight bounded sole-writer scope, stable serial evidence and preserved
  authorization gates; ADR-0007 conforms through unchanged library-only catalog/application-E2E inapplicability.
- Evidence (attempt 2 / W-014-R / 15.6, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer. Invoked document-tasks, implementation-branching for approved in-flight adoption, and
  review-adr-conformance. Read AGENTS/Home, all eight accepted active ADRs, full Brief/Plan/Tasks, task template
  and the five lasting notes; verified T-017 attempt2 completion and the exact remaining wave scope.
  Preserved feature/glacier-reflection and all prior dirty work; no Git mutation, dependency restoration,
  global-runtime change, behavior/signature, suite, configuration, manifest, root dependency, Brief/Plan or
  lasting-note edit. Authored only README, JSDoc in MetadataDiscovery/MetadataDiscoveryOperations and Tasks.
  README now describes exactly eight runtime values: four classes, one frozen nonconstructible discovery
  facade and three ordinary compiler value-definition instances; 35 erased named exports are independently
  checked, not runtime-covered. Documented readonly detached operations, unchanged calls, typeof usage and
  no public construction/prototype/instance-class/subclassing API. Supporting interface/internal class are
  not root exports. Preserved methods, errors, brand/invariance, checked/dynamic/instance bounds, compiler
  ordinary-instance semantics and erasure limits. Existing checked examples require no authored change.
  Reviewed all five protected companions: none promises a discovery class or contradicts the facade;
  their generic gate/CI cautions do not claim a present failure. No broader companion authorization was needed.
  Supported commands used existing session-local Node v24.21.0 / pnpm 11.9.0 with unchanged approved pins:
  - `pnpm exec turbo run build type-check lint format-check --filter=@glacier/reflection --force`:
    **8/8**, zero cached (gates.log). No test:prepare was run: its fixed historical output paths are outside
    this wave's bounded artifact scope.
  - `pnpm --filter @glacier/reflection exec tsc --project tsconfig.fixtures.json
--outDir tests/artifacts/t018/attempt2/compiler`: exit 0 (emission.log); genuine emitted root import
    precedes all three design keys (emission-audit.json).
  - `node packages/libraries/glacier-reflection/tests/artifacts/t018/attempt2/ExampleRun.ts`:
    **28/28 Node and 28/28 Chromium 153.0.8010.12**, generated ESM/root import map and real loopback
    readiness (examples.json/examples.log). The generated invocation owner adapts only delivery/output paths
    to attempt2, preserving the authored example and historical attempt1 runner/results. Initial generated
    delivery lacked the existing owner's CORS header; browser module fetch failed before example execution.
    Restored that header, retained examples-initial-setup.log and reran successfully. This setup failure is
    neither behavior red nor a failing example assertion. Child/browser/server resources closed in finally.
  - `pnpm --filter @glacier/reflection run type-check:contracts`: exit 0 (independent-types.log).
    Fresh copied package/declarations plus all five copied fixtures compiled independently with
    `pnpm --filter @glacier/reflection exec tsc --project
tests/artifacts/t018/attempt2/consumer/contracts/tsconfig.json`: exit 0 (copied-independent-types.log).
    Copied AdoptionTypes and AdoptionExample independently compiled with
    `pnpm --filter @glacier/reflection exec tsc --project
tests/artifacts/t018/attempt2/consumer/tsconfig.examples.json`: exit 0 (copied-example-types.log).
    No runtime coverage claim or artificial red/bootstrap exception for unchanged types.
    All **58 generated JS files** match T-017's retained independent distribution after removing only JSDoc
    comments (executable-identity.json); no implementation token changed. T-017's retained **556/556** cases,
    zero skips and **364/364 statements, 291/291 branches, 51/51 functions, 309/309 lines**, all-file/overall
    **100%**, remain its actual run, not a freshly executed T-018 full suite. Its raw V8 and function identity
    audits remain untouched. Documentation-only edits do not claim fresh source-coordinate coverage.
    README removes the obsolete present failing-coverage assertion while distinguishing retained development
    results from final acceptance. No unnecessary full gate or out-of-scope native/coverage output was run.
    Fresh final supported Turbo style gates, protected hashes, stable task DAG/remaining-wave/link checks and
    whitespace validation are retained in
    [attempt2 summary](../../../packages/libraries/glacier-reflection/tests/artifacts/t018/attempt2/summary.json):
    **4/4 uncached style tasks**, **487 baseline authored hashes** checked with exactly the four permitted
    changed files, **29 stable tasks**, an acyclic DAG, **11 unique remaining serial waves** and **150 relative
    links/anchors** checked before adding this summary link. git diff --check passed.
    ADR-0001/0002 conform through unchanged approved tooling,
    root surface and package boundaries; ADR-0003 through contract-only JSDoc and supported Turbo gates.
    ADR-0004 is inapplicable (no React); ADR-0005 conforms for bounded supplementary examples/independent types,
    with retained coverage distinguished from fresh execution. ADR-0006/0008 conform through approved serial
    fresh sole-writer ownership and preserved history/gates; ADR-0007 remains library-only/catalog/E2E inapplicable.
- Blocker: None for T-018 attempt2. T-019 attempt2 is ready to independently rejoin current documentation,
  examples, all 35 type contracts, eight runtime values/operations and retained mapped/native evidence.
  T-020/current-main, final verification, CI/Snyk, human acceptance and separate Git/archival gates remain unmet.

### T-019 - Join distribution and adoption evidence

- Status: done
- Source: [P-007 and criterion mapping](Plan.md#validation); AC-001 through AC-027; ADR-0008.
- Dependencies: T-017, T-018, T-016.
- Completion condition: Account for every criterion, public runtime export/method/constant and erased type contract
  against observed tests/examples/review; hand off real relative test links and exact revision/results.
  Reconcile documentation with the tested API without redefining acceptance or treating percentages as assertion quality.
- Evidence: Attempt 1 / W-015 on 2026-10-04 used one fresh bounded worker without recursive delegation,
  as sole Tasks writer. Read AGENTS/Home, complete Brief/Plan/Tasks, all eight accepted active ADRs, task template,
  architecture/dependency/techstack/library guidance, authored root/types/runtime suites and retained T-017/T-018
  reports. Invoked document-tasks, review-adr-conformance and implementation-branching for approved in-flight adoption.
  Verified feature/glacier-reflection at HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`; this is an
  uncommitted working-tree evidence join, not current-main integration or an immutable release revision.
  Verified all non-Tasks authored hashes in T-018's summary still match. Captured protected authored hashes under
  ignored L `tests/artifacts/t019/attempt1/`; preserved all preceding dirty work.
  The [criterion](#t-019-criterion-accounting), [runtime](#t-019-public-runtime-inventory) and
  [type](#t-019-erased-type-inventory) inventories below account for every approved item, including gaps rather than
  marking all criteria satisfied. Retained T-018 reports establish 368 passing runtime cases, 184 per Node/Chromium,
  zero pending/skipped, and 28 supplementary native example checks per runtime; these are inspected prior runs,
  not freshly rerun runtime tests in T-019. Supported session-local Node v24.21.0 / pnpm 11.9.0
  `pnpm --filter @glacier/reflection run type-check:contracts` passed independently again; no runtime coverage
  claim for erased types. No install, implementation fix, source/test/config/Brief/Plan edit or Git mutation.
  Recorded exact existing coverage gaps and narrow fresh recovery scopes, reopened only affected stable IDs and
  renewed downstream evidence obligations without erasing attempt-1 successes or introducing cyclic dependencies.
  Final document formatting, protected-file preservation, link, inventory, task DAG and sequence checks are recorded
  in L `tests/artifacts/t019/attempt1/validation.json`. Final acceptance, complete workspace gates, CI/Snyk,
  current-main freshness and human acceptance are not observed by this task.
  Validation confirmed 29 stable task records, 17 unique remaining serial waves with exact worker/human-wait
  counts and earlier prerequisites, 137 valid relative links/anchors, 27 criterion rows, eight root runtime values,
  35 erased-type rows (22 named / 13 indirect-only), and 191 protected authored files unchanged.
  The initial sequence validator caught the blocked evidence-join ID mentioned in recovery prerequisites;
  changed that wording to retained coverage findings, not a dependency on T-019. The repaired graph/order passed.
  Supported changed-file Oxfmt write/check and git diff --check passed; these are documentation checks, not
  a rerun of the full workspace/runtime/coverage gate.
- Evidence (attempt 2 / W-015 / 15.7, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer; invoked document-tasks, review-adr-conformance and implementation-branching for the
  explicitly adopted in-flight branch. Read guidance, all eight accepted active ADRs, full Brief/Plan/Tasks,
  exact remaining sequence, attempt1 findings, recovery records, current public signatures/assertions and companions.
  Verified feature/glacier-reflection at unchanged HEAD `98ebe5b271a2af89345d7b7f35729e28ca947640`;
  the authored working tree, not that HEAD alone, identifies this uncommitted evidence revision.
  Reverified all 487 T-018 baseline hashes and exactly its four permitted final changes; independently captured
  196 non-Tasks authored-file hashes. No source/test/README/companion/configuration/manifest edit or Git mutation.
  The [current join](#t-019-attempt-2-current-evidence-join) accounts for all 27 criteria, eight runtime values,
  six definition objects × ten inherited operations, both discovery calls, error constructor and 35 erased types.
  Independently recomputed T-017's retained 556/556 passes (278 each Node/Chromium, zero skips), 60 named
  operation cells per runtime, all 52 current production inclusions and actual mapped counters:
  364/364 statements, 291/291 branches, 51/51 functions, 309/309 lines. Every relevant file meets 100%;
  both discovery files are included. All function maps match T-016 attempt3 and all 23 retained raw V8
  filenames match their content hashes. No counter fabrication, exclusion, weaker threshold or fresh runtime claim.
  All 58 current generated ESM files match the retained T-017 distribution after removing JSDoc only;
  declarations are byte-identical to T-018's copied consumer. T-018's 28 native example checks EACH runtime
  remain retained, not newly executed. Current signatures/docs/criteria agree with the approved frozen facade.
  Fresh supported Node v24.21.0 / pnpm 11.9.0 independently compiled copied generated-root declarations,
  all five copied contracts and copied examples under this attempt's artifacts: both checks exit 0.
  Fresh unsuppressed copies diagnose all 121 misuse locations with 124 intended diagnostics; an accepted
  assignment with an added expected-error guard yields exactly one TS2578. No missing-symbol/setup diagnostic
  or runtime coverage claim for erased types. An initial TypeScript scanner probe failed because installed
  TypeScript 7 exposes no legacy scanner API; complete ESM-text comparison excluding JSDoc succeeded instead.
  [Attempt2 validation](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/validation.json)
  retains protected hashes, graph/sequence/link validation and documentation formatting/whitespace results.
  Validation passed for 29 stable IDs, an acyclic DAG, ten unique remaining serial waves with exact human-wait
  counts/earlier prerequisites, 200 relative links/anchors, 196 protected authored hashes and all 487 T-018
  baseline hashes. Document-validator padding/self-link ordering corrections changed no requirement.
  This evidence join closes attempt1's AC-026 coverage/operation/type findings for P-007; it does not execute
  T-020/T-021/T-022, integrate main, establish remote CI/Snyk or replace human acceptance.
- T-022 renewal obligation: Attempt 2 remains genuine historical evidence, but its complete-contract readiness
  conclusion is superseded by F-022-001. After T-016 attempt 4, a fresh evidence-only attempt 3 must rejoin the
  corrected compiler causes, unchanged API/types/docs and actual regression/coverage results without claiming
  the old 556 passing cases proved the missing boundary. No distribution/example redesign is required.
- Evidence (attempt 3 / W-018-J / 18.2, 2026-10-04): One fresh bounded worker, no recursive delegation,
  sole Tasks writer; invoked document-tasks, review-adr-conformance and implementation-branching for approved
  in-flight adoption. Read AGENTS/Home, every accepted active ADR in full, full Brief/Plan/Tasks/template,
  exact renewal sequence, corrected recorder/bridge/public-root compiler assertions, operation matrix and
  lasting companions. The [attempt3 current join](#t-019-attempt-3-current-evidence-join) supersedes attempt2's
  readiness and exceptional-cause completeness conclusions, not its genuine historical observations.
  Independently audited retained T-016 attempt4 red/green and full results: 570/570, 285 per Node/Chromium,
  24 suites, zero skips; 60 operation cells per runtime; genuine included-file/overall 100% at 375 statements,
  307 branches, 52 functions and 318 lines; all 23 raw V8 content hashes verified. This task did not execute
  a runtime/full gate. Fresh isolated generated-root type contracts/examples and misuse sensitivity checks
  passed on session-local Node v24.21.0 / pnpm 11.9.0, with 121 misuse locations / 124 intended diagnostics
  and exactly one unused-guard TS2578. All 35 erased names and eight runtime values remain unchanged.
  Protected-file and distribution correspondence, exact compiler assertion links and ADR applicability are
  recorded below and in tests/artifacts/t019/attempt3. Only Tasks.md is authored; generated outputs are
  confined to that attempt directory. No implementation, companion edit, install, shared build/coverage rewrite,
  fetch, staging, commit, push, publication, archival, acceptance or merge occurred.
- Blocker: None for T-019 attempt3. T-021 attempt2 is dependency-ready after T-020's retained inclusion
  inspection and applicable verification authorization; verify readiness/current-main prerequisites again
  at dispatch, without treating that historical fetch as a new freshness claim. T-022 attempt2 follows
  renewed complete gates; closure still requires its own explicit scope authorization.

### T-020 - Integrate current main before final local verification

- Status: done
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 current-main integration.
- Dependencies: T-019.
- Completion condition: Freshly fetch `origin/main`, record refs and inclusion, and if needed merge it into this
  branch, never rebase. Resolve conflicts preserving contracts and identify the renewed-check revision.
  Obtain separate authorization before any integration commit; implementation permission does not grant Git writes.
- Evidence (attempt 1 / W-016, 2026-10-04): One fresh bounded worker, no recursive delegation, sole Tasks writer.
  Read guidance, all eight accepted active ADRs and complete Brief/Plan/Tasks, including T-019 attempt2 evidence
  and the approved frozen discovery facade. Invoked implementation-main-sync, document-tasks and
  implementation-branching for approved in-flight adoption. The user explicitly selected
  “Authorize fetch/inclusion inspection and final verification if already current (Recommended)”.
  This authorizes fetch/read-only inclusion inspection and subsequent T-021 if already current, not integration.
  Captured all 487 tracked/untracked nonignored authored-file SHA-256 hashes before fetching; combined sorted
  manifest digest was `6813ecd63fd8370f267fb8f82b21ea3e627e8e7e605129174dfe981e4df4bf0c`.
  Git index SHA-256 was `b7ba1f5ce222ad08bafcfbc8392b7648964f9dd3997836b6aec424e99f08b719`.
  Bounded `git fetch --no-auto-maintenance origin main` completed with exit 0.
  Both freshly fetched origin/main and FETCH_HEAD are `671366276cab9a29c5838c1c5f9406e12de95d1f`;
  origin/main did not advance. HEAD remains `98ebe5b271a2af89345d7b7f35729e28ca947640` on
  feature/glacier-reflection. `git merge-base --is-ancestor origin/main HEAD` exited 0;
  the merge base equals the fetched main SHA. Current main is already included: no merge or conflict resolution
  is needed, attempted or authorized. All 487 authored hashes, index, branch and HEAD remained identical after
  fetch. The working tree is deliberately not clean: 12 existing modified tracked paths and untracked packages/
  contain preceding approved work; none was stashed, reset, discarded, staged or otherwise altered.
  Only this evidence note is authored by this worker. Documentation formatting, whitespace, task DAG,
  remaining-wave and relative-link checks are performed for this update; no T-021 code/runtime gate runs here.
  ADR-0006 current-main prerequisite is satisfied by observed inclusion without a dirty-tree merge;
  ADR-0008 single-writer evidence and stable serial sequence are preserved. Other ADR requirements and all
  later authorization/acceptance gates remain unchanged.
- Blocker: None for T-020. T-021 is ready for a fresh bounded worker under the explicit conditional final-verification
  approval. Fresh local checks/manual review, archival, commits, publication, CI/Snyk and human acceptance remain
  outstanding. If a later fetch shows main not included, stop for separate integration authorization.

### T-021 - Run the complete local automated verification gate

- Status: done
- Source: [P-008 and validation](Plan.md#validation); AC-026; ADR-0001/ADR-0003/ADR-0005/ADR-0007.
- Dependencies: T-020, T-019.
- Completion condition: On Node 24.21.0/pnpm 11.9.0, run `pnpm check` and explicit fresh
  `pnpm exec turbo run test --force`. Lint, formatting, build, independent type contracts, real fixtures,
  root catalog/tooling regressions and complete Node/Chromium library runtime tests pass.
  Combined mapped V8 coverage is 100% statements/branches/functions/lines overall and per relevant production file,
  including unloaded supporting code; no executable exclusions/ignore annotations, skipped cases or retry-only passes.
  Retain exact revision, commands, results and reports.
- Evidence (attempt 1 / W-017, 2026-10-04): One fresh bounded worker, no recursive delegation, sole Tasks writer.
  Read AGENTS/Home, full Brief/Plan/Tasks and all eight accepted active ADRs; invoked implementation-verification,
  document-tasks and implementation-branching for explicitly approved in-flight adoption. T-019/T-020 are done;
  the user's conditional final-verification authorization applies because freshly fetched main is already included.
  HEAD remains `98ebe5b271a2af89345d7b7f35729e28ca947640`, branch feature/glacier-reflection;
  origin/main remains `671366276cab9a29c5838c1c5f9406e12de95d1f`, with read-only ancestor inspection exit 0.
  Captured 487 authored-file SHA-256 hashes before execution, including Tasks; the sorted JSON manifest digest is
  `bea493fd07434882abd867ba6e17b2f33ff43dd2717a8caf7aa88cff45e2af64`.
  All 486 non-Tasks authored files and the Git index remain unchanged; only Tasks evidence is authored here.
  Commands use `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`;
  observed Node v24.21.0 / pnpm 11.9.0, installed Vitest/V8/browser provider 5.0.3 and Playwright 1.63.0.
  No dependency installation, global runtime change, implementation/format fix, staging, commit, fetch,
  push, merge or archival operation occurred. Generated reports are under L tests/artifacts/t021/attempt1.
  - `pnpm check`: exit 0, **12/12 tasks**, six cached non-test tasks; uncached preparation and normal
    CompilerContractRun native Node/Chromium coverage execution genuinely ran (check.log/check-results.json).
    Catalog validation reports **0 criteria / 0 discovered specs, execution not-run**, not application acceptance.
    Root tooling actually passes **34 catalog rejection controls**, discovery/derived reporting and workspace
    frozen-install, Turbo positive/negative, strict-compiler and actual staged-hook disposable fixtures.
  - `pnpm exec turbo run test --force`: **6/6 tasks, zero cached**, complete normal native runner.
    A diagnostic raw observer initially raced removal of an old coverage HTML directory; that observer exited 1,
    while its runner finished 6/6 successfully. This is not an assertion/gate failure or intended behavior red.
    Retained force-test.log, then renewed the same complete command with a race-safe observer:
    **exit 0, 556/556 passes**, **278 per actual Node/Chromium project**, 24 suite results, no failures,
    pending/todo/skipped cases or retry-only passes (force-audited.log/force-results.json/force-exit.json).
  - `pnpm exec turbo run lint:root format-check:root type-check:root build:root catalog-check:root
tooling-check:root lint format-check type-check build --force`: exit 0, **10/10 tasks, zero cached**
    (forced-gates.log). Thus all lint/format/build/types/catalog/tooling gates are also freshly executed,
    including independent generated-root type contracts and examples, not just replayed check-cache output.
    Existing transitive Vite import-analysis warnings remain visible without authored suppression.
    Fresh mapped V8 audit includes exactly **52/52 production files**, including the facade, backing class and
    every supporting/unloaded inclusion: **17 executable files, 35 erased type modules**.
    Actual counters are **364/364 statements, 291/291 branches, 51/51 functions, 309/309 lines**:
    **100% overall and every executable production file**, unchanged all-production include/per-file thresholds.
    Facade initialization has one statement/line and no functions/branches; backing class has two genuine functions.
    Zero-counter erased files are independently type-checked, not claimed runtime-covered.
    Retained **23 untouched raw V8 JSON reports** by verified content SHA-256. Ordinary and complementary
    same-origin Chromium bridge activation uses identical **[428,1294]** ranges; the complement records ten
    activations and the genuine exceptional branch counters. Native generated-ESM failure realms remain present.
    No source-counter rewriting, averaging, duplicate function identity, executable exclusion/ignore or weaker gate.
    Preliminary manual checklist inspected curated eight-runtime/35-type exports, root-only manifest/no runtime
    dependencies and approved pins, inward relative domain/adapter imports, strict contracts/JSDoc, frozen class-backed
    facade, atomic compiler snapshots/rejections, intentional activation and instance/erasure/documentation bounds.
    Reviewed named matrix assertions for all 60 operation cells, native root-only resource ownership/cleanup and
    criterion-linked assertion evidence; percentages/catalog completeness are not asserted to prove quality.
    ADR-0001/0002/0003/0005 applicable local gates pass; ADR-0004 React and ADR-0007 application E2E/catalog additions
    are inapplicable to this library-only scope, while actual root catalog/tooling regression validation passes.
    ADR-0006/0008 process/permissions and sole-writer stable task evidence remain preserved.
    Formal fixed-revision all-ADR/assertion-quality review remains **T-022**, not completed by this checklist.
    [Verification summary](../../../packages/libraries/glacier-reflection/tests/artifacts/t021/attempt1/verification-summary.json)
    retains exact revision/hashes, fresh per-file metrics/results, raw identities and gate applicability.
    Final Tasks-only formatting, whitespace, protected hashes and task/DAG/remaining-wave/link checks are recorded
    in validation.json. Application Testcontainers/Playwright acceptance is not applicable, not executed/passed.
    Remote Actions/Snyk and human acceptance are unobserved; container-image scans remain inapplicable.
- Evidence (attempt 2 / W-018-V, 2026-10-04): One fresh bounded worker, no recursive delegation, sole Tasks
  authored writer; invoked implementation-verification, document-tasks and implementation-branching for the
  approved in-flight feature/glacier-reflection branch. T-019 attempt3 and T-020 are done; the user's conditional
  final-verification approval applies. Read-only inclusion inspection again returned exit 0 for fetched main
  `671366276cab9a29c5838c1c5f9406e12de95d1f` in unchanged HEAD
  `98ebe5b271a2af89345d7b7f35729e28ca947640`. No new fetch, merge, stage, commit, push, archive, dependency
  installation, implementation edit or other authored formatting occurred.
  The dirty implementation is identified by all **497 nonignored file hashes**, including preexisting generated
  screenshots; **496 non-Tasks files** and the Git index are unchanged. Sorted authored-manifest SHA-256 is
  `5e1a8a76057cb59ea2856faf054b1a9cb6b2c19a281040f55d9450dae79cd4b5`;
  index SHA-256 is `b7ba1f5ce222ad08bafcfbc8392b7648964f9dd3997836b6aec424e99f08b719`.
  Commands activated `export PATH="$PWD/node_modules/.session-runtime/node-v24.21.0-darwin-arm64/bin:$PATH"`.
  Actual Node **v24.21.0**, pnpm **11.9.0**, installed Vitest/V8/browser-provider **5.0.3** and Playwright
  **1.63.0** were observed; the pinned Chromium executable reports **153.0.8010.12**, revision directory
  chromium-1243. No Firefox/WebKit claim is made.
  - **Passed:** `pnpm check`, exit 0, **12/12 tasks**, seven cached non-test tasks in the final recorded
    invocation. Preparation and the normal native Node/Chromium CompilerContractRun coverage task genuinely
    execute: **570/570**, **285 per runtime**, **24 suite results** (Vitest reports 62 nested suite groups).
  - **Passed:** `pnpm exec turbo run test --force`, exit 0, **6/6 tasks, zero cached**; complete native
    Node/Chromium runtime discovery, fresh real compiler/distribution fixtures, build and independent type
    prerequisites execute. **570/570**, 24 suite results, zero failures/pending/todo/skips or retry-only passes.
    All **14 dual-runtime F-022-001 cause/prototype/snapshot regression executions** pass, retaining exact
    exceptional identity, boundary code, unchanged prior declarations and no getter/body invocation.
  - **Passed:** `pnpm exec turbo run lint:root format-check:root type-check:root build:root catalog-check:root
tooling-check:root lint format-check type-check build --force`, exit 0, **10/10 tasks, zero cached**.
    Thus root/package lint, formatting, strict source/test types, independent generated-root contracts and checked
    examples, builds, catalog and tooling regressions are freshly executed rather than inferred from cache replay.
    Root tooling passes **34 catalog rejection controls**, discovery/derived reports, and its real disposable
    frozen-install/Turbo/strict-compiler/Husky staged-hook fixtures; no story-checkout Git write occurs.
    Catalog reports **0 criteria / 0 specs, execution not-run**: this is empty-catalog regression validation,
    not application acceptance.
  - **Passed:** Genuine combined mapped V8 coverage has **52/52 production inclusions**, **17 executable files /
    35 erased modules**, and **375/375 statements, 307/307 branches, 52/52 functions, 318/318 lines**.
    Overall and every executable file, including the frozen facade and its backing behavior class, reach
    **100% in all four metrics**. Zero-counter erased modules remain independently type-checked, not claimed
    runtime-covered. All-production include and per-file thresholds are unchanged; no executable exclusion,
    ignore annotation, invented/rewritten counter, weaker gate or mapping-average substitution was introduced.
    Retained **24 untouched raw V8 JSON reports per final invocation**, attributed by observation time and
    verified content SHA-256. Ordinary/complementary same-origin bridge activation retains identical
    **[428,1294]** function identity; complementary count is **10**, with genuine exceptional ranges.
    Actual current count is 24, not a relabeling of earlier attempts' 23-report observations.
    T-008's genuine unmapped-built-root, unloaded-file and uncovered-path failures remain hash-audited
    historical controls; they were not rerun or silently recreated outside this Tasks-only authored scope.
  - The first complete executions also passed (12/12 check with six cached non-test tasks; 6/6 and 10/10 forced,
    570/570). The raw observer was refined only to attribute each invocation and exclude pre-run remnants,
    then the complete commands renewed successfully; no test failure, retry-only success or repository fix occurred.
    Existing transitive Vite import-analysis warnings remain visible without authored suppression.
    [Attempt2 verification summary](../../../packages/libraries/glacier-reflection/tests/artifacts/t021/attempt2/verification-summary.json)
    retains baseline, actual versions/commands, per-file metrics, named cause regressions, raw report identities and
    retained-control hashes. Final Tasks-only Oxfmt/Turbo formatting, whitespace, relative links, stable task DAG,
    remaining-wave ordering and protected/index checks are retained in attempt2 validation.json.
    Application/service Playwright/Testcontainers and React/Storybook gates are **not applicable** to library-only
    scope; Chromium library tests genuinely executed. Remote Actions/Snyk and human acceptance remain **unobserved**,
    not successful local gates. Formal all-ADR/public-contract/assertion-quality manual review remains **T-022
    attempt2**, separately dispatched; this worker stops after automated verification.
- T-022 renewal obligation: Attempt 1's passing commands, 556 assertions and genuine 100% counters remain
  valid observations for that fixed authored revision; they do not establish F-022-001's missing cause contract.
  Attempt2 now renews the complete corrected-revision gates with new hashes, inspected main inclusion and actual
  Node/Chromium coverage; T-022 must review this fixed revision rather than relabel attempt1 evidence as fresh.
- Blocker: None for T-021 attempt2; T-022 attempt2 is dependency-ready for separate fresh manual review.
  Closure authorization, commits, publication, CI/Snyk, human acceptance and merge remain separate unmet gates.

### T-022 - Review all ADRs, contracts and assertion quality

- Status: done
- Source: [P-008](Plan.md#implementation-steps); AC-016, AC-024, AC-026; ADR-0001 through ADR-0008.
- Dependencies: T-021.
- Completion condition: At the fixed checked revision manually review each active ADR, approved dependencies,
  inward/relative-import boundaries, curated root exports, strict typing/JSDoc, atomic errors, intentional activation,
  compiler/instance limits, assertions, coverage inclusion and changed links. Record conformance or specific justified
  inapplicability for each ADR. Corrections renew affected checks; AI review does not grant human acceptance.
- Evidence (attempt 1 / W-018, 2026-10-04): One fresh bounded read-only review worker, no recursive
  delegation, sole S evidence writer. Invoked review-adr-conformance, document-tasks and implementation-branching
  for explicitly approved in-flight adoption. Read AGENTS/Home, all eight accepted active ADRs, full
  Brief/Plan/Tasks, relevant package/dependency/engineering guidance, branch and dirty diff, every implemented
  production file, all runtime/type suites, emission/distribution/example fixtures and resource owners.
  HEAD remains 98ebe5b271a2af89345d7b7f35729e28ca947640, branch feature/glacier-reflection; origin/main remains
  671366276cab9a29c5838c1c5f9406e12de95d1f. No fetch, stage, commit, push, archive, acceptance or fix occurred.
  Captured 487 authored hashes; all 486 non-S hashes match T-021's baseline and the index is unchanged.
  Reviewed actual fixed T-021 results, not merely their summary: 556/556 cases, 24 suite results, zero skips;
  52 mapped production inclusions, 17 executable/35 erased modules; 364 statements, 291 branches, 51 functions
  and 309 lines, all covered. Verified all 23 untouched raw V8 report content hashes and bridge range identities.
  These are retained T-021 executions, not a freshly run full suite in this review.
  Reviewed all 60 named operation cells, eight curated runtime values, all 35 named erased type contracts,
  NoInfer/finite and optional tuples/rest/final overload bounds, invariant native-private brands, independent
  expected-misuse guards, shallow collection ownership, exact discovery identities/locations and readonly facade.
  Relative inward imports, no internal test imports/mocks/private-state inspection, meaningful public outcomes,
  automatic compiler emission versus ordinary direct writes, native/source identity separation, honest V8 include
  and source maps, failure atomicity, foreign-handler descriptors and instance/erasure limits are established
  except for the specific exceptional-cause defect below. No coverage exclusion/ignore or invented counter found.
  README/JSDoc and lasting companions describe the approved API and bounds; their cause promise requires the fix,
  not weakening documentation. Plan's implemented test-link renewal remains explicitly T-023 closure work.
  [Retained evidence audit](../../../packages/libraries/glacier-reflection/tests/artifacts/t022/attempt1/retained-evidence-audit.json)
  and [public-boundary reproduction](../../../packages/libraries/glacier-reflection/tests/artifacts/t022/attempt1/cause-reproduction.json)
  retain exact counts, protected revision and the new diagnostic observation.

  **F-022-001 — blocking, exceptional inspection causes are lost when their error codes collide.**
  At L src/infrastructure/adapters/inbound/CompilerMetadataRecorder.adapter.ts:85–90, the broad catch identifies
  any MetadataBoundaryError with invalid-decorator-target/location as the recorder's expected validation.
  A consumer Proxy getOwnPropertyDescriptor trap can instead throw that public error instance. The recorder
  returns only its code; CompilerMetadataBridge.adapter.ts:55 then constructs a new cause-less error, rather
  than wrapping the original exceptional inspection failure as invalid-decorator-target with its cause.
  This violates ADR-0003's preserved exceptional causes and the approved Plan failure contract; AC-026 assertion
  completeness is unmet under ADR-0005. The existing CompilerMetadataContract.test.ts:14–35 claims to reject
  this confusion but tests only a foreign-handler cause, avoiding both codes selected by the catch.
  A fresh diagnostic on session-local Node 24.21.0 imported only the generated public root, stored Boolean,
  then invoked Reflect.metadata("design:type", String) against the throwing Proxy. For each colliding code,
  causePreserved is false; invalid-decorator-location is also misclassified as a validation-location failure.
  The foreign-handler control preserves its cause, and all three probes preserve the old Boolean declaration.
  This is a minimal new public-boundary reproduction, not a new full-suite run or an implementation fix.
  Reopened T-016 for the exact fresh test-first correction scope above; T-019/T-021/T-022 must then renew.

  **All-active-ADR outcomes at this revision:**
  - ADR-0001: conforming local technology/dependency scope. Only approved library dev pins Vitest/V8/provider
    5.0.3 and Playwright 1.63.0 were added; no runtime dependency, unapproved direct package or pin substitution.
    Lockfile's added importer matches them; transitive Vite use adds no direct dependency. Node/pnpm, Turbo,
    Chromium-only routing and retained local gates agree. Remote Actions/Snyk remain unobserved future gates;
    container images, deployment and application persistence technology are inapplicable.
  - ADR-0002: conforming. Pure single-capability domain and inward inbound adapters use relative imports;
    only the curated root is exported. No bootstrap/resources on import; intentional Reflect installation
    is documented. Native copied-distribution consumers and root-only tests preserve boundaries.
  - ADR-0003: violating only F-022-001's exceptional-cause contract. Class-first behavior, native private state,
    curated exports, strict compiler flags, readonly/invariant types, justified class-identity Function use,
    contract JSDoc and bounded supervised test resources otherwise conform. Found no routine any,
    unchecked/non-null assertion, ts-ignore or broad suppression; as-const fixtures preserve literal inputs.
  - ADR-0004: not applicable with justification: no React component, hook, context, JSX or Storybook story.
    This does not waive Chromium library testing or ordinary package/testing conventions.
  - ADR-0005: coverage/test-boundary/type separation conforms, but final contract/assertion completeness is
    blocked by F-022-001. Genuine 100% counters do not prove the two unasserted error-code/cause combinations.
    Fixtures run through public roots without mocks/private hooks; erased types are independently checked.
    Application full-stack/Testcontainers testing and React story/hook tests are genuinely inapplicable.
  - ADR-0006: conforming remaining-gate process, not complete delivery. Dated initial fixture-first exception
    and material frozen class-backed facade approval are bounded; runtime and later-type red remain strict.
    Historical failures and real gates remain preserved. This review stops at a defect, with no human acceptance
    or archival/Git permissions inferred. Fresh fixes/checks/review must precede closure.
  - ADR-0007: conforming library-only applicability. AC-001–027 stay story-local, E2E section explains no
    application/service changes, no invented business catalog entries; retained root empty-catalog regression
    is not product acceptance. Durable implemented-test links remain T-023's explicitly bounded obligation.
  - ADR-0008: conforming execution records after this single-writer repair. Preserve stable task IDs, original
    done-attempt evidence, distinct approval ownership and acyclic prerequisites. Remaining recovery waves have
    one fresh worker each; all human gates retain zero-worker waits. No Brief/Plan change or new requirement.

  Documentation-only formatting, whitespace, changed-link/anchor, task DAG/remaining-wave and protected-hash
  checks are retained in attempt1 validation.json. No new dependency or runtime/full-coverage test is claimed.

- Evidence (attempt 2 / W-018-R, 2026-10-04): A new bounded worker invoked review-adr-conformance,
  document-tasks and implementation-branching; no recursive delegation. Read AGENTS/Home, every accepted active
  ADR, complete Brief/Plan/Tasks, approved dependency and engineering guidance, actual production/declarations,
  all twelve runtime and five erased-contract suites, compiler/native/distribution/example fixtures and lasting
  docs. Read approved first-declaration exception and frozen class-backed facade approval without inventing
  permissions. Only S is authored; generated review artifacts are confined to L tests/artifacts/t022/attempt2.
  HEAD 98ebe5b271a2af89345d7b7f35729e28ca947640, included origin/main
  671366276cab9a29c5838c1c5f9406e12de95d1f and feature/glacier-reflection remain fixed.

  **F-022-001 resolved; no new high-confidence findings or implementation blockers.**
  Reviewed corrected CompilerMetadataRecorder.adapter.ts record/normalize flow: expected validation returns
  discriminated outcomes, with no catch/recovery that guesses ownership from a public error class/code.
  Exceptional inspection propagates to the bridge's safe invalid-decorator-target wrapper with exact cause.
  Factory snapshot exceptions use invalid-compiler-value with exact cause; ordinary invalid inputs remain
  cause-less typed validation. Both formerly colliding codes now have explicit public cause-identity assertions,
  safe messages and unchanged declarations. Prototype/repeated-owner inspection and parameter-entry getter
  cases preserve causes without constructing consumers or invoking their accessors.
  Independently counted seven named cause regressions, fourteen executions across Node/Chromium, in both
  retained T-021 runs. A fresh Node 24.21.0 generated-public-root-only probe verifies both colliding codes plus
  foreign-handler, exact causes, wrapper classification, old Boolean, safe messages, parameter snapshot cause
  and old array, and frozen facade. This is not a fresh full-suite execution.

  Reviewed exact checked/dynamic signatures and defaults, target-anchored NoInfer, invariant native-private
  definition brands, optional/fixed/rest/final-overload parameter bounds and all 35 erased public contracts.
  Function-based IClass is explicit noninvoking identity interop for inaccessible constructors; no unsafe value
  fallback. The curated root has exactly eight runtime values and 35 named erased exports; internal base,
  discovery backing class/facade interface, storage and target helpers are not additional public exports.
  MetadataDiscovery is a frozen nonconstructible readonly operation record backed by class static operations.
  Reviewed all 60 named operation cells (120 executions per run), plus constructor/error/facade assertions,
  independent import/distribution boundaries, presence/undefined, inheritance, discovery identities, container
  ownership, compiler classification and atomic failure outcomes. Percentages are not an assertion-quality proxy.
  No internal test imports, module mocks, private hooks, hidden production excludes, ignore pragmas, invented
  counters or source/native realm conflation found.

  Recomputed actual retained T-021 check/forced JSON: 570/570 each, 285 per runtime, 24 suite results,
  no failed/pending/todo or retry-only cases. Actual completion logs retain 12/12 check, 6/6 zero-cache forced
  tests and 10/10 zero-cache forced non-test gates. Independently verified all 24 raw V8 content hashes per run,
  mapped 52 production inclusions (17 executable, 35 erased), all-file/overall 100% at
  375 statements / 307 branches / 52 functions / 318 lines, and ordinary/complementary bridge range identity.
  Retained T-019 independent declaration checks cover all 35 names and 121 misuse locations / 124 diagnostics,
  with exactly one intended unused-directive guard diagnostic; erased modules are not runtime-covered claims.
  Dependency pins/lock importer remain the approved Vitest/provider/V8 5.0.3 and Playwright 1.63.0, no runtime
  dependency or added direct Vite dependency. README/JSDoc and lasting companions match corrected contracts;
  historical example/check counts remain explicitly historical, not substituted for current results.

  **All-active-ADR outcomes at the corrected revision:**
  - ADR-0001: conforming locally; approved strict pins, supported Node/pnpm, Turbo and Chromium only.
    Application persistence/container/deployment technology is inapplicable. Remote Actions/Snyk unobserved.
  - ADR-0002: conforming; single-capability domain, relative inward adapters, curated root-only distribution,
    no bootstrap/resources on import; intentional compiler-handler activation is documented and asserted.
  - ADR-0003: conforming after F-022-001 correction; class-first/private-state design, strict types/JSDoc,
    safe failure messages, exact exceptional causes, atomic outcomes and bounded resource cleanup reviewed.
  - ADR-0004: justified inapplicability; no React/JSX, components/hooks/context or Storybook.
  - ADR-0005: conforming; meaningful public-root runtime assertions, separately checked erased contracts,
    genuine complete mapped/raw coverage and native distribution cases; React/full-stack/Testcontainers
    application tests are inapplicable. Fixed cause combinations are asserted, not inferred from coverage.
  - ADR-0006: conforming remaining-gate process, not complete delivery; approved bounded initial type
    bootstrap/facade decisions, runtime and subsequent type red/green evidence, included main and fresh
    corrected verification/manual review preserved. No human acceptance or Git/closure permission inferred.
  - ADR-0007: conforming library-only applicability; all 27 story criteria and explicit E2E/catalog
    inapplicability remain joined. Durable Plan test-link renewal remains separately authorized T-023 work.
  - ADR-0008: conforming; stable 29 task IDs, distinct approval ownership, single-writer evidence and acyclic
    sequence. Completed review wave is historical; seven unique remaining waves retain zero-worker human waits.

  [Retained evidence audit](../../../packages/libraries/glacier-reflection/tests/artifacts/t022/attempt2/retained-evidence-audit.json),
  [fresh public-boundary reproduction](../../../packages/libraries/glacier-reflection/tests/artifacts/t022/attempt2/cause-reproduction.json)
  and [scope/link/DAG validation](../../../packages/libraries/glacier-reflection/tests/artifacts/t022/attempt2/validation.json)
  retain actual observations. Minimal Tasks formatting/whitespace/link/anchor/DAG validation and all 496
  protected non-S hashes/index/ref checks pass; implementation/tests/dependencies/screenshots are untouched.

- Blocker: None for completed manual review. Historical attempt1/F-022-001 evidence remains intact.
  T-023 is dependency-ready but must await explicit archival/index/link authorization; no move is authorized.
  No stage, commit, push, remote CI/Snyk result or human acceptance is claimed; no further task executes here.

### T-023 - Prepare archival, indexes and durable test links

- Status: done
- Source: [P-008](Plan.md#implementation-steps); ADR-0006 closure; ADR-0007/ADR-0008.
- Dependencies: T-021, T-022.
- Completion condition: Finish lasting docs and implementation/verification evidence, link actual library tests,
  preserve E2E inapplicability and stable IDs, move the story to `.docs/Archive/glacier-reflection/`, and update
  Stories/Archive indexes and affected relative references. Recheck links/formatting and affected gates after closure
  edits. Archive means pre-merge preparation; T-029 stays pending. No catalog source changes are needed unless actual
  affected references are discovered; do not invent library business entries.
- Evidence: Attempt 1 / W-019, 2026-10-04: One fresh bounded closure worker, no recursive delegation,
  sole Tasks writer. The user explicitly selected “Authorize closure preparation and story archival (Recommended)”;
  the authoritative scoped decision is recorded in [Plan approval](Plan.md#approval).
  T-021 attempt2 and T-022 attempt2 are done; their corrected-revision results remain retained, not rerun here.
  Captured 497 nonignored baseline files, branch/HEAD/main and Git index before closure edits.
  Invoked implementation-closure, document-tasks, documentation-plan and implementation-branching for the
  explicitly approved in-flight feature/glacier-reflection association. Read AGENTS/Home, full Brief/Plan/Tasks,
  all eight accepted active ADRs, document templates, current wave guidance and directly affected lasting notes.
  Moved exactly Brief.md, Plan.md and Tasks.md to `.docs/Archive/glacier-reflection/` without touching the
  Git index. Related notes now link both Stories and Archive correctly; same-depth architecture/package links
  and all 27 stable criteria are preserved. Plan Validation now links all twelve implemented runtime suites,
  five independent type fixtures and actual adoption examples/native owner, plus the corrected evidence join,
  full verification and manual-review records. E2E retains its explicit library-only/catalog/Testcontainers
  inapplicability; no application criteria or catalog source references were invented.
  Updated Stories/Archive indexes to distinguish pre-merge preparation from delivery. Repaired only the
  reflection-story destinations in existing ADR-0006, Engineering Guidelines/CI and package README links;
  all other content of those four notes remains byte-identical to this attempt's baseline.
  Lasting documentation was already completed by T-018 and reviewed by T-022; no new guidance/design is needed.
  Actual retained T-021 attempt2 results remain 570/570 (285 each Node/Chromium), all-file/overall 100% at
  375 statements / 307 branches / 52 functions / 318 lines and passing complete root gates.
  This docs-only closure does not claim a fresh runtime/coverage, remote Actions/Snyk or human acceptance run.
  Source, tests, compiler configuration, manifests, lockfile, export map and automation inputs are unchanged;
  root verification tooling contains no source-path dependency on the moved story.
  On existing session-local Node v24.21.0 / pnpm 11.9.0, changed-story/index Oxfmt and the affected uncached
  `pnpm exec turbo run format-check:root format-check --force` checks pass (**2/2, zero cached**),
  as does `git diff --check`. The initial changed-file check identified only the new Tasks table formatting;
  normalized that owned note with Oxfmt and reran successfully. The first link validator reached its new
  self-linked output before that report existed; corrected only generated validator output ordering, then passed.
  [Closure validation](../../../packages/libraries/glacier-reflection/tests/artifacts/t023/attempt1/validation.json)
  records **369** real relative-file/anchor checks across all nine affected notes, stable 29 task IDs/27 criteria,
  acyclic dependencies, exactly six ordered remaining waves with unchanged human-wait counts, no live links
  to the former story location, and protected state. All 488 nonowned baseline hashes remain unchanged;
  all four external-reference repairs are verified as link-only, with unchanged Git index/branch/HEAD/main.
  HEAD is 98ebe5b271a2af89345d7b7f35729e28ca947640; included origin/main remains
  671366276cab9a29c5838c1c5f9406e12de95d1f. No fetch/new freshness claim or Git mutation occurred.
  Historical commands/ownership paths still describe their actual former location; `S` below identifies the
  current archived sole-writer resource. No other story or unrelated dirty work was moved, staged or included.
  ADR-0001/0002/0003 remain conforming through unchanged implementation/tooling and scoped formatting;
  ADR-0004 remains inapplicable. ADR-0005 retained verified public contracts/type/coverage evidence is unaffected.
  ADR-0006/0008 conform through explicit bounded archival approval, unchanged stable history, sole writer,
  repaired indexes/references and separately pending Git/human gates; ADR-0007 retains justified library-only
  E2E applicability and links real contracts without invented catalog entries.
- Blocker: None for T-023. T-024 is dependency-ready but awaits separate explicit commit permission and exact
  library/workspace scope reconciliation; preexisting agent-task-orchestration and other dirty work must not be
  silently included. No stage, commit, push, PR, scan/action, human acceptance or merge is authorized.
  T-029 remains pending; archive location is pre-merge preparation, not confirmed delivery.

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

## T-019 evidence join

This is execution evidence against the unchanged [approved mapping](Plan.md#validation), not a new requirement
baseline or an application acceptance-catalog reverse mapping. `L` is `packages/libraries/glacier-reflection`.
Links below resolve to authored, implemented tests. Retained JSON reports are generated ignored artifacts, not
durable test definitions. T-018 hashes establish correspondence to current authored files; T-017 coverage coordinates
predate T-018's JSDoc-only edits and are explicitly distinguished below.

### T-019 attempt 3 current evidence join

This is the current bounded P-007 evidence renewal after F-022-001, at uncommitted HEAD
`98ebe5b271a2af89345d7b7f35729e28ca947640` / `feature/glacier-reflection`, identified by
[baseline](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/baseline.json) and
[correspondence](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/correspondence.json).
HEAD alone does not identify the dirty implementation. T-016's 484 protected files still match its 487-entry
baseline; the two approved recorder/test hashes match its completion summary. Attempt3 captures 497 existing
nonignored files: those 487 plus ten pre-existing generated failure screenshots outside this task's write scope.
All screenshots are preserved, not moved or claimed authored. All 496 non-Tasks baseline entries remain unchanged.
Only Tasks evidence changes; generated checks/copies live in L tests/artifacts/t019/attempt3.

**Retained execution, not a fresh full gate.** Independently counted T-016 attempt4's force-results.json:
570/570 passes, 285 each actual Node/Chromium project, 24 suite results, no failures/pending/skipped/todo.
Per runtime: Address 52, CollectionOwnership 4, CompilerMetadata 61, DecoratorMapped 4, Definition 19,
Discovery 12, Distribution 5, ImportCompatibility 22, Inheritance 11, InstanceLookup 25, LegacyDecorator 7,
PublicOperationMatrix 63. The increase from historical 556 is seven compiler cases per runtime, not new criteria
or exports. T-018 retains 28 native example checks per runtime; examples were not freshly executed here.
T-016's meaningful corrected red contains eight intended failures/six passes with 106 unselected; focused green
contains 14 passes/106 unselected. Those filtered development results are not full acceptance runs.

**F-022-001 / AC-022 and AC-026.** Current
[CompilerMetadataRecorder](../../../packages/libraries/glacier-reflection/src/infrastructure/adapters/inbound/CompilerMetadataRecorder.adapter.ts)
record lines 52–83 and normalize lines 85–116 replace the former catch/code classification with typed expected
normalization outcomes. Exceptional inspections propagate to the unchanged
[bridge](../../../packages/libraries/glacier-reflection/src/infrastructure/adapters/inbound/CompilerMetadataBridge.adapter.ts)
callback catch at lines 50–55, preserving the exact consumer cause with safe invalid-decorator-target translation.
[CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts)
lines 14–42 test BOTH colliding codes plus foreign-handler: exact Error/cause identity, safe message and old Boolean
declaration. Lines 44–112 cover prototype/repeated canonical-owner inspection and no getter/construction execution;
114–139 cover parameter snapshot getters and old array preservation; 141–189 cover cause-less ordinary expected
validation, priority, invalid arity/descriptor/target/location, numeric-member success and old declaration atomicity.
These seven exceptional cases execute in each runtime; ordinary validation is separately asserted, not confused
with inspection exceptions. Source-root imports are `../../index.js`; retained native generated-root probes also
report both colliding causes preserved, safe messages and unchanged old Boolean. The earlier finding is corrected
in implementation/assertions, but fresh formal T-022 review remains required.

**Current criterion accounting.** The precise named assertions and independent contracts in the
[attempt2 criterion table](#current-criterion-accounting) remain the unaffected mapping; its unconditional
“every row satisfied” and blocked-cause conclusions are historical, not current acceptance. This renewal checks
all 27 IDs against their original Brief/Plan outcomes and the actual post-fix suite/fixture results:

| Criteria | Rejoined current public-root assertion or independent evidence                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001   | DistributionContract: copied root surface/resolution/emission, four bare-subpath rejections; fresh copied declarations pass.                                                   |
| AC-002   | Genuine LegacyDecoratorContract emission/all locations and DecoratorMappedContract direct equivalents; no consumer execution.                                                  |
| AC-003   | AddressContract class/side/member/parameter isolation and rejected mutations, plus InstanceLookupContract plain/prototype rejection.                                           |
| AC-004   | DefinitionContract same-name identities and matrix exact discovered/shared predefined identities.                                                                              |
| AC-005   | Fresh MetadataTypes/DistributionTypes inference, variance and rejected writes/decorators/independent read generics.                                                            |
| AC-006   | Fresh AddressTypes/InstanceLookupTypes checked methods, NoInfer, fixed/optional/rest/final-overload bounds and explicit dynamic limits.                                        |
| AC-007   | InheritanceContract same-shaped replacement versus homogeneous record accumulation; fresh invariant kind contracts.                                                            |
| AC-008   | InheritanceContract nearest intact value, own-only absence, explicit undefined and ancestor reappearance.                                                                      |
| AC-009   | InheritanceContract exact ancestor-first duplicate-preserving a,b,b,c and own b,c.                                                                                             |
| AC-010   | InheritanceContract whole conflicting-entry replacement; CollectionOwnership reserved-key/null-prototype behavior.                                                             |
| AC-011   | Fresh MetadataTypes homogeneous/readonly possibly absent entries and incompatible-entry diagnostics; runtime independent contributions.                                        |
| AC-012   | InheritanceContract matching positions/different signatures/own exclusion; unchanged README/adoption bounds.                                                                   |
| AC-013   | InheritanceContract and LegacyDecoratorContract latest direct declaration, preserved ancestor contributions.                                                                   |
| AC-014   | DefinitionContract missing versus present undefined, presence/discovery and nearest undefined replacement.                                                                     |
| AC-015   | DefinitionContract/DiscoveryContract true/false direct deletion, unrelated retention, inherited reappearance and cleanup.                                                      |
| AC-016   | InheritanceContract/DiscoveryContract present empty collections preserve ancestors; unchanged curated API has no reset/suppression.                                            |
| AC-017   | CollectionOwnership and DecoratorMappedContract shallow input/output/creation snapshots, identity and atomic snapshot failure.                                                 |
| AC-018   | DiscoveryContract exact same-name definition identities, own/inherited undefined/empty presence and deduplication.                                                             |
| AC-019   | DiscoveryContract canonical target-free frozen addresses, instance filtering, deduplication and own-mode dynamic round trips.                                                  |
| AC-020   | CompilerMetadataContract and independent DistributionContract genuine import-before-emission for all three design keys.                                                        |
| AC-021   | CompilerMetadataContract scalar/whole-array replacement, empty/unavailable values and compiler snapshots; matrix ordinary value identity.                                      |
| AC-022   | Corrected exact-cause/validation/atomicity cases linked above, plus unchanged malformed key/scalar/dense/sparse/native tables.                                                 |
| AC-023   | ImportCompatibility native failure realms and mapped source complements preserve foreign/unavailable/uninstallable descriptors and unrelated Reflect.                          |
| AC-024   | Unchanged README/JSDoc/lasting notes and fresh checked examples preserve erasure, dynamic, overload, instance and parameter-meaning bounds.                                    |
| AC-025   | Retained 28 native checks each runtime for emitted Object plus explicit Symbol/interface identity, no resolver/registry; fresh example types pass.                             |
| AC-026   | All eight runtime values, 60 named operation cells, corrected causes, 35 independent named types and genuine mapped coverage rejoined; T-021/T-022 renewal still pending.      |
| AC-027   | InstanceLookupContract/DiscoveryContract constructor/two-instance/subclass equivalence, shadowing/getter avoidance and category rejection; fresh constructor-only type guards. |

The [runtime inventory](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/runtime-inventory.json)
verifies all 120 passing cell executions (six definitions × ten operations × two runtimes), plus fourteen
exceptional-cause executions. Matrix constructor/name/kind/error/frozen detached-facade assertions and
DiscoveryContract remain unchanged. Exactly four classes, one nonconstructible readonly frozen operation record,
three ordinary value-definition constants: eight runtime values; Reflect.metadata is not a ninth root export.
Every current named type in the [35-name inventory](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/erased-type-inventory.json)
has direct accepted/equality and applicable misuse references in the unchanged five fixtures; their detailed
contracts remain the [attempt2 type inventory](#current-erased-type-inventory), not a runtime coverage claim.

**Fresh independent erased contracts.** Existing session-local Node v24.21.0 / pnpm 11.9.0 ran only
`pnpm --filter @glacier/reflection exec tsc --project tests/artifacts/t019/attempt3/consumer/<config>`:
contracts/tsconfig.json and tsconfig.examples.json exit 0; unsuppressed/tsconfig.json and unused-guard/tsconfig.json
exit 1 as intended. Fresh copied current dist/manifest, all five current contracts and current example inputs
resolve through isolated @glacier/reflection root declarations, not internal source. Sensitivity independently
matches 121 expected misuse source locations to 124 intended diagnostics and exactly one TS2578 on a guarded
accepted assignment, with no missing-symbol/setup errors. Logs and
[sensitivity](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/type-sensitivity.json)
are retained. No type change/artificial type red or renewed bootstrap exception is claimed.
All 58 generated JS files were compared with attempt2's copy excluding JSDoc only: the recorder is the sole
changed executable module. Its internal declaration alone changes; root and all public declarations are identical.

**Genuine retained coverage.** Recomputed actual statement/branch/function/line counters from T-016's
force-coverage-final.json, not percentages or copied summaries:
[coverage audit](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/coverage-audit.json)
has all 52 production inclusions, 17 executable/35 erased, 375/375 statements, 307/307 branches,
52/52 functions, 318/318 lines, 100% overall and each executable file. Both discovery files remain included;
erased zero-counter modules are independently checked, not runtime-covered. The recorder's added private
normalization function legitimately changes cardinality from 51 to 52; no old/new map substitution is used.
All 23 raw V8 filenames match their content SHA-256. Current source hashes match the corrected capture;
native generated/source script identities remain distinct in T-016's retained audit. No shared coverage output,
counter, include, threshold or source map was rewritten by this worker.

**Bounded ADR review / next dispatch.** ADR-0001/0002 conform through unchanged approved pins/runtime,
root-only dependency-free API and inward relative boundaries. ADR-0003 cause preservation now has the exact
corrected public assertions; class-first normalizer and existing safe bridge wrapping preserve the approved
failure contract. ADR-0004 is not applicable (no React). ADR-0005 assertion/coverage/type separation conforms
for this join, not final acceptance. ADR-0006/0008 preserve approval ownership, bounded fresh nonrecursive
single writer, unchanged criteria and stable serial waves. ADR-0007 remains library-only with actual library
links and justified application catalog/E2E/Testcontainers inapplicability. Lasting notes remain consistent;
no companion edit is needed for the contract-preserving correction. This is not renewed formal T-022 review
or human acceptance. [Validation](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt3/validation.json)
records task/DAG/remaining-wave/link/format/whitespace/protected-revision checks.
T-019 attempt3 is done; next is one fresh T-021 attempt2, then one fresh T-022 attempt2. Neither is executed
here. Closure waits for renewed gates/review and explicit archival/index/link permission; all Git/CI/Snyk/
human acceptance/merge gates remain separate.

### T-019 attempt 2 current evidence join

Historical attempt2 join follows; attempt3 above supersedes its readiness and cause-completeness conclusions.

The following is the renewed P-007 join at the working-tree revision identified by
[baseline hashes](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/baseline.json) and
[protected hashes](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/protected-hashes.json).
The older criterion/runtime/type/coverage tables below are **attempt1 history**, not current failures.
No requirement, signature, dependency or threshold was changed by this join.

**Observed versus fresh checks.** T-017 attempt2's actual `audited-results.json` contains **556/556 passing cases**,
**278 per Node/Chromium**, 24 suite results and zero failures/pending/skips. Per runtime: Address 52,
CollectionOwnership 4, CompilerMetadata 54, DecoratorMapped 4, Definition 19, Discovery 12, Distribution 5,
ImportCompatibility 22, Inheritance 11, InstanceLookup 25, LegacyDecorator 7, PublicOperationMatrix 63.
These are retained runs, not freshly executed T-019 runtime tests. T-018 attempt2 retains **28/28 native example
checks in EACH runtime**, actual import-before-emission and copied example/type checks.
T-019 freshly compiled the copied contracts and examples against isolated generated declarations, and freshly
ran misuse/unused-guard sensitivity controls; it did not run build, fixture preparation, native servers or coverage.

Current [executable correspondence](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/executable-identity.json)
compares all 58 generated ESM files with T-017's copied distribution, stripping only JSDoc blocks and blank/line-edge
whitespace: executable text is unchanged. Current generated declarations equal T-018's copy byte-for-byte.
T-018 changed JSDoc coordinates, so retained coverage positions are not described as newly collected current-source
coordinates. [Recomputed coverage](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/coverage-audit.json)
includes exactly all **52 current production files**, **17 executable and 35 erased**, including
MetadataDiscovery.ts and MetadataDiscoveryOperations.ts, at unchanged **100% overall/per-file**:
**364/364 statements, 291/291 branches, 51/51 functions, 309/309 lines**. Function maps match T-016 attempt3;
23 untouched retained raw V8 reports have verified content hashes. The facade has one executable initialization
statement and zero functions/branches; its backing class has two genuine functions. Zero-counter erased modules
contain only emitted `export {};` and source-map comments, not hidden runtime behavior.

#### Current criterion accounting

Every row is satisfied for this bounded distribution/adoption join through the cited actual assertions or review.
AC-026's final current-main/CI/human acceptance gates remain T-020 onward, not waived by this table.
Quoted names identify executable cases, not merely file existence; type fixtures are independently checked.

| Criterion | Named assertion or independent contract / reviewed outcome                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts): “resolves exactly the public runtime surface and records genuine compiler emission before consumer execution” and four rejected bare subpaths; copied root declarations pass. Browser import-map rejection is not npm enforcement of arbitrary URLs.                                                                                                                          |
| AC-002    | [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): “executes genuine TypeScript emission at all locations without consumer execution”; [DecoratorMappedContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DecoratorMappedContract.test.ts): “normalizes every legacy callback shape without executing or replacing consumers”. Genuine built emission and mapped direct equivalents stay distinct.   |
| AC-003    | [AddressContract](../../../packages/libraries/glacier-reflection/tests/scenarios/AddressContract.test.ts): “all class side member and parameter positions remain isolated”, checked/dynamic location matrix; invalid mutations reject rather than report absence.                                                                                                                                                                                                                                  |
| AC-004    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts): same-name identity cases across three kinds; [PublicOperationMatrix](../../../packages/libraries/glacier-reflection/tests/scenarios/PublicOperationMatrix.test.ts): exact discovered definition objects, shared predefined identities.                                                                                                                                            |
| AC-005    | [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): exact inferred results and rejected writes/decorators/read generics/variance; [DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts): independent generated-root equivalents.                                                                                                                                                    |
| AC-006    | [AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts), [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts): every checked signature, NoInfer, finite/optional/empty/rest/final-overload positions, inaccessible constructors, numeric/symbol/inherited keys and explicit dynamic bounds.                                                                                           |
| AC-007    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): “accumulates homogeneous records but replaces conflicting entries whole rather than recursively”, contrasting same-shaped whole-value replacement; invariant kinds cannot interchange.                                                                                                                                                                                          |
| AC-008    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): “replaces whole values at the nearest declaration, including undefined, and reveals ancestors on deletion”; exact three-level identity and own absence.                                                                                                                                                                                                                         |
| AC-009    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): “concatenates three levels ancestor-first with duplicates, replaces repeated writes and does not reset”; exact a,b,b,c and own b,c.                                                                                                                                                                                                                                             |
| AC-010    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): whole conflicting service entry loses ancestor label; [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts): reserved keys/null-prototype dictionary.                                                                                                                                                               |
| AC-011    | [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): homogeneous contributions, rejected incompatible entries, readonly missing key includes undefined; inherited runtime entries are separately asserted.                                                                                                                                                                                                                                     |
| AC-012    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): “matches parameter positions without claiming equivalent signatures or leaking other positions”; [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts) and README disclaim semantic equivalence.                                                                                                                             |
| AC-013    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts) and [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): second direct writes/decorators replace first while ancestor contributions remain.                                                                                                                                                                |
| AC-014    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts): “explicit undefined is present in reads presence and definition discovery” and “explicit undefined overrides a base replacement rather than revealing its value”.                                                                                                                                                                                                                 |
| AC-015    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts) deletion true/false cases; [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): “cleans direct indexes while preserving inherited, unrelated and other-definition declarations”.                                                                                                                                         |
| AC-016    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts) exact empty-collection/no-reset assertions; [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): empty declarations remain present. Reviewed root/signatures expose no reset/suppression.                                                                                                                              |
| AC-017    | [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts): “copies and freezes input and output list structure, preserving contained objects and replacement identity”; record own-enumerable snapshots and atomic getter failures; decorator creation snapshots in [DecoratorMappedContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DecoratorMappedContract.test.ts).                                             |
| AC-018    | [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): “returns actual same-name identities once at an exact address, never a member inventory”; inherited/own undefined/empty presence and deletion cleanup.                                                                                                                                                                                                                              |
| AC-019    | [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): “discovers every canonical address with inheritance deduplication and instance filtering”; target-free shallow-frozen records and dynamic round trips carrying own mode.                                                                                                                                                                                                            |
| AC-020    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): “automatically records genuine TypeScript emission before decorated declarations run”; [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts) independently exercises all three emitted keys. Explicit custom writes are not labelled compiler emission.                                                 |
| AC-021    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): “replaces scalar and whole parameter declarations, including empty and unavailable values” and “snapshots and freezes only compiler-ingested parameter arrays”; matrix preserves ordinary direct-array identity.                                                                                                                                                      |
| AC-022    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): “rejects sparse and invalid dense parameter arrays through the source public protocol atomically”, malformed key/value/target/location tables, preserved old declarations and causes; actual recorder counters all covered.                                                                                                                                           |
| AC-023    | [ImportCompatibility](../../../packages/libraries/glacier-reflection/tests/scenarios/ImportCompatibility.test.ts): foreign descriptor cases, unavailable/throwing Reflect, uninstallable slots and “activation preserves every unrelated Reflect descriptor and ordinary behavior”; preserved native realms plus same-origin source complements close actual bridge counters.                                                                                                                      |
| AC-024    | [README](../../../packages/libraries/glacier-reflection/README.md), all contract JSDoc, [AdoptionTypes](../../../packages/libraries/glacier-reflection/tests/data/examples/AdoptionTypes.ts): reviewed erasure, dynamic/overload/position-only/structural-instance and custom-value bounds match Brief/Plan.                                                                                                                                                                                       |
| AC-025    | [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts): emitted constructor Object plus explicit Symbol for IRepository, no resolver/token abstraction/registry or consumer construction; retained 28 native checks per runtime.                                                                                                                                                                                                                 |
| AC-026    | [PublicOperationMatrix](../../../packages/libraries/glacier-reflection/tests/scenarios/PublicOperationMatrix.test.ts): all 60 named definition-operation cells plus constructor/identity, error and frozen detached discovery cases; all 35 named contracts independently checked, fresh sensitivity controls and actual all-production retained 100% coverage. Original matrix gaps closed; T-022 F-022-001 now blocks exceptional-cause completeness and closure despite those genuine counters. |
| AC-027    | [InstanceLookupContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InstanceLookupContract.test.ts): two-instance/constructor and subclass own/inherited equality, shadowed constructor/getter avoidance, no construction, plain/prototype and unsupported-category rejection, observable inspection errors; checked types preserve constructor-only mutation.                                                                                                                 |

#### Current runtime inventory

The root is exactly **four classes + one frozen nonconstructible facade + three instances = eight runtime values**.
The internal base, supporting facade interface and backing class are not root exports; no reset or extra runtime
export exists.
Each row below has all ten individually named cells in
[PublicOperationMatrix](../../../packages/libraries/glacier-reflection/tests/scenarios/PublicOperationMatrix.test.ts):
`set`, `setDynamic`, `read`, `readDynamic`, `has`, `hasDynamic`, `delete`, `deleteDynamic`, `locations`, `decorator`.
Each cell's complete name ends “success, own/inherited boundaries and atomic validation”; fresh targets isolate cases.

| Definition object / export      | Accepted result, rejection and boundary evidence across its ten cells                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ValueMetadataDefinition         | Whole-value identity/nearest replacement, own absence, invalid target/position, atomic rejection and deletion revealing Base.                                                                   |
| ListMetadataDefinition          | Exact ancestor-first list, frozen location results, own list, invalid target/position, direct-only deletion; collection/decorator suites additionally assert shallow ownership.                 |
| RecordMetadataDefinition        | Exact homogeneous accumulated entries/whole conflict replacement, own record, explicit setDynamic/hasDynamic/deleteDynamic and other formerly missing cells, atomic invalid-input preservation. |
| DESIGN_TYPE_METADATA            | Ordinary value identity and exact discovery identity, String/Number nearest replacement, every checked/dynamic operation/rejection cell.                                                        |
| DESIGN_RETURN_TYPE_METADATA     | Ordinary value identity, present undefined nearest replacement, every checked/dynamic operation/rejection cell.                                                                                 |
| DESIGN_PARAMETER_TYPES_METADATA | Ordinary whole-array identity and empty descendant replacement, every checked/dynamic operation/rejection cell; compiler ingestion snapshots remain separately asserted.                        |

The matrix also explicitly checks all definition constructors/name/kind, predefined names/kinds/shared identities,
MetadataBoundaryError's Error identity/code/safe message/with-and-without cause, and both detached facade operations.
[DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts) adds exact
frozen property descriptors, stable readonly bindings, nonconstruction/prototype absence, inherited/own identity sets,
empty/undefined boundaries, validation and exceptional inspection propagation.
The ambient Reflect factory/callback is **not a ninth root export**: compiler/native suites assert its success,
all rejection categories, atomicity, snapshots, import order/conflict and unrelated descriptor preservation.
[Runtime inventory](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/runtime-inventory.json)
retains all 126 matrix result records, 120 belonging to the 60 cells executed twice.

#### Current erased type inventory

All **35** names below are direct public-root fixture references, verified against actual source coordinates in
[named inventory](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/erased-type-inventory.json).
`M`, `A`, `I`, `D`, `R` refer respectively to the implemented
[MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts),
[AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts),
[InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts),
[DecoratorTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DecoratorTypes.test-d.ts),
[DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts).
Exact equality/accepted assignments and applicable rejected misuse are established independently, not by loading
declarations or percentages. Rejections through containing typed public signatures count as contract checks, not
a promise to runtime-validate arbitrary JavaScript values.

| Named erased root export                | Direct fixture / accepted contract and applicable rejected misuse                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| IRuntimeType                            | M/R: exact scalar/array results; objects and nonfunction entries reject.                                      |
| ICompilerMetadataDecorator              | M: exact factory callback return; D/Compiler fixtures verify legacy calls, invalid contexts/targets reject.   |
| ICompilerMetadataRejectionCode          | M: exact four-code union; R's boundary union rejects invented codes.                                          |
| IMetadataBoundaryErrorCode              | R: exact seven-code union, accepted foreign-handler; arbitrary code rejects.                                  |
| IClass                                  | A: private/protected constructor identity accepted; instance mutation rejects.                                |
| IConstructableClass                     | R: exact abstract constructor/accepted Consumer; instance assignment rejects.                                 |
| IMetadataKind                           | R: exact value/list/record union; invented merge rejects.                                                     |
| IMetadataSide                           | R: exact instance/static union; constructor side rejects.                                                     |
| IMetadataLookup                         | R: exact optional readonly own/inherited options; mutation rejects.                                           |
| IMetadataDefinitionIdentity             | I: exact readonly identity array; untyped write capability rejects.                                           |
| IMethodKey                              | A: exact callable/optional/symbol key union; noncallable parameter addressing rejects.                        |
| IMethodParameters                       | A: exact final-overload tuple; out-of-range positions reject.                                                 |
| IStaticMemberKey                        | A: exact public static keys; prototype addressing rejects.                                                    |
| IParameterIndex                         | A: fixed/optional/empty/open equality; finite out-of-range positions reject.                                  |
| IMetadataClassAddress                   | R: exact readonly class shape/accepted class; member kind rejects.                                            |
| IInstanceMemberMetadataAddress          | R: exact public keys/accepted name; missing key rejects.                                                      |
| IInstanceMethodParameterMetadataAddress | R: exact callable member and position 0; position 1 rejects.                                                  |
| IInstanceMetadataAddress                | I: exact conditional instance union; static/constructor-parameter requests reject.                            |
| IStaticMemberMetadataAddress            | R: exact static public keys; prototype rejects.                                                               |
| IStaticMethodParameterMetadataAddress   | R: exact static callable tuple; position 1 rejects.                                                           |
| IConstructorParameterMetadataAddress    | A: finite/optional tuple, inaccessible constructors yield never; invalid positions reject.                    |
| IClassMetadataAddress                   | A: valid union shared across checked operations; invalid key/tuple rejects.                                   |
| IMetadataReadAddress                    | I: exact constructor/instance conditional contracts; unsupported instance categories reject.                  |
| IDynamicInstanceMetadataAddress         | R: exact dynamic union, symbol/position 100 accepted; static side rejects.                                    |
| IDynamicClassMetadataAddress            | A: complete explicit dynamic operations accepted; malformed mutation shape rejects.                           |
| IDiscoveredMetadataAddress              | A/I: canonical readonly full union and dynamic round trips; checked use/outer mutation rejects.               |
| IMetadataAddressRejectionCode           | R: exact four-code union/accepted invalid-position; absent rejects.                                           |
| IMetadataAddressRejection               | R: exact readonly false/code record; discriminant mutation/value access rejects.                              |
| IMetadataWriteResult                    | M/A: exact set/setDynamic outcomes; wrong typed values/addresses reject.                                      |
| IMetadataRead                           | M/R: exact definition-owned/discriminated results; absent value access/return-type invention rejects.         |
| IMetadataPresenceResult                 | M/A: exact has/hasDynamic validated presence; invalid checked addresses reject.                               |
| IMetadataDeletionResult                 | M/A: exact delete/deleteDynamic outcomes; instance/options/invalid addresses reject.                          |
| IMetadataLocationsResult                | A/I: exact canonical readonly arrays/records; mutation rejects.                                               |
| IMetadataDefinitionsResult              | A/I: exact readonly identity arrays; mutation/untyped write access rejects.                                   |
| ILegacyMetadataDecorator                | D/M: accepted class/member/descriptor/parameter and void return; wrong value/context/key/replacement rejects. |

Fresh copied-consumer commands on supported Node/pnpm both exit 0:
`pnpm --filter @glacier/reflection exec tsc --project tests/artifacts/t019/attempt2/consumer/contracts/tsconfig.json`
and the same runner with `consumer/tsconfig.examples.json`.
[Fresh sensitivity](../../../packages/libraries/glacier-reflection/tests/artifacts/t019/attempt2/type-sensitivity.json)
confirms **121/121** expected misuse locations have **124** intended unsuppressed diagnostics, plus exactly one
TS2578 for a deliberately guarded accepted assignment. All 35 generated type-only modules contain only `export {};`
and source-map comments. No erased type is claimed runtime-covered. Historical fixture-first bootstrap and later
facade meaningful type/runtime red remain their original tasks' evidence, not manufactured by this unchanged join.

#### Current conformance and readiness

- ADR-0001: conforming bounded join; approved four exact dev pins, no runtime dependencies, supported Node/pnpm,
  Chromium only. Remote Actions/Snyk remain unobserved.
- ADR-0002: conforming curated root and inward/relative boundaries; backing discovery class/base/internal helpers
  are not consumer exports. Native copied-package tests establish distribution boundaries.
- ADR-0003: conforming class-first backing behavior, readonly data facade, strict invariant public signatures,
  private state and reviewed contract JSDoc; this task changes only evidence documentation.
- ADR-0004: not applicable; no React.
- ADR-0005: attempt1 coverage/operation/type conflicts resolved by observed recoveries and this independent audit;
  meaningful assertions and unchanged all-production V8 thresholds hold. Retained runtime versus fresh types are
  distinguished; final current-main verification remains pending, not an acceptance waiver.
- ADR-0006: conforming approved in-flight adoption, fresh nonrecursive sole writer, failed history retained,
  no Git/archival permission or human acceptance inferred.
- ADR-0007: conforming library-only criteria/E2E/catalog inapplicability; actual library links handed off here.
- ADR-0008: conforming distinct document ownership, 29 stable task IDs, acyclic dependencies and exact serialized
  remaining waves. Plan's planned paths are not retroactively claimed authored links; closure owns any renewal.

README/JSDoc and all five lasting companions agree with current signatures, facade/counts, import effects, bounds,
commands and configured-but-unobserved CI. No infeasible approved API or companion-design discrepancy was found.
T-019 is done. **T-020 is dependency-ready, authorization-blocked** at zero workers; current-main integration,
final local checks/manual review, archive/index/link preparation, commit, publication, CI/Snyk, human acceptance
and merge remain separate outstanding gates. This worker does not execute T-020.

### T-019 criterion accounting

Historical attempt1 accounting follows; the renewed attempt2 join above supersedes its current-readiness findings.

| Criterion | Observed assertions/examples/review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Finding                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts): exact eight exports, copied root resolution, genuine emission, four rejected subpaths; [DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts) consumes generated declarations.                                                                                                                                                                                                           | Node 24/Chromium native evidence; no DI/runtime dependency. Browser bare-import rejection is not npm enforcement of arbitrary HTTP URLs. |
| AC-002    | [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): 23 Consumer locations plus inaccessible-constructor/member cases; callback/direct equivalence, descriptor/void identity, no construction/getters. [AddressContract](../../../packages/libraries/glacier-reflection/tests/scenarios/AddressContract.test.ts) covers direct location matrix.                                                                                                                                                  | Assertions observed passing; genuine fixture uses built root, so mapped source coverage remains separate.                                |
| AC-003    | [AddressContract](../../../packages/libraries/glacier-reflection/tests/scenarios/AddressContract.test.ts): 11 addresses, class/side/position isolation, numeric/symbol normalization and rejected object/instance mutations. [InstanceLookupContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InstanceLookupContract.test.ts): invalid plain/prototype reads.                                                                                                                                                                                   | Explicit outcomes, not absence-shaped rejection.                                                                                         |
| AC-004    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts): same-name within/across kinds and shared identities; [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): independent design:type name and predefined constants.                                                                                                                                                                                                              | Actual identity sets, not descriptive-name equality.                                                                                     |
| AC-005    | [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): inferred reads, value/list/record writes/decorators, rejected return-type invention, invariance and distinct brands. [DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts): emitted-declaration equivalents.                                                                                                                                                                                        | Independent types pass; bootstrap/negative sensitivity history remains T-009/T-015/T-017, not runtime-covered.                           |
| AC-006    | [AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts), [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts): all checked signatures, NoInfer, fixed/optional/empty/rest/final-overload tuples, private/protected, symbol/numeric/inherited keys and explicit dynamic paths.                                                                                                                                                                             | Type guards observed; dynamic positions intentionally do not claim finite tuple bounds.                                                  |
| AC-007    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): same-shaped object definitions replace whole values versus merge homogeneous entries. [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): no cross-kind interchange.                                                                                                                                                                                                                           | No per-write mode switch in reviewed root API.                                                                                           |
| AC-008    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): Base/Middle/Leaf nearest intact object identity, own absence and undefined; deletion reveals Middle.                                                                                                                                                                                                                                                                                                                                                | Exact values and identity asserted.                                                                                                      |
| AC-009    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): exact a,b,b,c inherited list and b,c own list; three levels and duplicate preservation.                                                                                                                                                                                                                                                                                                                                                             | No deduplication inferred from counts alone.                                                                                             |
| AC-010    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): service whole-entry conflict removes label while retained entry survives. [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts): reserved string keys/null prototype.                                                                                                                                                                                                                   | Nonrecursive behavior established by exact result.                                                                                       |
| AC-011    | [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): homogeneous Ada/Grace contributions, wrong entry rejection and missing key includes undefined; [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): separate runtime entries.                                                                                                                                                                                                                   | Named record-entry types and readonly result independently checked.                                                                      |
| AC-012    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts), [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): changed constructor/method signatures, matching positions, own exclusion and unrelated positions. [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts): ChangedConsumer.                                                                                             | README/JSDoc explicitly disclaim semantic dependency/signature equivalence.                                                              |
| AC-013    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts): latest value/list/record direct writes; [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): latest decorators and retained ancestor contribution.                                                                                                                                                                                                                            | Accumulation is across ancestry, not repeated direct writes.                                                                             |
| AC-014    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts): absent versus present undefined, has/discovery presence, own/inherited overriding ancestor.                                                                                                                                                                                                                                                                                                                                                           | Discriminants and values both asserted.                                                                                                  |
| AC-015    | [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts), [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts), [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): true/false deletion, own removal, ancestor reappearance, unrelated/other-definition retention and index cleanup.                                                                                                    | No ancestor mutation or suppression claimed.                                                                                             |
| AC-016    | [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts), [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): present empty own collections preserve inherited values. Root and declaration review show no reset/suppression API.                                                                                                                                                                                                                  | Behavioral evidence plus inventory review, not proof by percentages.                                                                     |
| AC-017    | [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts): input/output mutation, shallow freezing, contained/replacement identity and snapshot failure atomicity; [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts): creation-time snapshots.                                                                                                                                                                                         | No deep-copy or arbitrary JavaScript value-validation promise.                                                                           |
| AC-018    | [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): exact inherited/own identity sets, same-name deduplication, undefined/empty presence, deletion cleanup and frozen arrays.                                                                                                                                                                                                                                                                                                                               | Exact address scope, not all-member inventory.                                                                                           |
| AC-019    | [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts): exact canonical target-free address sets, all sides/parameter kinds, numeric/symbol keys, deduplication, instance filtering and readDynamic round trips with own mode carried forward.                                                                                                                                                                                                                                                                  | No discovery ordering or tuple reconstruction assertion.                                                                                 |
| AC-020    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts), [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts): actual emitted String/Number/Function/Boolean metadata from import-before-declaration fixtures, all three keys in native Node/Chromium.                                                                                                                                                                              | Automatic recording without opt-in; direct Reflect writes are not mislabelled genuine emission.                                          |
| AC-021    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): scalar/whole-array nearest replacement, empty arrays and unavailable values, compiler snapshots versus ordinary direct/decorator identity. [MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts): parameter constant is not ListMetadataDefinition.                                                                                                                                     | Ordinary value-definition semantics preserved.                                                                                           |
| AC-022    | [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts): all three keys, unsupported string/symbol keys, malformed scalar/dense/sparse/holey arrays, invalid callback target/location and oldDeclarationPreserved; safe cause/atomic mapped cases.                                                                                                                                                                                                                                                 | Real throws and old values observed, not only missing activation. Native-only branch mapping remains incomplete.                         |
| AC-023    | [ImportCompatibility](../../../packages/libraries/glacier-reflection/tests/scenarios/ImportCompatibility.test.ts): foreign writable/locked/nonfunction/accessor descriptors, unavailable/uninstallable slots, repeated import, physical copy conflict and every unrelated Reflect descriptor; [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts): distributed conflict.                                                                                                                               | Fresh realms preserve descriptors; native execution is not automatically source coverage.                                                |
| AC-024    | [README](../../../packages/libraries/glacier-reflection/README.md), contract JSDoc, [AdoptionTypes](../../../packages/libraries/glacier-reflection/tests/data/examples/AdoptionTypes.ts), [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts): erased interface/Object, runtime-representation bounds, dynamic/overload/position-only and shallow/custom-write limits.                                                                                                                                            | Reviewed bounds match Brief/Plan; no reconstruction or signature-equivalence promise.                                                    |
| AC-025    | [AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts): genuine emitted constructor Object plus explicit Symbol identity for IRepository, checked own reads and changed descendant; [AdoptionExampleRun](../../../packages/libraries/glacier-reflection/tests/data/AdoptionExampleRun.ts): 28 checks each native runtime.                                                                                                                                                                                            | No consumer construction, resolver, token abstraction or registry. Supplementary checks do not replace runtime suites.                   |
| AC-026    | All implemented suites/contracts below; independent types pass and all 368 retained assertions pass. Seven production files fail mapped per-file coverage; some explicit class-method/type-export assertions are missing.                                                                                                                                                                                                                                                                                                                                              | **Unmet; acceptance blocker.** Aggregate 95.34% statements / 91.46% branches / 98.07% functions / 96.11% lines, not 100%.                |
| AC-027    | [InstanceLookupContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InstanceLookupContract.test.ts), [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts), [InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts): constructor/two-instance/subclass equality both modes, shadowed constructor/getter avoidance, static/constructor-address rejection, filtered discovery, mutations reject and inspection errors propagate. | Genuine class declarations only; documented structural/prototype identity bounds preserved.                                              |

### T-019 public runtime inventory

At the retained T-019 attempt 1 revision, the root exports **eight runtime values**: three constructible definitions,
one static discovery class, one error class and three predefined instances. The approved facade revision keeps eight
runtime values but changes that representation to four classes, one nonconstructible discovery facade and three
predefined instances. T-019 attempt 2 must verify the implemented count/shape rather than rewrite this retained run.
Each definition/constant inherits the same ten public operations below;
`name` and `kind` are readonly descriptive properties. Internal `prepare`, `resolve`, storage/normalizers/bridge
classes and their methods are not root exports. The historical MetadataDiscovery private constructor is not a public
creation API; its approved replacement has no constructor or instance API. `Reflect.metadata` is a separate ambient
compiler protocol, not a ninth importable root runtime export.

| Public item                                                     | Observed meaningful evidence                                                                                                                                                                                 | Qualification                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| ValueMetadataDefinition constructor, name, kind                 | DefinitionContract named constructor/identity cases; MetadataTypes inference/invariance.                                                                                                                     | Shared address/instance rejection matrix exercises its operations. No arbitrary JavaScript custom-value validation is promised.        |
| ListMetadataDefinition constructor, name, kind                  | DefinitionContract; InheritanceContract duplicate-preserving lists; CollectionOwnership and LegacyDecoratorContract snapshots.                                                                               | Own/inherited/empty/repeated-write and list invalid-position/invalid-decorator-target boundaries observed.                             |
| RecordMetadataDefinition constructor, name, kind                | DefinitionContract; InheritanceContract whole-entry replacement; CollectionOwnership reserved keys, snapshots/getter failure.                                                                                | Record exception atomicity is observed; not every inherited operation has a record-specific runtime cell.                              |
| set / setDynamic                                                | AddressContract checked/dynamic equivalence and invalid targets/addresses/positions; InheritanceContract all kinds; list dynamic location matrix.                                                            | Record setDynamic has accepted-use type evidence but no explicit record-specific runtime assertion located.                            |
| read / readDynamic                                              | DefinitionContract all kinds; AddressContract all locations; InheritanceContract values/lists/records; DiscoveryContract dynamic list/record round trips.                                                    | Class/constant-specific dynamic rejection cells are not exhaustive merely because the shared normalizer is covered.                    |
| has / hasDynamic                                                | DefinitionContract and AddressContract absence/presence/rejection; InstanceLookupContract both modes; InheritanceContract list/record own empty presence.                                                    | List/record hasDynamic lack explicit kind-specific runtime cells.                                                                      |
| delete / deleteDynamic                                          | DefinitionContract true/false outcomes; InheritanceContract all kinds and list dynamic ancestor reappearance; DiscoveryContract unrelated/index retention.                                                   | Record deleteDynamic lacks an explicit kind-specific runtime cell; direct record deletion is observed.                                 |
| locations                                                       | DiscoveryContract canonical/frozen/deduplicated addresses, empty/rejection/exception, both modes; joined list/record loops and instance filtering.                                                           | Defined metadata-bearing inventory only, not all members; own reads carry own separately.                                              |
| decorator                                                       | LegacyDecoratorContract genuine 23-location fixture plus private/protected cases, all kinds' ownership, void, invalid invocation and snapshot errors; DiscoveryContract joined list/record.                  | Built-root genuine suite passes but its source-equivalent mapped rejection coverage remains incomplete.                                |
| MetadataDiscovery.definitions / definitionsDynamic              | AddressContract, InstanceLookupContract and DiscoveryContract exact identities, static/instance modes, malformed inputs, deduplication/freeze and inspection throws.                                         | Type fixtures reject construction-related misuse only indirectly; private constructor function coverage is still missing.              |
| MetadataBoundaryError constructor, code, inherited Error fields | LegacyDecoratorContract explicit name/message/code/cause and no-cause; CompilerMetadataContract safe wrapping; ImportCompatibility exact integration error codes.                                            | No validation of arbitrary JavaScript error-code arguments promised. All declared categories observed at boundaries.                   |
| DESIGN_TYPE_METADATA                                            | CompilerMetadataContract genuine/direct String/Number/undefined, isolation, ordinary value class/kind, set/read/has/locations/delete/decorator scalar loop and malformed-key/value/target/address rejection. | Inherited dynamic operation inventory is shared, not complete scalar-constant-specific assertion coverage.                             |
| DESIGN_RETURN_TYPE_METADATA                                     | Same scalar loop plus genuine return String, unavailable nearest replacement and all key-index 2 rejection tables.                                                                                           | No implication that a function representation is constructible or a DI identity.                                                       |
| DESIGN_PARAMETER_TYPES_METADATA                                 | Genuine constructor/method arrays, full/empty replacement, snapshots/freeze and ordinary typed set/decorator identity; MetadataTypes exact readonly value type.                                              | Own inherited read boundaries observed; constant-specific has/delete/dynamic operation cells need explicit completion.                 |
| Reflect.metadata factory and returned callback                  | CompilerMetadataContract all keys/shapes/target/location tables, atomicity/causes; ImportCompatibility fresh imports; DistributionContract side-effect/type-only/foreign cases.                              | Installed automatically, not exported as an arbitrary custom-write function. Retained isolated-realm coverage is not yet fully mapped. |

Runtime count from retained T-018 JSON, **per project**: AddressContract 49, CollectionOwnership 4,
CompilerMetadataContract 51, DefinitionContract 13, DiscoveryContract 10, DistributionContract 5,
ImportCompatibility 10, InheritanceContract 11, InstanceLookupContract 24, LegacyDecoratorContract 7:
**184 × 2 = 368**, 20 suite results, every assertion passed, zero pending/skipped. Counts are runner cases,
not a claim of 368 distinct ACs or exhaustive assertion quality. Shared source-root scenarios import only
`../../index.js`; genuine legacy/compiler and independent consumer fixtures use built `@glacier/reflection`,
never internal source imports. Native browser root delivery is a root-only import map; Node export-map enforcement
is independently observed. Type fixtures consume generated package-root declarations.

### T-019 erased type inventory

At attempt1 the barrel had **35 named erased exports**. `E` means the name was explicitly referenced in a passing independent
type fixture with accepted-use/type-equality and/or rejected-misuse checks. `T` means its behavior is exercised
transitively through signatures/unions and reviewed against its declaration, **not** a named-export sensitivity
test. T-017 recovery must add direct named accepted/rejected checks for all 13 T entries; a compiler merely loading
a declaration is not complete assertion evidence. All remain erased, regardless of V8's zero-counter file entries.

| Erased root export                      | Current independent evidence                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| IRuntimeType                            | E: MetadataTypes exact scalar/array inference, rejected objects/entries; DistributionTypes.                             |
| ICompilerMetadataDecorator              | E: MetadataTypes Reflect factory return equality; genuine compiler fixture types.                                       |
| ICompilerMetadataRejectionCode          | E: MetadataTypes exact four-code union.                                                                                 |
| IMetadataBoundaryErrorCode              | T: typed error constructor/codes; no direct named union/invalid-code guard.                                             |
| IClass                                  | E: AddressTypes inaccessible constructor identity, accepted mutations and rejected instances.                           |
| IConstructableClass                     | T: ConstructorParameters inference through IConstructorParameterMetadataAddress; no named root guard.                   |
| IMetadataKind                           | T: MetadataTypes exact class kind literals and identity contracts; no named union guard.                                |
| IMetadataSide                           | T: checked static/instance address branches; no named union guard.                                                      |
| IMetadataLookup                         | T: own/inherited read/discovery options and mutation-option rejection; no named readonly lookup check.                  |
| IMetadataDefinitionIdentity             | E: InstanceLookupTypes exact readonly identity array; rejected untyped set capability.                                  |
| IMethodKey                              | E: AddressTypes exact callable/optional/symbol key union.                                                               |
| IMethodParameters                       | E: AddressTypes exact final-overload tuple.                                                                             |
| IStaticMemberKey                        | E: AddressTypes exact static keys, excludes prototype.                                                                  |
| IParameterIndex                         | E: AddressTypes empty/fixed/optional/open tuples and finite-bound rejection.                                            |
| IMetadataClassAddress                   | T: explicit class address through unions/checked operations; no named root guard.                                       |
| IInstanceMemberMetadataAddress          | T: inherited/numeric/symbol member checks through instance union; no named alias check.                                 |
| IInstanceMethodParameterMetadataAddress | T: callable/fixed/rest instance positions through unions; no named alias check.                                         |
| IInstanceMetadataAddress                | E: InstanceLookupTypes equality with instance IMetadataReadAddress and restricted category checks.                      |
| IStaticMemberMetadataAddress            | T: static member keys/prototype rejection through class union; no named alias check.                                    |
| IStaticMethodParameterMetadataAddress   | T: every checked static tuple operation/bound rejection through class union; no named alias check.                      |
| IConstructorParameterMetadataAddress    | E: AddressTypes private/protected never, public finite/optional tuples.                                                 |
| IClassMetadataAddress                   | E: AddressTypes accepted checked address shared across all five operations and rejected finite keys/positions.          |
| IMetadataReadAddress                    | E: InstanceLookupTypes exact conditional instance branch, accepted constructor and erased dynamic paths.                |
| IDynamicInstanceMetadataAddress         | T: dynamic instance member/method branches through class union; no named instance-only exclusion guard.                 |
| IDynamicClassMetadataAddress            | E: AddressTypes complete explicit dynamic operations, erased names/positions and mutation shape guards.                 |
| IDiscoveredMetadataAddress              | E: AddressTypes/InstanceLookupTypes readonly canonical full union, dynamic round trips and rejected checked use.        |
| IMetadataAddressRejectionCode           | T: typed result unions and runtime exact codes; no direct named type union check.                                       |
| IMetadataAddressRejection               | T: isValid narrowing in outcome unions; no named readonly rejection/value-exclusion check.                              |
| IMetadataWriteResult                    | E: AddressTypes/MetadataTypes checked/dynamic return equalities and rejected value/address uses.                        |
| IMetadataRead                           | E: MetadataTypes inferred value/list/record/undefined, absence excludes value; DistributionTypes.                       |
| IMetadataPresenceResult                 | E: AddressTypes/MetadataTypes checked/dynamic return equality.                                                          |
| IMetadataDeletionResult                 | E: AddressTypes/MetadataTypes checked/dynamic return equality.                                                          |
| IMetadataLocationsResult                | E: AddressTypes/InstanceLookupTypes readonly canonical arrays/records and mutation rejection.                           |
| IMetadataDefinitionsResult              | E: AddressTypes/InstanceLookupTypes readonly identity arrays and no untyped write access.                               |
| ILegacyMetadataDecorator                | E: DecoratorTypes accepted legacy invocation shapes, void returns, rejected wrong values/standard contexts/replacement. |

Named type assertion evidence resides in
[MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts),
[AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts),
[InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts),
[DecoratorTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DecoratorTypes.test-d.ts) and
[DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts).
[AdoptionTypes](../../../packages/libraries/glacier-reflection/tests/data/examples/AdoptionTypes.ts) adds two
rejected-misuse example guards. T-019's fresh independent command passed unchanged fixtures; T-009/T-012/T-015/T-017
retain unsuppressed-misuse and unused-guard controls. No absent-name diagnostic or runtime percentage establishes
erased-contract correctness. Internal ITuplePosition/ICanonicalMetadataAddress/shared base are deliberately not
root exports; the ambient Reflect namespace declaration is checked through ICompilerMetadataDecorator.

### T-019 coverage findings and recovery

Source: T-017 `tests/artifacts/t017/attempt1/final-coverage.log`, `final-coverage-results.json` and
`coverage-snapshot/coverage-final.json` (51 included files). Passing cases do not override exit 1 on 100% thresholds.
The unchanged configuration includes index.ts/all src TypeScript, excludes only declaration files, collects V8
Node/Chromium and enforces per-file 100% of all four metrics. No skip/ignore/threshold remedy is authorized.

| Production path under L                                                 | Exact retained gap (T-017 coordinates)                                                                                                                     | Required fresh bounded recovery                                                                                                                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| src/domain/MetadataTarget.ts                                            | Statements 44/53; branches at 44 and classOfPrototype conditional 53. 95.12% statements / 93.33% branches / 97.05% lines.                                  | T-010: public malformed/proxy target and descriptor cases; review non-TypeError constructability rethrow/canonical mismatch reachability without invoking consumers. Remove truly redundant paths only if contract-preserving. |
| src/domain/MetadataStorage.ts                                           | Delete missing address within existing declaration map, statement/branch 83. 98.57% statements / 97.36% branches.                                          | T-010: delete an absent address while another address remains; assert false deletion and unchanged unrelated declarations/index.                                                                                               |
| src/domain/MetadataDefinitionOperations.ts                              | Decorator secondary normalization rejection statement/branch 146; 98% statements / 95% branches. Current corresponding statement is 192 after T-018 JSDoc. | T-010: analyze guard reachability through valid/invalid public decorator invocations; do not call internals or fabricate a type contract.                                                                                      |
| src/domain/MetadataDecorator.ts                                         | Statements 28,34,35,37,43; branches at 14,19,27,34,39,40,41. 78.26% statements / 65.71% branches / 77.27% lines.                                           | T-012: mapped public-root numeric/member/constructor/method success and invalid argument-count/key/descriptor/position cases already observed natively; preserve real emitted built-root fixture evidence.                     |
| src/domain/MetadataDiscovery.ts                                         | Private constructor function at 10, 66.66% functions. Current private constructor is 13 after JSDoc.                                                       | T-013: resolve dead executable private scaffolding while retaining approved private-constructor typing; if impossible without changing design, report decision for companion approval rather than exposing a test-only API.    |
| src/infrastructure/adapters/inbound/CompilerMetadataBridge.adapter.ts   | Statements 13,16,24,33,34; branches at 15,20,22,33. 76% statements / 60% branches / 77.27% lines.                                                          | T-016: mapped fresh import realms for throwing Reflect access, absent Reflect, accessor/foreign slot and defineProperty failure; retain descriptor preservation and safe causes.                                               |
| src/infrastructure/adapters/inbound/CompilerMetadataRecorder.adapter.ts | Statements 34/40; branches at 34/39/88. 94.44% statements / 90.62% branches / 96.87% lines.                                                                | T-016: dense-own/sparse/invalid-entry and error-category branches through ambient protocol; map native V8 output or source-equivalent assertions without private recorder access.                                              |

Branch maps contain missing `line` fields for some else arms; their enclosing branch coordinates above are used,
not invented line numbers. Existing real-realm assertions establish several failures behaviorally but do not merge
all those native executions into source-root counters. T-017 recovery must prove actual counter/source-map
combination (not averaging percentages), complete named operation/type evidence and normal uncached runtime
execution. T-018 then renews documentation/examples; T-019 attempt 2 rechecks this join. All attempts require new
workers; no recovery was dispatched or performed by this evidence worker.

T-010 attempt 2 subsequently resolved the three owned source rows: actual V8 counters for MetadataTarget,
MetadataStorage and MetadataDefinitionOperations are 100% in every metric. Reachable constructor/canonical
mismatch, missing-address deletion and secondary decorator rejection guards have public assertions; only the
intrinsically unreachable non-TypeError probe rethrow was removed. The original T-019 table remains historical,
not a claim of remaining gaps in those three files. Four other files still fail the scoped run, and the complete
native/operation/type join remains pending T-012/T-013/T-016/T-017/T-018 recoveries and T-019 attempt 2.

T-012 attempt 2 subsequently resolved MetadataDecorator through a separate source-root contract suite:
23/23 statements, 35/35 branches, 1/1 functions and 22/22 lines. Genuine built-root emission remains retained
and passing, without source/built identity mixing. Three other files still fail scoped coverage; T-013 is ready,
and T-016/T-017/T-018 recoveries plus T-019 attempt 2 remain required before acceptance.

T-013 attempt 2 verified all named discovery assertions again but cannot close the private-constructor row:
Discovery statements/branches/lines are 100%, functions are 2/3 (66.66%), and line 13 remains uncovered.
The explicit nonconstructible generated-root type assertion passes; bodyless/declare constructor syntax is rejected
and removing the private constructor exposes public construction. No production rewrite or policy workaround was
applied. That attempt stopped blocked; the subsequent explicit facade decision is now recorded in Plan approval.
The documentation repair resolved the design prerequisite only. T-013 attempt 3 subsequently implemented the
approved facade with meaningful readonly/freeze red, independent generated-root types and 268 scoped passes.
Both discovery production files now have actual mapped all-metric 100%; recovered T-010/T-012 files remain 100%.
Only the two compiler adapters fail this scoped coverage run. T-016 attempt 2 is dispatch-ready; T-017/T-018/T-019
renewal and full acceptance remain pending. No threshold or executable exclusion was changed.

T-010/T-012/T-013/T-016/T-017/T-018 statuses are reopened only for these bounded evidence/correction obligations.
Their successful earlier attempts remain in historical rows. T-011/T-014's earlier scoped integration and T-015's
meaningful pre-implementation red remain historical facts, not new final-revision coverage passes; renewed full
regression/type execution at T-017 checks their unaffected contracts after recoveries. Extra dependency edges
serialize recovery without pointing any earlier task to T-019 or T-021, so the DAG stays acyclic.
Public behavior corrections must observe new meaningful red first; unchanged signatures require independent
verification, not artificial red. A material design change stops that recovery for renewed approval.

### T-019 ADR and documentation review

The following is attempt1's retained review, not an assertion of present unresolved violations.

- ADR-0001: conforming for this bounded join; exactly the four approved package dev pins, no runtime dependencies,
  unchanged Node/pnpm/Chromium baseline. Remote CI/Snyk remain unobserved, not green.
- ADR-0002: conforming observed root-only exports, internal base/helpers not exposed, domain independent of inbound
  bridge, relative intra-package imports; independent consumers enforce package-root boundaries.
- ADR-0003: conforming for this documentation-only change and observed strict declarations/JSDoc; T-018's
  supported Turbo code gates are retained evidence, not freshly rerun full code gates here.
- ADR-0004: not applicable; no React component/hook/story introduced.
- ADR-0005: **violating final acceptance gate**, precisely seven coverage files above; missing explicit
  class/constant operation cells and indirect-only named type checks prevent asserting exhaustive AC-026 quality.
  Public-boundary ownership/discovery/Chromium/type separation otherwise observed conforming.
- ADR-0006: conforming process for this attempt: approved in-flight branch, fresh bounded nonrecursive sole writer,
  preserved failed gates, no Git/main-integration/archive authorization inferred, no human acceptance substituted.
- ADR-0007: conforming library-only applicability; no application/service inventory/catalog/E2E invented.
  Plan retains E2E inapplicability; implemented library links live here under authorized Tasks ownership.
- ADR-0008: conforming stable IDs/history and explicit serial recovery sequence; no Brief/Plan edit or requirement
  redefinition. Current Plan's planned test-path prose is not represented as implemented links; the real links
  above are the evidence handoff for any separately authorized closure/companion update.

README and all five T-018 lasting notes agree on root ESM/erasure/import effects/shallow ownership/instance limits,
commands, configured-but-unobserved CI and failing final coverage. No companion discrepancy requiring an
unauthorized edit was found. This is AI review assistance, not human acceptance or complete T-022 final review.

## Completed records (observed, not historical dispatch)

| Task IDs | Observed evidence                                                                                                                                                        | Worker history                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| T-001    | Current guidance/ADR/repository inspection and user-confirmed branch adoption                                                                                            | This document-authoring attempt only; no historical branching worker asserted                            |
| T-002    | Current brief/plan/index alignment                                                                                                                                       | Prior editing worker not established                                                                     |
| T-003    | Linked plan approval record                                                                                                                                              | No approval worker inferred                                                                              |
| T-005    | Current library-only scope and applicability rationale                                                                                                                   | No test execution inferred                                                                               |
| T-004    | Authorized dependency-note alignment and documentation checks, attempt 1 / W-001                                                                                         | One fresh bounded worker; no historical attempt invented                                                 |
| T-006    | Nonbehavioral package/configuration and compiler inputs, attempt 1 / W-002                                                                                               | One fresh bounded worker; unsupported-runtime diagnostics only                                           |
| T-007    | Supported local runtime, exact pins/install, Turbo/CI wiring, attempt 1 / W-003                                                                                          | One fresh bounded worker; no harness or public-contract coverage claim                                   |
| T-008    | Actual Node/Chromium discovery, independent types/emission, negative and complementary coverage controls, attempt 1 / W-004                                              | One fresh bounded worker; controls removed, no metadata API red/coverage claim                           |
| T-009    | Fixture-first exact declaration bootstrap, independent diagnostics/unused-error guard and Node/Chromium intended assertion failures, attempt 2 / W-005                   | One fresh bounded worker; no runtime success implementation or initial type-red claim                    |
| T-010    | Typed class-local storage/address/instance normalization; 172 Node/Chromium passes and independent types/Turbo gates, attempt 1 / W-006                                  | One fresh bounded worker; scoped coverage failure retained, no final acceptance claim                    |
| T-011    | Intended inheritance/ownership red, four domain implementations, 202 Node/Chromium passes and independent types/Turbo gates, attempt 1 / W-007                           | One fresh bounded worker; no decorators, new type behavior or final coverage claim                       |
| T-012    | Meaningful genuine-decorator assertion red, all legacy locations/creation ownership, 216 Node/Chromium passes and independent types/Turbo gates, attempt 1 / W-008       | One fresh bounded worker; scoped coverage failure retained, no compiler activation or final acceptance   |
| T-013    | Intended discovery freezing red, canonical identity/location contracts, 234 Node/Chromium passes and independent types/Turbo gates, attempt 1 / W-009                    | One fresh bounded worker; unchanged coverage failure retained, no compiler activation/final acceptance   |
| T-014    | Joined decorator/direct/discovery ownership and rejection contracts, 236 Node/Chromium passes and independent types/Turbo gates, attempt 1 / W-010                       | One fresh bounded worker; fixture module correction and unchanged coverage failure retained              |
| T-015    | Genuine compiler/native-realm import red: 112 assertion failures, 238 passes, independent compiler types and nine Turbo gates, attempt 1 / W-011                         | One fresh bounded worker; no compiler bridge/activation implementation or coverage acceptance            |
| T-016    | Automatic compiler activation/atomic boundary contracts, 358 Node/Chromium passes, independent types and nine Turbo gates, attempt 1 / W-012                             | One fresh bounded worker; necessary legacy fixture identity correction; mapped coverage failure retained |
| T-017    | Independent generated-root Node/Chromium consumers, bundle/type sensitivity controls, 368 native passes and package-local standard runner integration, attempt 1 / W-013 | One fresh bounded worker; unchanged coverage gate fails; CI execution/final acceptance not claimed       |
| T-018    | Checked adoption/DI-foundation examples, 28 native checks per runtime, 368 regression passes, independent types, nine Turbo gates and lasting docs, attempt 1 / W-014    | One fresh bounded sole writer; JSDoc-only production edits; no final coverage/CI/acceptance claim        |
| T-010    | Recovery attempt 2 / W-006-R: 256 scoped Node/Chromium passes, independent types/eight Turbo gates, all three owned production files at 100% in all four V8 metrics      | One fresh bounded sole writer; other-file coverage failures retained, no final acceptance or Git action  |

The deleted note did not supply stable numbered historical execution waves. None are fabricated here.
Completed attempts are excluded from future dispatch; their task dependencies remain recorded above.
Reopened IDs retain their completed attempt evidence here without claiming renewed readiness.

### Completed execution waves

| Wave/order                  | Task IDs | Exact concurrent workers                    | Prerequisites                                                                       | Owned files/resources                                                                                                                                                                                                                                                                                                                                                                                                                       | Concurrency rationale                                                                                                                                                                               |
| --------------------------- | -------- | ------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-001 / 1                   | T-004    | 1 fresh worker after explicit authorization | T-003 done; companion-note edits explicitly authorized                              | `.docs/Architecture/Dependencies/Workspace Dependencies.md`, `.docs/Architecture/Dependencies/Frontend Dependencies.md`, `.docs/Stories/glacier-reflection/Tasks.md`                                                                                                                                                                                                                                                                        | Shared documents serialized; attempt 1 completed before W-002                                                                                                                                       |
| W-002 / 2                   | T-006    | 1 fresh bounded worker                      | T-003, T-004, T-005 done                                                            | L package.json, index.ts, tsconfig*.json, vitest.config.ts, tests/data/compiler; S; ignored build/compiler diagnostics                                                                                                                                                                                                                                                                                                                      | Single manifest/export/config and evidence writer; no API behavior                                                                                                                                  |
| W-003 / 3                   | T-007    | 1 fresh bounded worker                      | T-006 done                                                                          | L package.json; root package.json, pnpm-lock.yaml, turbo.json, .github/workflows/quality.yml; S; session-local runtime/dependencies/Chromium/generated diagnostics                                                                                                                                                                                                                                                                          | Single manifest/lock/install/CI writer; attempt 1 completed before W-004                                                                                                                            |
| W-004 / 4                   | T-008    | 1 fresh bounded worker                      | T-006, T-007 done                                                                   | L test configuration, tests/scenarios, tests/contracts, tests/data, tests/artifacts; temporary src/root controls; S                                                                                                                                                                                                                                                                                                                         | Single lifecycle/coverage/evidence owner; controls removed before W-005                                                                                                                             |
| W-005 / 5.2, attempt 2      | T-009    | 1 fresh bounded worker                      | T-008 done; W-005-R repair checked; approved dated exception                        | L exact six T-009 contract suites, tests/data/ContractTarget.ts, tests/artifacts; approved nonbehavioral src/domain declarations and index.ts; S                                                                                                                                                                                                                                                                                            | Fixtures authored first, declarations second, independent types and meaningful dual-runtime assertion red observed; no implementation/Git writes                                                    |
| W-006 / 6, attempt 1        | T-010    | 1 fresh bounded worker                      | T-009 done; scoped intended runtime red rechecked                                   | L `src/domain/`, existing three T-009 runtime suites for plan-preserving corrections, `tests/artifacts/`; S                                                                                                                                                                                                                                                                                                                                 | Single storage/normalizer/evidence owner; public types/root exports unchanged; scoped runtime green, final coverage deferred                                                                        |
| W-007 / 7, attempt 1        | T-011    | 1 fresh bounded worker                      | T-010 done; intended inheritance/ownership red observed                             | L four relevant `src/domain/` files, `tests/scenarios/InheritanceContract.test.ts`, `CollectionOwnership.test.ts`, ignored `tests/artifacts/t011/attempt1/`; S                                                                                                                                                                                                                                                                              | Single inheritance/storage/evidence owner; 202 dual-runtime passes, decorators/final coverage deferred                                                                                              |
| W-008 / 8, attempt 1        | T-012    | 1 fresh bounded worker                      | T-011 done; intended legacy-decorator assertion red observed                        | L task-relevant `src/domain/`, `index.ts`, `tests/scenarios/LegacyDecoratorContract.test.ts`, `tests/contracts/DecoratorTypes.test-d.ts`, `tests/data/`, ignored `tests/artifacts/t012/attempt1/`; S                                                                                                                                                                                                                                        | Single decorator/error/root-export/evidence owner; 216 dual-runtime passes, compiler activation/final coverage deferred                                                                             |
| W-009 / 9, attempt 1        | T-013    | 1 fresh bounded worker                      | T-012 done; intended discovery freezing red observed                                | L `src/domain/MetadataStorage.ts`, `tests/scenarios/DiscoveryContract.test.ts`, `tests/contracts/InstanceLookupTypes.test-d.ts`, ignored `tests/artifacts/t013/attempt1/`; S                                                                                                                                                                                                                                                                | Single shared-index/evidence owner; 234 dual-runtime passes, compiler activation/final coverage deferred                                                                                            |
| W-010 / 10, attempt 1       | T-014    | 1 fresh bounded worker                      | T-012, T-013 done                                                                   | L existing DiscoveryContract/LegacyDecoratorContract suites, ignored `tests/artifacts/t014/attempt1/`; S                                                                                                                                                                                                                                                                                                                                    | Single integration/evidence owner; 236 dual-runtime passes, no production change; final coverage deferred                                                                                           |
| W-011 / 11, attempt 1       | T-015    | 1 fresh bounded worker                      | T-014 done; approved first compiler declarations                                    | L CompilerMetadataContract/ImportCompatibility, MetadataTypes, tests/data compiler/native-realm helpers, six nonbehavioral compiler declaration/constant files and index.ts; tests/artifacts/t015/attempt1; S                                                                                                                                                                                                                               | Single fresh-process/native-realm/evidence owner; meaningful runtime red observed; activation/coverage deferred                                                                                     |
| W-012 / 12, attempt 1       | T-016    | 1 fresh bounded worker                      | T-015 done; genuine compiler/import assertion red verified                          | L two inbound compiler adapters, index.ts, established CompilerMetadataContract and necessary LegacyDecoratorContract identity/discovery corrections; ignored tests/artifacts/t016/attempt1; S                                                                                                                                                                                                                                              | Single activation/root/global-boundary/evidence owner; 358 dual-runtime passes; mapped coverage and normal full-gate integration deferred                                                           |
| W-013 / 13, attempt 1       | T-017    | 1 fresh bounded worker                      | T-016 done; package-local native-integration failure demonstrated before correction | L DistributionContract, DistributionTypes, independent consumer fixtures/preparation and native delivery helpers under tests/data, package.json scripts; ignored tests/artifacts/t017/attempt1 and dist; S                                                                                                                                                                                                                                  | Single distribution/build/evidence owner; 368 native passes, standard integration fixed locally, mapped coverage failure retained                                                                   |
| W-014 / 14, attempt 1       | T-018    | 1 fresh bounded worker                      | T-017 done; exact approved documentation/example scope                              | L README, existing src JSDoc only, checked tests/data examples and ignored generated artifacts; authorized Workspace Techstack, both dependency notes, Engineering Guidelines/CI Overview; S                                                                                                                                                                                                                                                | Single documentation/example/build/evidence owner; 28 checks per native runtime, unchanged 368 regressions; final coverage pending                                                                  |
| W-006-R / 15.1, attempt 2   | T-010    | 1 fresh bounded worker                      | T-009 done; retained exact coverage findings; approved unchanged contracts          | L src/domain/MetadataTarget.ts; tests/scenarios/AddressContract.test.ts, InstanceLookupContract.test.ts, DefinitionContract.test.ts; ignored L tests/artifacts/t010/attempt2 and generated dist; S                                                                                                                                                                                                                                          | Serial target/assertion/evidence owner; storage/operations unchanged; 256 scoped passes and three owned production files fully covered                                                              |
| W-008-R / 15.2, attempt 2   | T-012    | 1 fresh bounded worker                      | T-010 recovery done; T-011 historical green retained                                | L new tests/scenarios/DecoratorMappedContract.test.ts; ignored L tests/artifacts/t012/attempt2, generated dist; S                                                                                                                                                                                                                                                                                                                           | Serial mapped assertion/evidence owner; no production edits; 264 scoped passes, MetadataDecorator fully covered, three other-file failures retained                                                 |
| W-009-R / 15.3.2, attempt 3 | T-013    | 1 fresh bounded worker                      | T-012 recovery done; W-009-F repair verified; explicit facade approval in Plan      | L MetadataDiscovery.ts/MetadataDiscoveryOperations.ts under src/domain; DiscoveryContract.test.ts; InstanceLookupTypes.test-d.ts/DistributionTypes.test-d.ts; ignored tests/artifacts/t013/attempt3 and generated dist; S                                                                                                                                                                                                                   | Serial facade/assertion/type/evidence owner; intended readonly/freeze red, 268 scoped passes, both discovery files fully covered; two compiler gaps retained                                        |
| W-012-R / 15.4, attempt 2   | T-016    | 1 fresh bounded worker                      | T-013 recovery done; T-015 red retained                                             | L CompilerMetadataContract.test.ts, ImportCompatibility.test.ts, compiler/CompilerContractProbe.ts; ignored tests/artifacts/t016/attempt2, dist; S                                                                                                                                                                                                                                                                                          | 410/410 native assertions, all gates pass; bridge mapping blocked, unsuccessful dist/autoAttach experiment restored without production/configuration changes                                        |
| W-012-R / 15.4, attempt 3   | T-016    | 1 fresh bounded worker; sole S writer       | T-013 recovery done; T-015 red retained; explicit user recovery dispatch            | Authorized scope: L two inbound compiler adapters; CompilerMetadataContract.test.ts, ImportCompatibility.test.ts; CompilerContractRun.ts, FreshCompilerRealm.ts, CompilerRealmServer.ts, compiler/CompilerContractProbe.ts; vitest.config.ts only validated collection preserving discovery/thresholds; ignored tests/artifacts/t016/attempt3, dist; S. Actual authored changes: FreshCompilerRealm.ts, ImportCompatibility.test.ts, S only | Serial complementary source-origin Chromium plus preserved native Node/Chromium recovery; 430/430, genuine raw V8 and 100% all-file/overall metrics, Node-only negative gate preserved; T-017 ready |

### T-013 blocked recovery history

| Wave/order                | Task IDs | Exact concurrent workers | Prerequisites        | Owned files/resources                                                                                         | Observed outcome                                                                                                                                                      |
| ------------------------- | -------- | ------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-009-R / 15.3, attempt 2 | T-013    | 1 fresh bounded worker   | T-012 attempt 2 done | Authored only InstanceLookupTypes.test-d.ts and S; ignored L tests/artifacts/t013/attempt2 and generated dist | 264 scoped Node/Chromium passes, independent types/eight Turbo gates pass; Discovery private constructor remains uncovered, design decision blocks recovery and T-016 |

### T-013 prerequisite facade repair history

| Wave/order                         | Task association                             | Exact concurrent workers             | Prerequisites                                                                          | Owned files/resources                                                                           | Observed outcome                                                                                                                                    |
| ---------------------------------- | -------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-009-F / 15.3.1, repair attempt 1 | T-013 prerequisite documentation repair only | 1 fresh bounded documentation worker | T-012 recovery done; failed T-013 attempt 2; explicit facade decision in Plan approval | `.docs/Stories/glacier-reflection/Plan.md`, S only; ADR-0003 read-only after conformance review | Approved nonconstructible readonly facade specified; historical failures preserved; no source/test/runtime/Git changes or implementation completion |

Repair validation covers documentation formatting/whitespace, relative links/anchors, all 27 criterion mappings,
29 stable task records, acyclic dependencies, every remaining actionable task exactly once and earlier-wave
readiness with exact serial/human-wait counts. ADR-0001/0002 conform: unchanged dependencies/runtime and curated
root/inward domain boundary; ADR-0003 conforms through static class behavior and a camelCase record binding
exported under the existing public alias, with no new standalone substantial function or artificial instance state.
ADR-0004 is inapplicable (no React). ADR-0005 remains binding: strict public-root assertions, independent types,
unchanged 100% gates; its outstanding implementation acceptance blocker is not waived by documentation.
ADR-0006/0008 conform through explicit dated material-design approval, stable evidence and a fresh single-writer
repair/retry sequence, with no Git/acceptance permissions inferred. ADR-0007 retains library-only E2E/catalog
inapplicability. README/JSDoc and other lasting companions are not edited here; T-018 receives the bounded renewal
scope below. These findings are repair conformance, not T-022 final review or a full code-gate result.

Observed repair checks: session-local Node 24.21.0/pnpm Oxfmt write/check passed for Plan.md and Tasks.md;
git diff --check passed. The inline python3 validator confirmed 29 stable tasks, an acyclic DAG, 15 unique
remaining ordered waves with exact worker/human-wait counts, all 27 mappings and 160 relative links/anchors.
Its first worker-count assertion mishandled padded existing table cells; corrected only the validator and reran
successfully. No code/type/runtime/coverage gate was executed. This worker authored only Plan.md and Tasks.md;
ADR-0003, Brief.md, all source/tests/manifests/dependencies and Git state were preserved.

### T-017 renewed completed wave

| Wave/order                | Task IDs | Exact concurrent workers              | Prerequisites                                            | Owned files/resources                                                                                                                                                                                                                                                                                                                                    | Concurrency rationale                                                                                                                             |
| ------------------------- | -------- | ------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-013-R / 15.5, attempt 2 | T-017    | 1 fresh bounded worker; sole S writer | T-016 attempt3 done; earlier recovery barriers satisfied | Actual authored writes: L tests/contracts/DistributionTypes.test-d.ts, tests/scenarios/PublicOperationMatrix.test.ts, tests/data/DistributionContractPrepare.ts, FreshCompilerRealm.ts, CompilerRealmServer.ts; S. Generated L dist, tests/artifacts/t017/attempt2 and normal coverage/native outputs. No production/configuration/manifest/root writes. | Serial 35-erased-type/eight-runtime/ten-operation accounting; 556/556 native/source cases and genuine all-file/overall 100% coverage; T-018 ready |

### T-018 renewed completed wave

| Wave/order                | Task IDs | Exact concurrent workers              | Prerequisites       | Owned files/resources                                                                                                                                                                                                              | Observed outcome                                                                                                                                                                                   |
| ------------------------- | -------- | ------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-014-R / 15.6, attempt 2 | T-018    | 1 fresh bounded worker; sole S writer | T-017 attempt2 done | Authored L README.md, JSDoc only in src/domain/MetadataDiscovery.ts and MetadataDiscoveryOperations.ts; S. Existing examples and five lasting notes read-only. Generated L dist/tests/artifacts/t018/attempt2; routine Turbo logs. | Four classes/one frozen facade/three instances documented; 28 native checks per runtime, copied contracts/example types and eight forced gates pass; retained coverage not misrepresented as fresh |

### T-019 blocked attempt history

| Wave/order            | Task IDs | Exact concurrent workers | Prerequisites                          | Owned files/resources                                                                                   | Observed outcome                                                                                                                                                                 |
| --------------------- | -------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-015 / 15, attempt 1 | T-019    | 1 fresh bounded worker   | T-017/T-018 attempt 1 done at dispatch | Read-only authored workspace/Brief/Plan; S only authored write; ignored L tests/artifacts/t019/attempt1 | Complete accounting of 27 criteria, eight runtime exports/ten inherited operations and 35 erased types; fresh independent types pass; AC-026 unmet, recovery/dependents blocked. |

### T-019 renewed completed wave

| Wave/order              | Task IDs | Exact concurrent workers              | Prerequisites                                         | Owned files/resources                                                                                                     | Observed outcome                                                                                                                                                                                                                                            |
| ----------------------- | -------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-015 / 15.7, attempt 2 | T-019    | 1 fresh bounded worker; sole S writer | T-017/T-018 attempt2 done; recovery barriers verified | Read-only authored workspace/Brief/Plan/tests/ADRs; S only authored write; generated L tests/artifacts/t019/attempt2 only | All 27 criteria, eight runtime values, 60 operation cells and 35 directly named erased contracts rejoined; retained 556/556 and real 100% counters audited; fresh isolated types/examples and sensitivity pass; T-020 dependency-ready, permission-blocked. |

### T-020 completed current-main inspection wave

| Wave/order            | Task IDs | Exact concurrent workers              | Prerequisites                                                        | Owned files/resources                                                                                                             | Observed outcome                                                                                                    |
| --------------------- | -------- | ------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| W-016 / 16, attempt 1 | T-020    | 1 fresh bounded worker; sole S writer | T-019 done; explicit fetch/inclusion and conditional checks approval | S only authored write; authorized fetch of origin/main/FETCH_HEAD; all other authored files, branch, HEAD and Git index read-only | Fresh main already included; protected dirty work unchanged; no integration; T-021 ready under conditional approval |

### T-021 completed final local verification wave

| Wave/order            | Task IDs | Exact concurrent workers              | Prerequisites                                                        | Owned files/resources                                                                                                  | Observed outcome                                                                                                                      |
| --------------------- | -------- | ------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| W-017 / 17, attempt 1 | T-021    | 1 fresh bounded worker; sole S writer | T-020 done; explicit conditional final-verification approval applies | S only authored write; read-only workspace; root/L dist, Turbo logs and test artifacts; native Node/Chromium resources | Fresh check, forced complete 556/556 native cases, all-file/overall 100% genuine V8 and ten uncached non-test gates pass; T-022 ready |

### T-022 blocked manual-review history

| Wave/order            | Task IDs | Exact concurrent workers              | Prerequisites                             | Owned files/resources                                                                                                                        | Observed outcome and serialization                                                                                                                     |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W-018 / 18, attempt 1 | T-022    | 1 fresh bounded worker; sole S writer | T-021 attempt1 complete at fixed revision | Read-only whole story/source/tests/dependencies/ADRs/docs and retained gates; S only authored write; generated tests/artifacts/t022/attempt1 | F-022-001 reproduced through built public root; no implementation fix; T-016/T-019/T-021 reopened and T-022/T-023 blocked; serialized recovery follows |

Completed T-017/T-018/T-020 records remain historical fixed-revision observations despite reopened upstream
prerequisites; they are not new dispatches or a claim of current closure readiness. T-020's then-ready T-021
statement is superseded by this review's correction/join prerequisites. Recovery reuses stable task IDs and
retains all previous successful/failed attempts; later current-main freshness and permission gates still apply.

### T-009 attempt and prerequisite-repair history

| Wave/order                      | Task association                                                              | Exact concurrent workers             | Prerequisites                                                                          | Owned files/resources                                                                                                                            | Observed outcome and serialization                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| W-005 / 5, attempt 1            | T-009, blocked historical attempt, not remaining dispatch                     | 1 fresh bounded worker               | T-008 done; original approval                                                          | Read-only library/story inspection; S; ignored L `tests/artifacts/t009/readiness.log`                                                            | Stopped before tests/declarations at type-red conflict; historical evidence retained above. |
| W-005-R / 5.1, repair attempt 1 | T-009 prerequisite documentation repair only, not another implementation task | 1 fresh bounded documentation worker | T-008 done; explicit dated exception decision in Plan approval; failed T-009 attempt 1 | `.docs/Architecture/Decisions/ADR-0006-Workflow.md`, `.docs/Stories/glacier-reflection/Plan.md`, S; ADR-0005 read-only after finding no conflict | Sole document/evidence writer before W-005 retry; no code/test/dependency/Git changes.      |

The repair changes only the first-declaration verification sequence, not signatures, criteria or dependencies.
Repair attempt 1 checks passed on session-local Node v24.21.0 / pnpm 11.9.0: changed-file
`pnpm exec oxfmt --write` followed by `pnpm exec oxfmt --check` on the three changed notes, and an inline python3
validator of 29 stable task IDs, an acyclic DAG, all 21 remaining tasks exactly once in W-005 attempt 2 through
W-025 with earlier prerequisites, exact serial worker counts/ownership and human waits, all 27 criterion mappings,
92 relative links/anchors, eight accepted ADR identities/index entries/sections and whitespace consistency.
ADR-0001 conforms: no dependency, runtime or technology change. ADR-0002/0003 conform: public-root boundaries,
approved signatures and strict contracts remain unchanged; documentation uses existing Oxfmt defaults.
ADR-0004 is inapplicable to this non-React documentation repair. ADR-0005 conforms without edits: independent
type checking, erased-type limits and meaningful runtime assertions/coverage requirements are preserved.
ADR-0006 conforms through the explicitly authorized, dated one-story exception, fixture-first evidence obligation,
unchanged runtime/later-type-change red and separate authorization gates. ADR-0007 conforms through preserved
library-only E2E/catalog inapplicability; ADR-0008 conforms through distinct document ownership, stable task IDs,
dated plan approval and the single-writer repair/history/retry sequence. No API tests, runtime red,
type verification, final acceptance or Git authorization is inferred from the repair. W-005 attempt 2 subsequently
completed T-009 as recorded above; the historical failed attempt and repair are not duplicate remaining tasks.

### T-016 cause-preservation recovery completed wave

| Wave/order     | Task IDs | Exact concurrent workers | Prerequisites                                       | Owned files/resources                                                                                                                                                                         | Observed outcome                                                                 |
| -------------- | -------- | ------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| W-018-F / 18.1 | T-016    | 1 fresh bounded worker   | T-015/T-013 done; approved F-022-001 recovery scope | L src/infrastructure/adapters/inbound/CompilerMetadataRecorder.adapter.ts, tests/scenarios/CompilerMetadataContract.test.ts; S; generated dist/native/coverage; tests/artifacts/t016/attempt4 | Attempt4 done: intended dual-runtime red, 570 green, 100% mapped V8; T-019 ready |

### T-019 cause-preservation evidence renewal completed wave

| Wave/order                | Task IDs | Exact concurrent workers              | Prerequisites                                      | Owned files/resources                                                                                     | Observed outcome                                                                                                                                                                                   |
| ------------------------- | -------- | ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W-018-J / 18.2, attempt 3 | T-019    | 1 fresh bounded worker; sole S writer | T-016 attempt4 done; retained T-017/T-018 evidence | Read-only whole authored workspace; S only authored write; generated L tests/artifacts/t019/attempt3 only | Corrected AC-022/026 causes/atomicity, 27 criteria/eight values/60 cells/35 types rejoined; retained 570/570 and true 100% audited; fresh independent types/sensitivity pass; T-021 attempt2 ready |

### T-021 corrected-revision automated verification completed wave

| Wave/order                | Task IDs | Exact concurrent workers              | Prerequisites                                                       | Owned files/resources                                                                                                                              | Observed outcome                                                                                                                              |
| ------------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| W-018-V / 18.3, attempt 2 | T-021    | 1 fresh bounded worker; sole S writer | T-019 attempt3 done; T-020 included main; conditional authorization | Read-only authored workspace; S only authored write; root/L dist, .turbo and test artifacts including tests/artifacts/t021/attempt2; Node/Chromium | Complete check, zero-cache forced tests/non-test gates; 570/570, all-file/overall true 100%; 496 protected files/index unchanged; T-022 ready |

### T-022 corrected-revision manual review completed wave

| Wave/order                | Task IDs | Exact concurrent workers              | Prerequisites       | Owned files/resources                                                                                                                            | Observed outcome                                                                                                  |
| ------------------------- | -------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| W-018-R / 18.4, attempt 2 | T-022    | 1 fresh bounded worker; sole S writer | T-021 attempt2 done | Read-only corrected implementation/tests/ADRs/approvals/dependencies/docs; S only authored write; generated L tests/artifacts/t022/attempt2 only | All eight ADR outcomes recorded; F-022-001 resolved; no new findings; T-023 awaits explicit closure authorization |

### T-023 authorized closure completed wave

| Wave/order            | Task IDs | Exact concurrent workers              | Prerequisites                                                      | Owned files/resources                                                                                                                                                                                 | Observed outcome                                                                                                                         |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| W-019 / 19, attempt 1 | T-023    | 1 fresh bounded worker; sole S writer | T-021/T-022 attempt2 done; explicit closure/archival authorization | Three reflection notes moved from Stories to Archive; Stories/Archive indexes; link-only repairs in ADR-0006, Engineering Guidelines/CI and package README; generated L tests/artifacts/t023/attempt1 | Real implemented-test links, preserved E2E/criteria/history, affected formatting/link/protected-state checks pass; T-024 permission wait |

## Execution sequence

`L` below means exactly `packages/libraries/glacier-reflection`. `S` means exactly
`.docs/Archive/glacier-reflection/Tasks.md`, the current single-writer evidence resource.
Completed historical waves used `.docs/Stories/glacier-reflection/Tasks.md` before authorized T-023 archival;
their original commands and ownership paths remain historical evidence, not live relative links.
Directory scopes include only task-relevant files under that directory, not permission for arbitrary additions.
Future source/test paths below remain plain code; T-009's authored public-contract suites are linked in its evidence.
All prerequisite IDs must be completed before dispatch; a whole-wave barrier applies.

| Wave/order | Task IDs | Exact concurrent workers                                      | Prerequisites                                                                 | Owned files/resources                                                                                                                       | Concurrency rationale                                                           |
| ---------- | -------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| W-020 / 20 | T-024    | 0 while waiting; fresh 1 after authorization for verification | T-023                                                                         | Read-only verified diff/Git state; archived Tasks.md authorization evidence                                                                 | Human decides commit permission, worker verifies scope only                     |
| W-021 / 21 | T-025    | 1                                                             | T-024                                                                         | Authorized story changes only, Git index/commits, Husky/lint-staged resources; archived Tasks.md                                            | Single Git writer; hooks never bypassed                                         |
| W-022 / 22 | T-026    | 0 while waiting; fresh 1 after authorization for verification | T-025; explicit publication permission                                        | Story branch remote push; one GitHub PR targeting main; archived Tasks.md evidence                                                          | Separate human publication gate and serialized remote mutation                  |
| W-023 / 23 | T-027    | 0 while waiting; fresh 1 after authorization for verification | T-026; owner-provided scans/checks and any correction commit/push permissions | Git refs/authorized story-owned conflicts or fixes, same PR/review threads, Actions/Snyk readout; root/L check artifacts; archived Tasks.md | Serial freshness/feedback loop; CI service jobs are not concurrent task workers |
| W-024 / 24 | T-028    | 0 while waiting; fresh 1 after authorization for verification | T-027; exact-revision human acceptance and merge permission                   | Read-only current PR SHA/checks/criteria; archived Tasks.md decision evidence                                                               | Human acceptance is not agent approval                                          |
| W-025 / 25 | T-029    | 1                                                             | T-028; unchanged SHA, passing checks, fresh main inclusion                    | Read-only Git freshness; GitHub merge-commit operation and confirmation for same PR into main                                               | One authorized merge worker; stop on stale revision; no post-merge note commit  |

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
- [Stories](../../Stories/Index.md)
- [Archive](../Index.md)
- [ADR-0005: Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
- [ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)
