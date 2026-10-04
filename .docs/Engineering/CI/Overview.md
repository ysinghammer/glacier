# CI

Document the pipeline entry points, required checks, and recovery procedures here. The workflow files remain the source of truth for what CI actually runs.

[ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md) defines development through confirmed GitHub
PR merge into `main`, including current-main integration, independent CI, human acceptance, and explicit merge approval.
Release and deployment procedures are outside that workflow. Its policy does not configure CI or branch protection;
applicable missing or failed gates block code acceptance rather than imply a passing pipeline.

Husky and lint-staged provide [quick local pre-commit lint and formatting checks](../Guidelines/Overview.md) on matching
staged files. They are not CI gates or security scanners. CI must independently run the builds, lint and formatting
checks, tests, and applicable Snyk scans required by [ADR-0001](../../Architecture/Decisions/ADR-0001-Techstack.md);
it must not rely on contributors having run local Git hooks.

[ADR-0005](../../Architecture/Decisions/ADR-0005-Testing-strategy.md) defines the testing gates CI must also enforce:
library coverage thresholds, acceptance catalog validation ([ADR-0007](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)), and the complete uncached Playwright suite against a fresh
Testcontainers stack. Skipped required scenarios, missing dependencies, and retry-only passes must not yield an accepted
result. Retain its generated acceptance report and diagnostics without secrets, and keep generated outputs in the
Git-ignored `tests/artifacts/` locations it defines. Future package stories must implement their applicable gates.

## Workspace quality workflow

[Workspace quality](../../../.github/workflows/quality.yml) runs on PRs, pushes to main and the foundation story
branch, and manual dispatch. Actions are pinned to immutable revisions; workflow permissions are read-only,
checkout credentials are not persisted, and job execution is bounded.

The workflow installs the manifest-declared pnpm, activates [.node-version](../../../.node-version), installs
the [lockfile](../../../pnpm-lock.yaml) with frozen mode, then runs `pnpm check` through Turbo.
`HUSKY=0` disables local hooks in CI: gates remain independent of contributor hook execution.
Command failures fail the job. An always-run artifact step retains invocation-specific catalog/tooling diagnostics
for seven days without converting a failed check into success.

The current gates compile and validate actual workspace tooling, lint and check formatting, validate the empty
acceptance catalog, and run positive/negative technical controls. No application/library suites or image scans are
claimed: their packages/images do not exist. When added, their ADR-0005/0007 gates must become required here;
full-stack execution must remain uncached and its reports include actual outcomes.

For installation failures, confirm runtime/package-manager versions and restore the frozen dependency set.
For gate failures, inspect the command diagnostic and retained `tests/artifacts/` report, reproduce with
the [same local commands](../Guidelines/Overview.md#workspace-commands), correct the cause, and renew checks.
Do not use `continue-on-error`, omit failing tasks, or treat unavailable checks as successful.

## Snyk GitHub integration

The repository owner must connect the GitHub repository in Snyk, authorize its GitHub App/integration, and import
the root `package.json` project with `pnpm-lock.yaml`. Use the declared Node/pnpm environment and enable
dependency/PR tests and check reporting. Snyk configuration is account-managed; no npm scanner dependency,
CLI workflow, credential, or ignore policy is committed.

The owner must record the imported project's scan link and result for the current lockfile/revision.
Applicable Snyk dependency checks must pass independently of Workspace quality before acceptance.
Unresolved findings requiring remediation or a missing/stale/failed check block acceptance. A green quality job
is not a substitute for Snyk. For failed imports or absent PR checks, verify GitHub installation/repository grants,
Snyk organization entitlement, lockfile support, branch/project selection, and integration-managed credentials.
Resolve findings through approved updates; never disable the required scan or silently add ignores.
Container-image scans become applicable with the first deployable image.

## Renovate GitHub integration

The owner must install/authorize the Renovate GitHub App for this repository and allow its onboarding/run.
[renovate.json](../../../renovate.json) enables npm/pnpm manifests and lockfiles, GitHub Actions, and Node runtime
declarations. Updates are proposed with pinned ranges, a dependency dashboard, and `automerge: false`.
Verify app/organization-level settings do not override the no-automerge policy.

Record an observed run/log or dependency-dashboard link showing recognized workspace dependencies and either
update proposals or an explicit no-updates outcome. Configuration alone does not satisfy integration acceptance.
If proposals are missing, check installation scope, onboarding approval, app permissions, repository config validation,
rate limits, and logs. Review runtime updates against the active-LTS requirement and keep both runtime declarations,
manifest engines, package-manager selection, and lockfile consistent before accepting a proposal.

## Ownership and outstanding activation

The owner performs Snyk/Renovate account setup; contributors provide repository config and troubleshoot observable
failures without exposing credentials. Tokens belong in integration settings, not files, logs, or artifacts.
The foundation implementation session has read-only GitHub access. Owner activation, observed Snyk/Renovate results,
and a passing published-revision Actions run remain required, pending external evidence and separately authorized
commit/publication. Local setup or this documentation does not claim those integrations are active.
Branch protection and organization-wide administration are outside this story's scope.
