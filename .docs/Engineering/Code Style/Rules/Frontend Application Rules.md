# Frontend application rules

Apply the [general rules](General%20Rules.md) and [package architecture ADR](../../../Architecture/Decisions/ADR-0002-Package-architecture.md).
Apply [React rules](React%20Rules.md) to presentation code.

Group frontend code by capability, with React in `presentation/`. Omit layers a capability does not need:

```text
src/
  Application.bootstrap.ts
  bootstrap/
  presentation/
    Application.view.tsx
  catalog/
    domain/
    application/
      ports/
        outbound/
    infrastructure/
      adapters/
        outbound/
    presentation/
```

- Start through minimal `src/Application.bootstrap.ts`. Delegate supporting composition to `src/bootstrap/` where needed; place React mounting and JSX-containing application UI composition in presentation code.
- Keep React components, hooks, and rendering-only state in `presentation/`. Keep capability rules in domain and application orchestration in application, independent of React.
- Connect HTTP, browser storage, and other external I/O through owned ports and outbound adapters. Do not embed concrete clients in application code.
- Presentation may reuse explicitly public components or hooks from other capabilities. Domain and application must not import them.
- Use explicit registration and observable lifecycle management for resources where applicable. Verify behavior through the running application's public UI under [ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md).