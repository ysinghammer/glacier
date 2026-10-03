# Frontend techstack

These choices are mandatory within their stated scope. The [workspace techstack](Workspace%20Techstack.md) applies to frontend applications, including its TypeScript, workspace tooling, testing, and CI requirements.

- Use [React](../Dependencies/Frontend%20Dependencies.md) for frontend applications, built with [Vite](../Dependencies/Frontend%20Dependencies.md).
- Use [Storybook](../Dependencies/Frontend%20Dependencies.md) to document React components in applications and libraries,
  with `.stories.tsx` files and the parent-only subcomponent exemption defined by
  [ADR-0004](../Decisions/ADR-0004-React-conventions.md). Storybook runs on Vite. In React libraries, stories run as the
  component tests through the Storybook Vitest addon ([ADR-0005](../Decisions/ADR-0005-Testing-strategy.md)); in
  applications they are documentation only.
- Verify the running application's public UI with [Playwright](../Dependencies/Workspace%20Dependencies.md) acceptance
  tests in workspace-root `tests/`, against the fresh entire stack started with
  [Testcontainers](../Dependencies/Workspace%20Dependencies.md). Follow
  [ADR-0005](../Decisions/ADR-0005-Testing-strategy.md); do not keep application-local tests or fixtures.
