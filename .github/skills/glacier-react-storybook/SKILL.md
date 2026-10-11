---
name: glacier-react-storybook
description: Implement and verify Glacier React presentation and Storybook conventions. Use for smart/dumb boundaries, hook/context ownership, accessible states, adjacent stories, and application-versus-library story execution.
---

# Glacier React and Storybook

## Triggers

Use for approved React components, hooks, contexts/providers, presentation
composition, stories, or their test configuration. Do not introduce React into
technology-neutral libraries.

## Inputs and prerequisites

Read every policy, especially [React](../../../.policies/0008-react.md),
[Storybook](../../../.policies/0009-storybook.md),
[library testing](../../../.policies/0010-library-testing.md), and
[dependency scopes](../../../.policies/0002-technology-and-dependencies.md).
Require approved UI outcomes, package type, application/domain public APIs,
current JSX/build configuration, and explicit dependency approvals.

## Procedure

1. Keep domain rules and use-case orchestration out of components/hooks. Put
   HTTP/browser-storage I/O in outbound adapters and invoke deliberate public
   application operations. Presentation integration is not an application layer.
2. Use function components, not classes or `React.FC`, with explicit `I...Props`
   interfaces. Split components reading external state or performing effects
   into smart integration and separate dumb rendering files, even when a hook
   hides integration or there is no `useEffect`. Do not add wrappers to wholly
   self-managed components.
3. Smart components supply resolved values, applicable loading/empty/error states,
   and interaction callbacks. Dumb components use props and entirely owned local
   UI state/pure hooks, not clients, stores, contexts, router access, timers, or
   imperative DOM work. Parent props are permitted, not forbidden external access.
4. Keep context definitions/providers in separate files; use `.tsx` for JSX,
   `.ts` otherwise, and policy 0005's responsibility suffixes. Hooks remain
   unconditional/top-level; do not mutate props/state or duplicate derived state.
5. Effects synchronize external systems, with truthful dependencies and cleanup.
   Prevent stale async results from updating obsolete consumers. Await/return or
   supervise promises with observable errors. Memoization needs an identified
   performance/identity reason, not a default habit; lists need stable identity keys.
6. Use semantic native controls, labels, accessible names, keyboard operation, and
   visible focus. Make applicable loading/empty/error states explicit and actionable
   without exposing secrets or confusing rejections with exceptional failures.
   Do not invent a styling/router/design-system dependency.
7. Add adjacent PascalCase `.stories.tsx` files for every component, including
   connected components. Only a subcomponent exclusively composing one parent may
   rely on its parent's stories; independent/reused components need their own.
   Default metadata/multiple story exports are the Storybook-only export exception.
8. Configure approved React/Vite Storybook tooling. Application stories are
   documentation only: exclude them from test execution and prove application
   outcomes with [acceptance scenarios](../glacier-acceptance-scenarios/SKILL.md).
9. React-library stories are tests: meaningful play assertions for applicable
   success/failure/boundaries, including exempt subcomponents. Use the approved
   addon in a separate Vitest Playwright browser project restricted to
   `src/**/*.stories.tsx`. Test hooks with jsdom/Testing Library `renderHook`, not
   React mocks. Combine story/Node/browser coverage through
   [library contracts](../glacier-library-contracts/SKILL.md); Chromium only.
10. Update public examples/docs and execute applicable build/type/lint/format and
    story/library or real-stack checks through current workspace tasks.

## Outputs and handoff evidence

Supply smart/dumb ownership, public operation/adapter references, component state
and accessibility evidence, adjacent story coverage, exact execution commands and
results, combined library coverage where applicable, and remaining limitations.

## Approval and stop gates

Unapproved dependencies, hidden rendering integration, missing stories/assertions,
unhandled states/resources, or failed required checks blocks completion. Do not
claim application stories are acceptance tests or grant a story/coverage exemption
merely because a component was split.
