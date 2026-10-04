# Workspace dependencies

These are approved direct npm dependencies for the target [workspace techstack](../Techstack/Workspace%20Techstack.md). Add a dependency only where its stated scope applies; exact versions belong in future manifests.

| npm package                  | Kind                               | Why it is used                                                                                                                                 |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript`                 | Development                        | Type-check and compile project-authored TypeScript.                                                                                            |
| `@types/node`                | Development                        | Provide Node.js types for server-side code and workspace tooling.                                                                              |
| `turbo`                      | Development                        | Orchestrate workspace tasks locally and in CI.                                                                                                 |
| `oxlint`                     | Development                        | Lint TypeScript code.                                                                                                                          |
| `oxfmt`                      | Development                        | Format code and check formatting in CI.                                                                                                        |
| `husky`                      | Development (workspace root)       | Manage local Git hooks, including the pre-commit hook that runs lint-staged.                                                                   |
| `lint-staged`                | Development (workspace root)       | Run quick Oxlint and Oxfmt compliance checks on matching staged files before committing.                                                       |
| `@playwright/test`           | Development (workspace root)       | Run full-stack black-box UI and public HTTP API acceptance tests in workspace-root `tests/`.                                                   |
| `vitest`                     | Development (library testing only) | Test every public library export through the package-root API; not for applications or microservices.                                          |
| `@vitest/coverage-v8`        | Development (library testing only) | Collect coverage and enforce 100% statements, branches, functions, and lines for public-export implementations and supporting production code. |
| `@vitest/browser-playwright` | Development (library testing only) | Run Vitest browser-mode public-contract tests with the Playwright provider, including non-React libraries and React library stories.           |
| `playwright`                 | Development (library testing only) | Browser automation for the Vitest Playwright provider; not for application or microservice acceptance tests.                                   |
| `testcontainers`             | Development (workspace root)       | Orchestrate a fresh entire application stack and real infrastructure per Playwright invocation.                                                |

Node.js, pnpm, Docker, GitHub Actions, Snyk, and Renovate are part of the workspace techstack but are not prescribed as npm dependencies here. Snyk and Renovate are GitHub integrations.

Testing scopes follow [ADR-0005](../Decisions/ADR-0005-Testing-strategy.md); acceptance requirements follow
[ADR-0007](../Decisions/ADR-0007-Acceptance-catalog.md).
Library Playwright provider instances and browser installation must target Chromium only, locally and in CI.
Application/service acceptance testing remains owned by workspace-root `@playwright/test` and Testcontainers;
the library browser-provider scope does not authorize Vitest application/service tests.

The [reflection package manifest](../../../packages/libraries/glacier-reflection/package.json) declares no
runtime dependencies. Its approved package-local development pins are `vitest`, `@vitest/coverage-v8` and
`@vitest/browser-playwright` 5.0.3, and `playwright` 1.63.0; shared TypeScript/Node tooling remains workspace-owned.
These pins implement the existing library scopes, not approval of DI, reflect-metadata, schema validation,
React or an additional direct bundler dependency. The [package README](../../../packages/libraries/glacier-reflection/README.md)
documents generated-root consumption, import activation and bounded Node/Chromium verification.
