# Backend techstack

These choices are mandatory within their stated scope. The [workspace techstack](Workspace%20Techstack.md) applies to backend services, including its language, runtime, Docker, testing, and CI requirements.

- Use [PostgreSQL](../Dependencies/Backend%20Dependencies.md) when a service needs relational persistence. A service without that need does not have to connect to PostgreSQL.
- Use [Drizzle ORM](../Dependencies/Backend%20Dependencies.md) for PostgreSQL access and [Drizzle Kit](../Dependencies/Backend%20Dependencies.md) for PostgreSQL schema migrations.
- Use [Redis](../Dependencies/Backend%20Dependencies.md) when a service needs shared caching. A service without that need does not have to connect to Redis.
- Verify public service HTTP contracts with [Playwright](../Dependencies/Workspace%20Dependencies.md) from workspace-root
  `tests/`, against the fresh entire stack started with [Testcontainers](../Dependencies/Workspace%20Dependencies.md).
  Include required PostgreSQL/Redis instances and follow [ADR-0005](../Decisions/ADR-0005-Testing-strategy.md); do not
  keep service-local tests or fixtures.
