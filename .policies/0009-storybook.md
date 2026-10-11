# 0009 — Storybook

1. Every React component in applications/libraries MUST have an adjacent `.stories.tsx` file, including connected components. A subcomponent exclusively composing one parent MAY omit its separate story file only while represented through that parent's stories. Independent use or use by another component MUST require its own stories. This exception MUST NOT waive assertions or coverage.
2. Stories MUST provide component documentation using Storybook with `@storybook/react-vite` and Vite. Frontend application stories MUST remain documentation only, MUST NOT be discovered/run as tests, and MUST NOT replace full-stack acceptance verification.
3. In React libraries, stories MUST also be component tests with play functions meaningfully asserting applicable success, failure, and boundary behavior. Parent stories MUST exercise exempt subcomponents. Smart/dumb separation MUST NOT create an additional story/testing exemption.
4. Library component stories MUST execute through `@storybook/addon-vitest` as a separate Vitest browser-mode project using the Playwright provider, with discovery restricted to `src/**/*.stories.tsx`.
5. Frontend scaffolding MUST configure Vite, Storybook, and `.stories.tsx` discovery; React-library scaffolding MUST configure the addon/browser project. Stories MUST be maintained alongside components.

Provenance: ADR-0001/0004/0005; Frontend Techstack; React Rules.
