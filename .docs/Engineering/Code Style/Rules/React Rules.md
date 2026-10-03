# React rules

[ADR-0004: React conventions](../../../Architecture/Decisions/ADR-0004-React-conventions.md) is authoritative.
Apply the [code style rules](Code%20Style%20Rules.md) and
[package architecture](../../../Architecture/Decisions/ADR-0002-Package-architecture.md) alongside this note.

## Components, hooks, and files

Use function components, not class components or `React.FC`. React components/hooks and required callbacks are exceptions
to class-first implementation, not a reason to move standalone application behavior into functions.

Use PascalCase component names and explicit `I...Props` interfaces for components accepting props. Keep one primary
export; a supporting props interface may accompany it. Document components, hooks, and their contracts with JSDoc.
For example, `OrderSummary.component.tsx` can contain:

```tsx
import type { JSX } from "react";

/** Values displayed by the order summary. */
export interface IOrderSummaryProps {
  readonly orderId: string;
}

/** Displays the identity of an order. */
export function OrderSummary({ orderId }: IOrderSummaryProps): JSX.Element {
  return <p>Order: {orderId}</p>;
}
```

The example assumes the automatic JSX runtime; runtime imports must follow the eventual JSX/module configuration.
Custom hook names begin with `use`,
as in `useOrders.hook.ts`. Files containing JSX use `.tsx`; other hook/context files use `.ts`.

| Role | Meaning | Example |
|---|---|---|
| `view` | Screen/page | `OrderDetails.view.tsx` |
| `component` | Reusable composite | `OrderSummary.component.tsx` |
| `connected` | Smart component handling side effects or external-state access | `OrderSummary.connected.tsx` |
| `element` | Low-level UI primitive | `Button.element.tsx` |
| `context` | React context definition | `Order.context.ts` |
| `provider` | Provider component | `Order.provider.tsx` |

Name a context value in PascalCase, as in `OrderContext` exported from `Order.context.ts`.
Roles do not require wrappers or a hierarchy. A context definition and its provider belong in separate files to respect
the single-primary-export rule. Only library package-root barrels are allowed; imports inside a package remain relative.

## Storybook stories

Every React component in applications and libraries needs an accompanying `.stories.tsx` file, for example
`Button.stories.tsx` for `Button.element.tsx`. Use `.stories` as a suffix, not a prefix, and replace rather than chain
the production role suffix.

A subcomponent used exclusively to compose a single parent does not need its own story file; represent it through
the parent's stories. For example, if `Button` contains `ButtonIcon` and `ButtonLabel`, and neither is ever used
outside `Button`, only `Button` needs a story file. If either is later used independently or by another component,
it needs its own story file.

Story files may use Storybook's default metadata export and named story exports, as permitted by
[ADR-0003](../../../Architecture/Decisions/ADR-0003-Code-style.md). In applications, stories are documentation only and
do not replace the acceptance tests required by
[ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md). In React libraries, a component's stories are
its tests: add play functions with meaningful assertions, and exercise exempt subcomponents through the parent's
stories. The exemption applies only to separate story files, not to testing or coverage.

## Boundaries and state

Keep components, hooks, contexts, and rendering-only state in `presentation/`. Domain invariants belong in the domain;
application orchestration belongs in class-based application operations. HTTP and browser-storage clients remain outbound
adapters, not concrete clients hidden inside hooks.

Call hooks unconditionally at the top level of components or custom hooks. Do not mutate props or state. Keep only the
minimum source of truth in state, and calculate derived values while rendering rather than duplicating them in state.

## Smart and dumb components

Components with side effects or access to state not entirely managed by themselves must split into a smart component
and a separate dumb rendering component. Use `OrderSummary.connected.tsx` for the smart component and
`OrderSummary.component.tsx` for a reusable composite renderer. `.connected` replaces rather than chains with another
production role suffix; dumb screens/pages and primitives retain `.view.tsx` and `.element.tsx`. Keep one primary
component export per file, with distinct names such as `OrderSummaryConnected` and `OrderSummary`.

The smart component owns external integration, directly or through custom hooks. Pass all externally sourced display
values, applicable loading/empty/error states, and interaction callbacks as explicit props to the dumb component.
Pass resolved values and callbacks, not clients, stores, or integration handles that make the renderer resolve its own
external dependencies. Keep domain rules, application orchestration, and concrete I/O in their existing architectural
layers; a connected component coordinates the presentation boundary, not a replacement application layer.

External-state access includes reading or updating context, shared stores, router state, or subscribed data, even when
no `useEffect` is involved. Side effects include network/storage I/O, subscriptions, timers, and imperative browser/DOM
interactions such as focus or measurement. This applies to event handlers as well as effects. Hiding any of these
operations in a custom hook or helper does not make a rendering component dumb.

A dumb component renders from props and entirely component-owned UI state. It may calculate pure derived values,
use hooks for fully local state or pure rendering computations, and invoke supplied callbacks in response to user
interaction. For example, it may own an expanded/collapsed toggle, but reading shared expansion state from context
belongs in the smart component. Receiving props from a parent is allowed; resolving external state itself is not.

Do not introduce smart wrappers for components without side effects or external-state access. Extracting an integration
hook alone is not a substitute for the required component split. The split does not create a Storybook or testing
exemption: apply the existing story ownership, private-subcomponent exception, and ADR-0005 requirements to both roles.

## Effects and rendering

Effects synchronize with external systems. Do not use them to calculate derived state or replace event handlers.
Include actual reactive dependencies, clean up subscriptions/resources, and guard asynchronous completion against stale
results or obsolete consumers. Do not suppress dependencies to force an execution schedule.

Use `useMemo`, `useCallback`, and `memo` only for an identified performance or identity requirement. Use stable,
identity-based list keys; do not generate keys while rendering or use array positions when order/identity can change.

## Accessible and complete interaction

Prefer semantic HTML and native controls. Provide accessible control names and input labels, keyboard operation, and
visible focus. Use ARIA to supplement appropriate semantics, not to recreate an existing native control unnecessarily.

Represent loading, empty, and error states when applicable. Show actionable errors without exposing secrets, retaining
the general distinction between expected rejection and exceptional failure.

React changes require the general type-check/build acceptance and Oxlint/Oxfmt compliance checks through Turbo after
every code change. This note does not add testing, styling-library, routing-library, or visual-design decisions.
