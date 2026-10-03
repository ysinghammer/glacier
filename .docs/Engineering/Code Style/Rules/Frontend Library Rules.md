# Frontend library rules

Apply the [general rules](General%20Rules.md) and [package architecture ADR](../../../Architecture/Decisions/ADR-0002-Package-architecture.md).
Apply [React rules](React%20Rules.md) to presentation code.

A rendering-only UI library can omit domain, application, and infrastructure:

```text
index.ts
package.json
src/
  presentation/
    Button.element.tsx
```

- Export public components, hooks, and any other public imports through package-root `index.ts`. Configure `package.json` exports to allow only the package-root entry, without public subpaths or deep imports.
- Place React components, hooks, and rendering-specific state in `presentation/`. Add `domain/`, `application/`, and outbound infrastructure adapters only when the library owns corresponding rules, use cases, or integrations.
- Keep non-rendering domain/application behavior independent of React. Libraries containing multiple capabilities group their layers by capability beneath `src/`.
- Allow intentional reuse through other libraries' public presentation APIs, not their internal files.
- Provide no bootstrap entry or `bootstrap/` layer and no resource startup on import. Expose any required factories, registration functions, or lifecycle operations for the consuming application to invoke.
- Test every public runtime export with Vitest. Components are tested through their `.stories.tsx` play functions, run by
  Storybook's Vitest addon in browser mode; hooks and other exports are tested through the package-root API under the
  library's `tests/`, using jsdom and Testing Library for hooks. Meet 100% coverage per library and per file. Document representative public API usage examples. Follow
  [ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md) and the
  [testing guidelines](../../Guidelines/Overview.md#testing) for layout, doubles, discovery, and enforcement.
