---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0004: React conventions

## Context

ADR-0001 selects React for frontend applications, and ADR-0002 places React behavior in presentation layers.
ADR-0003 defines general code style, including class-first behavior with framework-required function exceptions.
React needs its own conventions for function components, hooks, state, effects, and accessible interaction.

Function components with explicit props contracts are chosen rather than class components or `React.FC`.
Memoization is tied to an identified benefit rather than added automatically. UI role names describe responsibility,
not a required component hierarchy.

Smart/dumb separation keeps external integration separate from rendering. Smart components own side effects and access
to externally managed state; dumb components receive those dependencies as resolved values and callbacks through props.
Fully component-owned UI state remains valid in dumb components, avoiding unnecessary wrappers for local interaction.
Moving external access into a hook alone does not establish this boundary.

Storybook stories document components without requiring separate entries for implementation-only subcomponents.
This decision does not select styling or routing libraries, define a visual design system, or add testing policy beyond making library stories the component tests that
ADR-0005 defines.

## Decision

- React components must be function components, not class components, and must not use `React.FC`. Components accepting
  props must declare an explicit `I...Props` interface. Components and props must follow ADR-0003's naming, JSDoc,
  imports, and single-primary-export conventions; a supporting props interface may be exported with its component.
- Components must use PascalCase names and `.tsx` when containing JSX. Custom hooks must use camelCase names beginning
  with `use`, with `.ts` unless JSX is required. Applicable filenames must use the general role vocabulary, for example
  `OrderSummary.component.tsx`, `OrderSummary.connected.tsx`, `OrderDetails.view.tsx`, `Button.element.tsx`, and
  `useOrders.hook.ts`.
- `view` must identify a screen/page; `component` must identify a reusable composite; `element` must identify a low-level
  UI primitive. `context` must identify a React context definition, and `provider` must identify its provider component.
  These roles must not require artificial wrappers, directories, or a fixed hierarchy.
- `connected` must identify a smart component that handles side effects or external-state access and supplies a separate
  dumb rendering component through props. Smart/rendering pairs must use distinct files, for example
  `OrderSummary.connected.tsx` and `OrderSummary.component.tsx`; `.connected` must replace, not chain with, another
  production role suffix. Dumb screens/pages and primitives must retain their applicable `view` and `element` roles.
- Components with side effects or access to state not entirely managed by themselves must separate those responsibilities
  into a smart component and a dumb rendering component. External-state access must include reading or updating context,
  shared stores, router state, and subscriptions, even when no `useEffect` is involved. Side effects must include external
  I/O, timers, subscriptions, and imperative browser/DOM interactions, whether initiated by effects or event handlers.
- Smart components must own external integration directly or delegate it to custom hooks. They must pass all
  externally sourced rendering values, applicable loading/empty/error states, and interaction callbacks to dumb
  components through explicit props. Dumb components must render from props and fully owned local UI state, and must
  not perform external side effects or access external state, directly or through hooks or other helpers. They may
  calculate pure derived values, manage entirely local UI state, and invoke supplied callbacks in response to interaction.
  Props supplied by a parent must not themselves count as prohibited external-state access; dumb components must not
  receive clients, stores, or other integration handles to resolve external dependencies themselves.
- Components without side effects or external-state access must not require artificial smart wrappers. Extracting a
  hook must not substitute for the required smart/dumb component separation.
- Components, hooks, React contexts, and rendering-only state must live in `presentation/`. Domain rules and application
  orchestration must remain outside React and independent of it, following ADR-0002. Custom hooks must not become
  alternative containers for use cases or concrete external clients.
- React function components and hooks, and callbacks required by React APIs, must be explicit exceptions to ADR-0003's
  class-first rule. Standalone non-React behavior must still use classes; utilities must still use static methods.
- Hooks must be called unconditionally at the top level of function components or custom hooks. Props and state must
  not be mutated. State must represent the minimum source of truth, with derived values calculated during rendering
  rather than duplicated in state.
- Effects must synchronize with external systems, not calculate derived state or substitute for event handlers.
  Dependencies must reflect reactive values used by the effect. Subscriptions and resources must be cleaned up, and
  asynchronous work must prevent stale completion from overwriting current state or updating an obsolete consumer.
- Memoization with `useMemo`, `useCallback`, or `memo` must address an identified performance or identity requirement,
  not be applied by default. Hook dependency rules must not be suppressed to force a desired execution schedule.
- Lists must use stable keys representing item identity, not generated values or array positions when identity or order
  can change.
- UI must use semantic HTML and native controls where appropriate. Interactive controls must have accessible names,
  inputs must have labels, and interactions must support keyboard operation and visible focus. ARIA must supplement
  rather than replace suitable native semantics.
- Data-dependent UI must represent applicable loading, empty, and error states explicitly. User-visible errors must be
  actionable without disclosing secrets. Expected business rejections and exceptional failures must retain the
  distinctions defined by ADR-0003.
- Every React component in applications and libraries must have an accompanying Storybook story file using the
  `.stories.tsx` suffix, for example `Button.stories.tsx`. A subcomponent used exclusively to compose a single parent
  component must be exempt from a separate story file and must be represented through that parent's stories. If it is
  used independently or by another component, it must have its own story file.
- Stories must serve as component documentation. In frontend applications they must not be run as tests and must not
  substitute for the full-stack acceptance tests required by ADR-0005. In React libraries, each component's stories must
  also be its required component tests: they must include play functions with meaningful assertions for applicable
  success, failure, and boundary behavior, and must be executed as defined by ADR-0005. A parent's stories must exercise
  its exempt subcomponents; the exemption must not waive any testing or coverage requirement.
- React changes must meet ADR-0003's review, type-check, build, and Turbo-based Oxlint/Oxfmt compliance requirements.

## Consequences

React-specific exceptions keep general code conventions framework-neutral while preserving idiomatic components and
hooks. Explicit props, state ownership, effect cleanup, and accessible interactions provide a common implementation
baseline without choosing styling or routing libraries.

Connected components make external dependencies and state ownership explicit, while prop-driven renderers remain usable
without external integrations. Separation adds files and prop contracts where integration is needed, but does not move
domain rules or application orchestration into presentation code, mandate stateless renderers, or change Storybook and
testing obligations. The `connected` role is part of ADR-0003's vocabulary; this rule requires manual review until
appropriate tooling exists.

Storybook makes component usage discoverable while parent stories keep private composition details from creating
redundant entries. Library stories double as component tests, so their play-function assertions need review as test
code. Stories require maintenance alongside their components. Future frontend scaffolding must configure Storybook and
discovery of `.stories.tsx` files.

Role distinctions and function exceptions need review; they do not override capability boundaries or authorize business
logic in hooks. Memoization requires a reason, not boilerplate. Tooling enforcement depends on workspace scaffolding.

## Related notes

- [React rules](../../Engineering/Code%20Style/Rules/React%20Rules.md)
- [Frontend application rules](../../Engineering/Code%20Style/Rules/Frontend%20Application%20Rules.md)
- [Frontend library rules](../../Engineering/Code%20Style/Rules/Frontend%20Library%20Rules.md)
- [ADR-0001: Techstack](ADR-0001-Techstack.md)
- [ADR-0002: Package architecture](ADR-0002-Package-architecture.md)
- [ADR-0003: Code style](ADR-0003-Code-style.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
