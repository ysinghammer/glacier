---
name: glacier-library-contracts
description: Design and verify Glacier library public runtime and type contracts. Use for public-root Vitest scenarios, injected doubles, browser contracts, generated-distribution checks, and combined 100% per-file coverage.
---

# Glacier library contracts

## Triggers

Use when adding/changing a library public export, supporting runtime behavior,
type contract, distribution boundary, or its verification setup. Do not apply
library unit-test conventions to applications/services.

## Inputs and prerequisites

Read every policy, especially [technology scopes](../../../.policies/0002-technology-and-dependencies.md),
[library testing](../../../.policies/0010-library-testing.md), and
[Chromium bounds](../../../.policies/0011-full-stack-testing.md).
Require approved story-local criteria, package-root API, manifests/compiler/test
configuration, runtime-support bounds, and applicable component stories.

## Procedure

1. Inventory actual public runtime and type-only exports and their supporting
   production files. Use only the root public API in ordinary tests; never expose
   internals for coverage or inspect private state. Keep representative public
   usage examples current, but do not count examples as complete assertions.
2. Put ordinary runtime scenarios in package-local
   `tests/scenarios/**/*.test.ts` or `.test.tsx`, grouped by public capability when
   needed. Name public scenarios, not implementation files; clearly establish
   setup, action, and observable outcomes.
3. Meaningfully assert applicable success, failure, and boundary behavior for
   every noncomponent runtime export. Supply test-owned dependencies only through
   public injection points; prohibit module mocks and private/internal inspection.
   Keep technical cases/doubles under `tests/data/` and `tests/doubles/`.
4. Verify erased exports independently in `tests/contracts/**/*.test-d.ts` through
   public type checking, not runtime discovery/coverage. Preserve strictness and
   ensure expected-error assertions fail if the error disappears.
5. Configure package-local Vitest and V8 coverage through pnpm/Turborepo. Include
   every relevant supporting production file, including untested ones. Enforce
   100% statements, branches, functions, and lines per library and production file;
   never exclude executable paths or add coverage-ignore annotations.
6. Combine Node and browser/story coverage before enforcing thresholds. Use only
   approved browser integrations and pinned Chromium. React stories/hooks follow
   [React/Storybook](../glacier-react-storybook/SKILL.md); non-React libraries do
   not gain permission for React-only testing packages.
7. Where distribution behavior is a criterion, verify generated root consumers
   and genuine runtime/compiler/bundle behavior rather than only source imports.
   For reflection, read the current explicit ESM/ES2023, root-only, dependency-free,
   legacy-decorator, activation/foreign-handler, and support-bound contracts.
   Its approved Vite retention check is not permission for a production bundler.
8. Run actual applicable package/workspace tasks and inspect reports; filtered
   diagnostics do not replace required complete story/epic checks. Generated
   results belong in ignored package-local `tests/artifacts/`; authored support
   stays outside artifacts and outputs remain secret-safe.

## Outputs and handoff evidence

Provide public export-to-scenario/type-check evidence, assertion review, exact
commands/results, combined coverage with every metric/per-file result, generated
distribution evidence where required, report paths, and exact support limitations.

## Approval and stop gates

Unapproved dependencies, missing public assertions/type checks, unmet coverage,
invalid runtime bounds, or unavailable required browsers/checks blocks completion.
Do not claim erased types runtime-covered, Chromium results cross-browser, or
workspace distribution evidence proof of npm publication.
