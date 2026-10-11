---
name: glacier-package-scaffolding
description: Scaffold a needed Glacier library, frontend application, or backend service within approved scope. Use to configure capability layout, public entries, strict TypeScript, workspace tasks, dependency approvals, and applicable tests without placeholder products.
---

# Glacier package scaffolding

## Triggers

Use when an approved story needs a new package or a real missing package
configuration. Do not create an illustrative framework inventory or artificial
layers/resources.

## Inputs and prerequisites

Require approved epic/story/tasks, package purpose/type, capability ownership,
public contracts, dependency approvals, and all policies. Read current
`pnpm-workspace.yaml`, manifests, shared compiler/Turbo configuration, and CI.
Pay particular attention to [technology](../../../.policies/0002-technology-and-dependencies.md),
[boundaries](../../../.policies/0003-capabilities-and-boundaries.md), and
[lifecycle](../../../.policies/0004-composition-and-lifecycle.md).

## Procedure

1. Choose the existing workspace location for apps/services/libraries from actual
   workspace discovery. Follow naming/scope rules and capability-first layout:
   single-capability libraries place applicable layers directly under `src/`;
   multiple capabilities group their layers. Omit unused layers entirely.
2. Obtain explicit approval before every new direct dependency, including packages
   listed in policy 0002, within its approved scope. Read current pins and engines;
   do not infer blanket upgrade or framework/router/styling approval.
3. Configure TypeScript with current shared strict options and actual ESM/runtime
   resolution. Use relative intra-package and public-root inter-package imports,
   no path aliases, nested barrels, or deep imports. Follow one-primary-export
   files, approved role suffixes, and purpose-bearing JSDoc.
4. Libraries expose curated public APIs through package-root `index.ts` and a
   root-only export map. No bootstrap or import-time resource startup. Configure
   [library contracts](../glacier-library-contracts/SKILL.md), public examples,
   type checks, runtime scenarios, combined per-file coverage, and ignored artifacts.
5. Apps/services start through minimal `src/Application.bootstrap.ts`; composition
   helpers stay outside capabilities in `src/bootstrap/` when needed. Explicitly
   choose adapters and separate construction/startup/cleanup. Backend deployables
   use Docker images; PostgreSQL/Drizzle or Redis only when persistence/cache needs
   genuinely exist. Frontend apps use React/Vite and
   [React/Storybook](../glacier-react-storybook/SKILL.md).
6. Apps/services add public-only acceptance support in workspace-root tests through
   [acceptance scenarios](../glacier-acceptance-scenarios/SKILL.md), not local Vitest
   suites. Storybook application stories remain documentation only.
7. Wire real applicable lint/format/type/build/test/coverage/catalog/reporting and
   CI tasks through pnpm/Turborepo. Ensure black-box execution is uncached and
   production compilation/artifacts are genuine. Do not use empty/skipped scripts
   to satisfy required gates or claim configured integrations are remotely active.
8. Update package/workspace docs and run independent approved checks followed by
   [verification](../glacier-verification/SKILL.md). Restore dependencies only after
   manifest changes or a missing-dependency failure; preserve frozen lockfile
   validation and report applicable Docker/browser/service prerequisites.

## Outputs and handoff evidence

Record package purpose/location, curated contracts, dependency approvals, real
script/CI integration, docs/examples, tests/coverage/catalog paths, exact command
results, and runtime/integration limitations in story evidence.

## Approval and stop gates

Missing purpose/contracts, unapproved dependencies, artificial architecture,
invalid imports/exports, placeholder gates, or unavailable required infrastructure
blocks completion. Scaffolding does not authorize new product behavior or remote
integration activation outside the approved story.
