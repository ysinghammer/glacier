---
created: 2026-10-04
tags:
  - story
---

# Glacier reflection - Tasks

This document owns execution, not requirements or design. Tasks derive from the [plan](Plan.md) and
[brief](Brief.md), following [ADR-0006](../../Architecture/Decisions/ADR-0006-Workflow.md) and
[ADR-0008](../../Architecture/Decisions/ADR-0008-Story-documentation.md). Joint approval belongs in the
[plan's approval record](Plan.md#approval); drafting these tasks does not authorize implementation or later workflow gates.

Brief.md includes the instance-lookup clarification and AC-027; companion references and the story index are aligned.
Joint approval is recorded in Plan.md#approval. Metadata implementation remains dependent on the executable
harness gate at T-008. Planned test filenames are not links to implemented evidence.

## Execution and agent coordination

The plan's cross-step order remains **P-001 -> P-002 -> P-003 -> P-004 -> P-005 -> P-006 -> P-007 -> P-008**.
Parallelism below is within those steps, not permission to bypass their prerequisites or approval.

| Lane/wave                    | Tasks                                              | Parallel work and join condition                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisites                | T-002, T-003, T-004                                | Align the brief before joint approval. Dependency/scope decisions may be discussed alongside approval, but no implementation starts until T-003, T-004 and T-005 are done.                                                                                                                |
| Tooling, P-002               | T-006 and T-007; then T-008                        | Package-local scaffolding and workspace/CI wiring can use separate agents after agreeing scripts, outputs and dependency pins. Join before demonstrating the executable harness and negative coverage controls.                                                                           |
| Definitions, P-003           | T-009; then T-010                                  | Type-contract and runtime-test authoring can be divided by file within T-009. Observe intended failures before T-010; one agent owns shared normalization, storage and public exports.                                                                                                    |
| Inheritance, P-004           | T-011                                              | Sequential after the definition foundation. Partition scenario authoring if useful, but keep shared storage/inheritance implementation under one owner.                                                                                                                                   |
| Decorators/discovery, P-005  | T-012 and T-013; then T-014                        | Independent agents can own the legacy adapter and discovery behavior/tests against the established foundation. Neither changes shared storage, normalization or the barrel without coordinator handoff. Join and verify direct/decorator/discovery interoperability before compiler work. |
| Compiler, P-006              | T-015; then T-016                                  | Node-process and browser-realm fixture/test authoring can run in parallel within T-015 with separate files and artifact paths. Global installation, predefined constants and atomic recorder implementation remain one coordinated sequence after observed failures.                      |
| Distribution/adoption, P-007 | T-017 and T-018; then T-019                        | Built-package consumers and checked examples/lasting documentation can be separate agents once compiler integration passes. Both must finish before current-main validation.                                                                                                              |
| Review preparation, P-008    | T-020; then T-021 and T-022; then T-023            | Integrate current main first. Automated gates and read-only manual review can run together against a fixed revision with no concurrent edits. Closure follows both.                                                                                                                       |
| Commit/publication/review    | T-024 -> T-025 -> T-026 -> T-027 -> T-028 -> T-029 | Separate explicit permissions and current-revision evidence make this sequence mandatory. CI jobs may run concurrently; acceptance/merge gates wait for their results.                                                                                                                    |

All agents work on the confirmed story branch; this document does not authorize additional branches, worktrees,
commits or publication. In the shared checkout, assign nonoverlapping file ownership before concurrent edits.
The coordinator owns the root barrel, shared storage/normalizer, manifests, lockfile, Turbo/CI configuration,
story records and integration. Serialize installs, builds/fixture generation and any coverage runs sharing output
directories; isolated runners must use distinct artifacts. Agree interfaces from the approved plan, not new agent
designs. Interface changes, file conflicts or material behavioral changes stop dependent work until coordinated
and, where required, reapproved.

Each public behavior/type-contract slice follows **test -> observed intended failure -> implementation -> passing
checks -> refactor**. A task containing the full cycle must retain its red and green evidence separately.
Missing exports/tooling or startup errors alone are not intended contract failures. A dependent implementation
must not start merely because tests have been authored.

## Task records

### T-001 - Review guidance and confirm in-flight story adoption

- Status: done
- Source: P-001; ADR-0006 discovery/isolation; ADR-0008 task authoring.
- Dependencies: None.
- Completion condition: Read guidance and all active ADRs, inspect story/tooling facts and working-tree state,
  and obtain confirmation that existing work belongs to this story branch.
- Evidence: On 2026-10-04, read AGENTS.md, Home.md, the decisions index and accepted ADR-0001 through ADR-0008,
  the story brief/plan, task template, workspace manifests, compiler/Turbo configuration and quality workflow.
  Git reported `feature/glacier-reflection` with only the story directory untracked before drafting.
  The user explicitly confirmed the existing branch/story association and authorized creating Tasks.md while
  preserving Brief.md/Plan.md. This is in-flight adoption, not proof of historical fresh-main branch creation.
- Blocker: None.

### T-002 - Align companion requirements and story references

- Status: done
- Source: P-001; [plan approach](Plan.md#approach), affected areas and approval; ADR-0008 document ownership.
- Dependencies: T-001.
- Completion condition: Through separately authorized companion-document workflows, clarify constructor-only
  annotation versus instance lookup in Brief.md, add AC-027, preserve AC-001 through AC-026,
  reconcile stale planned/nonexistent companion references, and index the story.
- Evidence: On 2026-10-04 the user explicitly authorized prerequisite documentation alignment on the existing
  feature/glacier-reflection branch. Brief.md now clarifies constructor-only mutation and instance lookup, adds
  AC-027 without altering AC-001 through AC-026, and links the existing companions. Plan.md references the aligned
  criteria without claiming approval; the story index links the story.
- Blocker: None.

### T-003 - Obtain joint plan and acceptance-criteria approval

- Status: done
- Source: P-001; [Approval](Plan.md#approval); ADR-0006 discover/approve.
- Dependencies: T-002.
- Completion condition: The user explicitly approves the aligned plan, complete API/failure/typing contracts,
  P-001 through P-008 and brief criteria including AC-027, with date and scope recorded only in Plan.md#approval.
- Evidence: The user's actual joint decision and date are recorded in [Plan.md#approval](Plan.md#approval).
- Blocker: None.

### T-004 - Resolve dependency scope and ADR prerequisites

- Status: done
- Source: P-001/P-002; [Dependencies, risks, and open decisions](Plan.md#dependencies-risks-and-open-decisions);
  ADR-0001 dependency approval.
- Dependencies: T-003.
- Completion condition: Confirm explicit approval for the four proposed test dependencies, document non-React library
  scope for the browser provider/Playwright before adding them, and resolve any active-ADR conflict without introducing
  unapproved dependencies. Preserve the no-runtime-dependency decision.
- Evidence: The user explicitly approved the four dependencies, non-React library browser scope and exact pins
  recorded in Plan.md#approval. Workspace and frontend dependency tables now agree on library-wide provider/
  Playwright scope. The package has development dependencies only, with no runtime dependencies.
- Blocker: None. Additional direct dependencies or a changed approach require explicit approval.

### T-005 - Record catalog and application-E2E applicability

- Status: done
- Source: [E2E tests](Plan.md#e2e-tests); ADR-0005/ADR-0007 library-only exception.
- Dependencies: T-001.
- Completion condition: Identify whether application criterion registration, application Playwright scenarios and
  Testcontainers orchestration apply without inventing business criteria.
- Evidence: Brief.md scope and Plan.md#e2e-tests specify library-only work with no application UI or public HTTP
  behavior. Catalog registration, application E2E changes and a Testcontainers stack are therefore inapplicable.
  Library browser tests and existing root catalog/tooling checks remain required; no checks are claimed executed.
- Blocker: None. Reassess if scope changes.

### T-006 - Scaffold package-local build and test configuration

- Status: done
- Source: P-002; AC-001/AC-026; ADR-0002/ADR-0003/ADR-0005.
- Dependencies: T-003, T-004, T-005.
- Completion condition: Establish `packages/libraries/glacier-reflection` with root-only side-effectful ESM export map,
  strict ES2023 build/declarations, Node/browser Vitest projects, type-contract checking, compiler-fixture preparation,
  coverage collection and artifact/discovery paths specified by the plan, without implementing untested public behavior.
  Agree exact compatible dependency pins and scripts with T-007's owner.
- Evidence: Created the package at the planned directory with user-approved npm identity @glacier/reflection.
  The manifest exposes only "." with sideEffects true. Strict ES2023 build/declarations, test/contracts/fixture
  compiler configurations and Vitest Node/Chromium projects are wired. Turbo build, type-check,
  test:types and test:fixtures passed on Node 24.21.0 after correcting Vitest project configuration.
  The root remains an empty ESM module: no untested metadata behavior is implemented.
- Blocker: None. Browser execution/coverage demonstration belongs to T-008.

### T-007 - Wire workspace, dependency installation and CI gates

- Status: done
- Source: P-002; [Validation](Plan.md#validation); ADR-0001/ADR-0005.
- Dependencies: T-003, T-004, T-005.
- Completion condition: The coordinator integrates approved manifests/lockfile and package script contracts, adds Turbo
  test/coverage tasks and root `pnpm test`/`pnpm check` integration, and updates quality CI for Chromium-only installation
  and retained library artifacts while preserving existing root gates. Prepare declared Node 24.21.0/pnpm 11.9.0.
- Evidence: Approved manifests and pnpm-lock.yaml installed successfully under a SHA-256-verified, session-local
  Node 24.21.0 with pnpm 11.9.0, leaving global Node unchanged. Root test/check route through Turbo;
  tests are uncached and depend on build, type contracts and real fixture emission. Existing CI now installs all
  the Chromium browser engine and retains library artifacts alongside root diagnostics. Originally installed revisions:
  Chromium 1243, Firefox 1543 and WebKit 2359. Root catalog/tooling regression gates passed, including
  34 catalog rejection controls and frozen offline installation/Husky controls. No CI execution or security
  result is claimed.
- Blocker: None. T-008 owns observed local harness failures.

### T-008 - Demonstrate executable harness and coverage negative controls

- Status: done
- Source: P-002; AC-026; ADR-0005 coverage and ADR-0006 test-first.
- Dependencies: T-006, T-007.
- Completion condition: On the declared runtime, demonstrate root-API runtime/type discovery, real decorator-fixture
  emission and the approved Chromium browser engine. Show that an uncovered executable path and an unloaded relevant production file
  fail overall/per-file 100% thresholds, and that Node/Chromium mapped coverage combines correctly. Remove temporary
  controls, retain observed evidence, and distinguish tooling failures from intended public-contract failures.
- Evidence: On Node 24.21.0, the [module scenario](../../../packages/libraries/glacier-reflection/tests/scenarios/ModuleContract.test.ts)
  passed in Node, Chromium and separately WebKit.
  The type contract participated in tsc and LegacyEmission.js contains genuine __metadata("design:paramtypes",
  [String]) emission. Temporary production controls proved unloaded files fail per-file thresholds (0% statements/
  functions/lines), an uncovered branch fails (80% statements/lines, 75% branches), and complementary Node/
  Chromium paths combine to 100% statements/branches/functions/lines. All temporary control sources/exports/tests
  were removed. These are tooling controls, not metadata public-contract red evidence or completed API coverage.
  After the user-approved Chromium-only matrix change recorded in Plan.md#approval, `pnpm check` passed
  all 13 tasks on Node 24.21.0, including fresh Node/Chromium module scenarios and type/fixture preparation.
  No metadata API coverage is claimed for the empty production barrel.
- Blocker: None. The earlier Firefox startup failure ("Could not find profile folder") was reproduced with default
  /tmp, canonical /private/tmp and a workspace-owned temporary root. It remains historical failed evidence, not a
  passing engine result or contract red; Firefox is now outside the explicitly approved verification scope.

### T-009 - Establish failing definition, address and instance contracts

- Status: pending
- Source: P-003; AC-003 through AC-006, AC-026 and AC-027; [Validation](Plan.md#validation).
- Dependencies: T-008.
- Completion condition: Author positive/negative package-root type contracts and named runtime scenarios for the
  three definitions and checked/dynamic operation signatures, valid/rejected addresses, numeric positions,
  constructor-only mutation and constructor/instance normalization. Include variance, class interchange, target
  widening, fixed/optional/rest tuples, private/protected signatures, symbol/numeric keys, shadowed constructors,
  subclasses, plain/prototype objects, instance address restrictions and observable inspection errors. Observe intended
  contract failures in an executable harness before corresponding production contracts are implemented.
- Evidence: None yet. Planned suites: DefinitionContract, AddressContract, InstanceLookupContract;
  MetadataTypes, AddressTypes and InstanceLookupTypes type contracts.
- Blocker: None beyond dependencies.

### T-010 - Implement definition storage, addresses and lookup normalization

- Status: pending
- Source: P-003; AC-003 through AC-006, AC-014, AC-026 and AC-027.
- Dependencies: T-009.
- Completion condition: Implement the plan's private identities/brands, invariant signatures, typed outcomes,
  shared normalization and class-owned storage so T-009's contracts pass without unsafe widening or extra test exports.
  Reject invalid mutations atomically, distinguish absence/present undefined, and normalize instances without
  constructing consumers or invoking their getters. Refactor with the established runtime/type contracts passing.
- Evidence: None yet.
- Blocker: None beyond dependencies. One owner controls shared storage/normalization and the public barrel.

### T-011 - Implement inheritance, deletion and collection ownership test-first

- Status: pending
- Source: P-004; AC-007 through AC-017, AC-026.
- Dependencies: T-010.
- Completion condition: Observe failing InheritanceContract/CollectionOwnership scenarios, then implement exact
  ancestor ordering, nearest whole-value/entry replacement, duplicate-preserving lists, own-only lookup, repeated-write
  replacement, present undefined/empty declarations, direct deletion and position-only parameter inheritance.
  Verify safe reserved record keys, isolated readonly/frozen outer collections, decorator-input snapshot obligations
  where applicable, retained nested/replacement identity and no reset/suppression API. Record passing refactor checks.
- Evidence: None yet.
- Blocker: None beyond dependencies. Decorator-specific ownership assertions complete with T-012, not a claim that
  an unimplemented decorator has already been verified.

### T-012 - Implement all legacy decorator locations test-first

- Status: pending
- Source: P-005; AC-002/AC-003/AC-005/AC-006/AC-012/AC-017/AC-026.
- Dependencies: T-011.
- Completion condition: Observe real emitted legacy callback failures, then implement decorators for every approved
  class/member/accessor/constructor-parameter/method-parameter location, both sides, private/protected and numeric/symbol
  cases. Verify direct-operation equivalence, no replacement of consumer declarations/descriptors, collection snapshots
  at decorator creation and typed-value contracts. Invalid boundaries throw the specified errors without mutation.
- Evidence: None yet. Planned runtime suite: LegacyDecoratorContract; type contract: DecoratorTypes.
- Blocker: None beyond dependencies. Can run alongside T-013 with exclusive adapter/test-file ownership.

### T-013 - Implement both discovery directions test-first

- Status: pending
- Source: P-005; AC-004/AC-014/AC-015/AC-018/AC-019/AC-026 and AC-027.
- Dependencies: T-011.
- Completion condition: Observe failing DiscoveryContract scenarios, then implement address-scoped definition discovery
  and definition-owned location discovery with actual identities, normalized target-free addresses, shallow-frozen
  results, deduplication, own/inherited modes, deletion cleanup and instance filtering. Verify present undefined/empty
  declarations and readDynamic round trips without suggesting discovered addresses prove static signatures.
- Evidence: None yet.
- Blocker: None beyond dependencies. Can run alongside T-012; shared indexes/normalization changes require coordinator
  handoff rather than concurrent edits.

### T-014 - Verify decorator and discovery integration

- Status: pending
- Source: P-005; AC-002/AC-017 through AC-019/AC-026 and AC-027.
- Dependencies: T-012, T-013.
- Completion condition: Run the joined package-root contracts; discover direct and decorated declarations on constructors
  and instances, read discovered addresses in both modes, and confirm equivalent isolation/ownership/rejection behavior.
  Resolve integration regressions before compiler integration without weakening checked/dynamic guarantees.
- Evidence: None yet.
- Blocker: None beyond dependencies.

### T-015 - Establish failing real compiler and import-boundary contracts

- Status: pending
- Source: P-006; AC-020 through AC-023/AC-026.
- Dependencies: T-014.
- Completion condition: Compile genuine TypeScript design-metadata fixtures and observe intended automatic-recording,
  replacement and rejection failures through fresh processes/browser realms. Cover all keys, malformed/sparse arrays,
  invalid targets/locations, old-value preservation, foreign descriptors, unavailable Reflect and installation failure,
  duplicate physical copies/repeated same-module imports and unrelated Reflect preservation.
- Evidence: None yet. Planned suites: CompilerMetadataContract and ImportCompatibility.
- Blocker: None beyond dependencies. Node/browser authors may own separate fixtures/resources; retain bounded startup,
  awaited completion and observable cleanup with no production reset API or module mocking.

### T-016 - Implement automatic compiler recording and boundary errors

- Status: pending
- Source: P-006; AC-004/AC-020 through AC-023/AC-026.
- Dependencies: T-015.
- Completion condition: Implement the three ordinary predefined value definitions, root activation, atomic checked
  compiler writes/snapshots and safe coded errors so T-015 passes. Whole emitted arrays replace rather than accumulate;
  typed direct writes retain ordinary value identity. Preserve foreign handlers/descriptors and other Reflect operations.
  Re-run all custom runtime/type contracts with actual emitted metadata present, then refactor with passing checks.
- Evidence: None yet.
- Blocker: None beyond dependencies. Global installation and shared root exports require one coordinated owner.

### T-017 - Verify built-package Node and browser distribution contracts

- Status: pending
- Source: P-007; AC-001/AC-020/AC-023/AC-026.
- Dependencies: T-016.
- Completion condition: Independent consumers load generated root ESM/declarations under Node 24 and Chromium
  without another Glacier/DI dependency. Observe meaningful distribution assertions, including rejected
  deep/subpath imports, retained runtime activation and type-only import limits; implement any public-contract
  correction only after its intended failure. Confirm emitted declaration inference/brands survive distribution.
- Evidence: None yet. Planned suite: DistributionContract.
- Blocker: None beyond dependencies. Build/fixture generation must not collide with T-018.

### T-018 - Complete executable usage examples and lasting documentation

- Status: pending
- Source: P-007; AC-024/AC-025, AC-001/AC-012/AC-017 and AC-027.
- Dependencies: T-016.
- Completion condition: Type-check and execute representative public-root examples, including emitted constructor
  representations plus an explicit symbol for an interface dependency without implementing DI. Complete README/JSDoc
  and directly affected Engineering/Architecture/CI notes for import ordering/effects, runtime bounds,
  checked/dynamic addressing, ownership, instance aliases, parameter inheritance, erasure and foreign-handler recovery.
  Examples complement, not replace, executable assertions.
- Evidence: None yet.
- Blocker: None beyond dependencies. Can run alongside T-017; public-source JSDoc edits must be handed off to its owner
  and finished before fixed-revision verification.

### T-019 - Join distribution and adoption evidence

- Status: pending
- Source: P-007; AC-001 through AC-027; ADR-0008 traceability.
- Dependencies: T-017, T-018.
- Completion condition: Every approved criterion has observed evidence through the plan's verification mapping;
  link actual implemented runtime/type/example files, verify all runtime exports and erased types are accounted for,
  and reconcile documentation with the tested API without adding requirements.
- Evidence: None yet.
- Blocker: None beyond dependencies. Any infeasible signature or material deviation returns to T-003.

### T-020 - Integrate current main before final local verification

- Status: pending
- Source: P-008; ADR-0006 current-main integration.
- Dependencies: T-019.
- Completion condition: Fetch current origin/main, establish whether it is already included, otherwise merge it into
  the story branch and resolve conflicts without rebasing or weakening contracts. Identify the revision for renewed
  validation; obtain separate authorization for any integration commits rather than infer it from implementation.
- Evidence: None yet.
- Blocker: None beyond dependencies. A changed revision invalidates prior final-check/acceptance evidence.

### T-021 - Run the complete local automated verification gate

- Status: pending
- Source: P-008; [Validation](Plan.md#validation); AC-026; ADR-0001/ADR-0003/ADR-0005/ADR-0007.
- Dependencies: T-020.
- Completion condition: Under the declared runtime, `pnpm check` and a fresh
  `pnpm exec turbo run test --force` pass lint, formatting, type contracts, build, root catalog/tooling checks and the
  complete library Node/browser suite. All four coverage metrics are 100% overall and per relevant production file
  with Node/Chromium combined; Chromium is the only required browser engine. Retain exact commands, revision and results;
  skips, concealed failures, unavailable gates or retry-only passes do not satisfy completion.
- Evidence: None yet.
- Blocker: None beyond dependencies. Application E2E is inapplicable under T-005, not an executed passing suite.

### T-022 - Review all ADRs, contracts and assertion quality

- Status: pending
- Source: P-008; AC-016/AC-024/AC-026; ADR-0001 through ADR-0008.
- Dependencies: T-020.
- Completion condition: Review the fixed revision for every active ADR, dependency approval, layer/import boundaries,
  root export curation, strict type guarantees, atomic errors, compiler/instance limits, meaningful success/failure/
  boundary assertions, JSDoc/examples and changed links. Record each ADR's conformance or justified inapplicability and
  resolve conflicts without treating AI review as human acceptance.
- Evidence: None yet.
- Blocker: None beyond dependencies. May run alongside T-021 read-only; edits invalidate affected verification.

### T-023 - Prepare archival, indexes and durable test links

- Status: pending
- Source: P-008; ADR-0006 closure; ADR-0007 E2E section; ADR-0008 story ownership.
- Dependencies: T-021, T-022.
- Completion condition: Complete lasting notes and implementation/verification task evidence; preserve the plan's E2E
  inapplicability explanation and link real library tests. Move the story to Archive, update affected indexes and relative
  references while preserving IDs, and rerun affected checks/link review after these changes. Mark archival as pre-merge
  preparation, never delivery; leave T-029 pending until GitHub confirms merge.
- Evidence: None yet.
- Blocker: None beyond dependencies. Changed documentation is part of the reviewed revision, not an unverified add-on.

### T-024 - Obtain separate commit authorization

- Status: pending
- Source: P-008; ADR-0006 commit gate.
- Dependencies: T-023.
- Completion condition: The user explicitly authorizes commits for the verified, closure-prepared story changes.
  Identify workspace versus glacier-reflection ownership and exclude unrelated work.
- Evidence: None yet. This task-document request grants no commit authorization.
- Blocker: None beyond dependencies. Stop this stage if authorization is declined.

### T-025 - Create package-scoped commits with passing hooks

- Status: pending
- Source: P-008; ADR-0006; implementation-commit skill.
- Dependencies: T-024.
- Completion condition: Create separately scoped Conventional Commits for workspace and library changes, with appropriate
  versioning/breaking markers and required co-author trailer. Applicable Husky/lint-staged checks pass without bypasses;
  record commit SHAs and hook results, resolve violations and renew affected checks.
- Evidence: None yet.
- Blocker: None beyond dependencies.

### T-026 - Obtain publication authorization and publish the PR

- Status: pending
- Source: P-008; ADR-0006 push/PR gate; implementation-publish-pr skill.
- Dependencies: T-025.
- Completion condition: Obtain separate explicit push/PR authorization, then push the story branch and open/update its
  PR targeting main with archived-story links, validation/limitations and architectural/dependency/behavior changes.
  Record actual publication evidence; do not infer merge permission.
- Evidence: None yet. No push or PR authorization is supplied by drafting this document.
- Blocker: None beyond dependencies. If publication is declined, stop without pushing and await user initiation.

### T-027 - Renew current-main, CI and blocking-feedback evidence

- Status: pending
- Source: P-008; ADR-0006 review/merge; ADR-0001 CI/Snyk.
- Dependencies: T-026.
- Completion condition: Fetch/check main freshness for the published revision, merge updates where necessary and repeat
  applicable local/CI gates. Independently passing CI includes build, lint/format, type/runtime/browser/coverage gates,
  root catalog/tooling checks and current Snyk dependency scans. Resolve blocking feedback/findings with renewed checks
  and separate commit/push permissions for further changes. Record exact checked SHA and outcomes.
- Evidence: None yet. Container-image scans are inapplicable because no deployable image is introduced.
- Blocker: None beyond dependencies. Missing/stale/failing Snyk or other applicable checks blocks acceptance.

### T-028 - Obtain human acceptance and explicit current-revision merge authorization

- Status: pending
- Source: P-008; ADR-0006 human acceptance/merge permission.
- Dependencies: T-027.
- Completion condition: A human accepts the current checked PR revision against approved criteria, assertions, ADRs,
  dependency approvals and documentation, then explicitly authorizes merge for that unchanged revision. One decision
  may express both; implementation, commit or publication permission cannot substitute.
- Evidence: None yet.
- Blocker: None beyond dependencies. Any new change invalidates this evidence and requires renewed checks/acceptance.

### T-029 - Merge and confirm GitHub delivery into main

- Status: pending
- Source: P-008; ADR-0006 confirmed merge.
- Dependencies: T-028.
- Completion condition: Recheck unchanged accepted SHA, passing checks and freshly fetched main inclusion immediately
  before merging; if stale, repeat T-027/T-028 for the new revision. Use GitHub's merge-commit method and verify GitHub
  reports merged into main with its merge commit. Record confirmed evidence when available without requiring a
  post-merge documentation commit solely to update this task.
- Evidence: None yet. Branch existence, green checks, PR approval and archival location do not establish delivery.
- Blocker: None beyond dependencies. No release, npm publication, deployment or consuming-application execution is added
  to the story's completion conditions.

## Workflow coverage

| Obligation                                                                           | Task records        |
| ------------------------------------------------------------------------------------ | ------------------- |
| Discovery, active ADRs and confirmed branch adoption                                 | T-001               |
| Companion alignment, joint criteria/plan approval and dependency/ADR prerequisites   | T-002 through T-004 |
| Catalog registration and application E2E applicability                               | T-005               |
| Tooling bootstrap and demonstrable coverage enforcement                              | T-006 through T-008 |
| Public runtime/type test-first cycles and implementation                             | T-009 through T-018 |
| Criterion evidence, current-main integration, complete local gates and manual review | T-019 through T-022 |
| Lasting docs, implemented-test links and pre-review archival                         | T-018, T-019, T-023 |
| Separate commit and publication permission with hooks                                | T-024 through T-026 |
| Current-main/CI/Snyk renewal and blocking review feedback                            | T-027               |
| Human acceptance, explicit merge permission and confirmed merge                      | T-028, T-029        |

Statuses and evidence describe only observed execution. Failed checks remain visible until resolved.
After PR changes or main integration, invalidate affected checks, acceptance and merge authorization and repeat the
relevant tasks; this does not introduce a dependency cycle. Material design changes return to joint approval.

## Related notes

- [Brief](Brief.md)
- [Plan](Plan.md)
- [Plan approval](Plan.md#approval)
- [Stories](../Index.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
- [ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)
