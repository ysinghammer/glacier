# Frontend dependencies

These are approved direct npm dependencies for the target [frontend techstack](../Techstack/Frontend%20Techstack.md). Shared TypeScript, Vitest, Playwright, and Testcontainers tooling is in [workspace dependencies](Workspace%20Dependencies.md).

| npm package                  | Kind                                     | Why it is used                                                                                                                                                         |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`                      | Runtime                                  | Build frontend application interfaces.                                                                                                                                 |
| `react-dom`                  | Runtime                                  | Render React applications in the browser.                                                                                                                              |
| `@types/react`               | Development                              | Provide TypeScript types for React.                                                                                                                                    |
| `@types/react-dom`           | Development                              | Provide TypeScript types for React DOM rendering.                                                                                                                      |
| `storybook`                  | Development                              | Run and build React component documentation in applications and libraries.                                                                                             |
| `@storybook/react`           | Development                              | Provide React integration and story types for Storybook component documentation.                                                                                       |
| `vite`                       | Development                              | Build frontend applications, serve as the Storybook builder, and perform the explicitly approved non-React library distribution bundling verification described below. |
| `@vitejs/plugin-react`       | Development                              | Compile React JSX in Vite.                                                                                                                                             |
| `@storybook/react-vite`      | Development                              | Vite-based Storybook framework for React.                                                                                                                              |
| `@storybook/addon-vitest`    | Development (React library testing only) | Run component stories with play functions as Vitest browser-mode tests.                                                                                                |
| `@vitest/browser`            | Development (React library testing only) | Provide Vitest browser mode for story-run tests.                                                                                                                       |
| `@vitest/browser-playwright` | Development (library testing only)       | Run Vitest browser-mode tests with the Playwright provider, including non-React libraries and React library stories.                                                   |
| `playwright`                 | Development (library testing only)       | Browser automation required by the Vitest Playwright provider; not for application or microservice acceptance tests.                                                   |
| `jsdom`                      | Development (React library testing only) | DOM environment for hook tests.                                                                                                                                        |
| `@testing-library/react`     | Development (React library testing only) | Render hooks with `renderHook` in Vitest tests.                                                                                                                        |
| `@testing-library/dom`       | Development (React library testing only) | Required peer of `@testing-library/react`.                                                                                                                             |

Storybook runs on Vite through `@storybook/react-vite`. Library component stories are executed as tests under
[ADR-0005](../Decisions/ADR-0005-Testing-strategy.md); application stories are documentation only. Any additional direct
integration packages require explicit approval under [ADR-0001](../Decisions/ADR-0001-Techstack.md).

The browser-provider and `playwright` rows share the library-wide scope in
[workspace dependencies](Workspace%20Dependencies.md), including non-React public-contract tests. Provider instances
and browser installation must use Chromium only, locally and in CI. This does not broaden the React-only scopes of
`@vitest/browser`, Storybook integration, jsdom, or Testing Library, or authorize Vitest application/service tests.

The non-React [reflection library](../../../packages/libraries/glacier-reflection/README.md) uses the
workspace library-testing scope with browser-playwright 5.0.3 and Playwright 1.63.0, Chromium only.
On 2026-10-04 the user explicitly approved package-local development Vite **8.3.2** for its existing independent
distribution side-effect-retention bundle; see [recovery approval](../../Archive/glacier-reflection/Plan.md#approval)
and [workspace dependency scope](Workspace%20Dependencies.md). This bounded non-React testing use does not require
the React plugin, Storybook or a frontend application, change production compilation, or authorize runtime Vite.
It introduces no frontend runtime dependency, React/Storybook/jsdom/Testing Library requirement or broadened
application testing scope. Exact direct pins remain in its manifest and the
[workspace dependency note](Workspace%20Dependencies.md).
