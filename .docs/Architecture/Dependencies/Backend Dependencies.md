# Backend dependencies

These are approved direct npm dependencies for the target [backend techstack](../Techstack/Backend%20Techstack.md). Add runtime database/cache packages only to services that need them. Keep Playwright test-infrastructure dependencies at the workspace root under [ADR-0005](../Decisions/ADR-0005-Testing-strategy.md), not in service-local test suites. Shared test tooling is in [workspace dependencies](Workspace%20Dependencies.md).

| npm package                  | Kind                                                          | Why it is used                                         |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `drizzle-orm`                | Runtime, when using PostgreSQL                                | Define schemas and access PostgreSQL with Drizzle ORM. |
| `postgres`                   | Runtime, when using PostgreSQL                                | Provide the Postgres.js driver used by Drizzle ORM.    |
| `drizzle-kit`                | Development, when using PostgreSQL                            | Generate and run PostgreSQL schema migrations.         |
| `redis`                      | Runtime, when using shared caching                            | Connect to Redis for shared caching.                   |
| `@testcontainers/postgresql` | Development (workspace root), when the stack needs PostgreSQL | Start real PostgreSQL for full-stack acceptance tests. |
| `@testcontainers/redis`      | Development (workspace root), when the stack needs Redis      | Start real Redis for full-stack acceptance tests.      |
