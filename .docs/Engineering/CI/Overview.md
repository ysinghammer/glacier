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
Git-ignored `tests/artifacts/` locations it defines. Workspace scaffolding must implement these gates.
