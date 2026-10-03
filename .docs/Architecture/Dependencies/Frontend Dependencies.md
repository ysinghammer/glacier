# Frontend dependencies

These are approved direct npm dependencies for the target [frontend techstack](../Techstack/Frontend%20Techstack.md). Shared TypeScript, Vitest, Playwright, and Testcontainers tooling is in [workspace dependencies](Workspace%20Dependencies.md).

| npm package | Kind | Why it is used |
| --- | --- | --- |
| `react` | Runtime | Build frontend application interfaces. |
| `react-dom` | Runtime | Render React applications in the browser. |
| `@types/react` | Development | Provide TypeScript types for React. |
| `@types/react-dom` | Development | Provide TypeScript types for React DOM rendering. |
| `storybook` | Development | Run and build React component documentation in applications and libraries. |
| `@storybook/react` | Development | Provide React integration and story types for Storybook component documentation. |
| `vite` | Development | Build frontend applications and serve as the Storybook builder. |
| `@vitejs/plugin-react` | Development | Compile React JSX in Vite. |
| `@storybook/react-vite` | Development | Vite-based Storybook framework for React. |
| `@storybook/addon-vitest` | Development (React library testing only) | Run component stories with play functions as Vitest browser-mode tests. |
| `@vitest/browser` | Development (React library testing only) | Provide Vitest browser mode for story-run tests. |
| `@vitest/browser-playwright` | Development (React library testing only) | Run browser-mode tests with the Playwright provider. |
| `playwright` | Development (React library testing only) | Browser automation required by the Playwright browser-mode provider; not for application acceptance tests. |
| `jsdom` | Development (React library testing only) | DOM environment for hook tests. |
| `@testing-library/react` | Development (React library testing only) | Render hooks with `renderHook` in Vitest tests. |
| `@testing-library/dom` | Development (React library testing only) | Required peer of `@testing-library/react`. |

Storybook runs on Vite through `@storybook/react-vite`. Library component stories are executed as tests under
[ADR-0005](../Decisions/ADR-0005-Testing-strategy.md); application stories are documentation only. Any additional direct
integration packages require explicit approval under [ADR-0001](../Decisions/ADR-0001-Techstack.md).
