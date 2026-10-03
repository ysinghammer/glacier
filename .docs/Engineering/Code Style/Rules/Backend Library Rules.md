# Backend library rules

Apply the [general rules](General%20Rules.md) and [package architecture ADR](../../../Architecture/Decisions/ADR-0002-Package-architecture.md).

A focused framework or backend library usually provides one capability boundary. Its applicable layers sit directly beneath `src/`, but its public barrel sits at the package root:

```text
index.ts
package.json
src/
  domain/
  application/
    ports/
      outbound/
  infrastructure/
    adapters/
      outbound/
```

- Export all public imports through package-root `index.ts`, not `src/index.ts`. Configure `package.json` exports to allow only the package-root entry, with no public subpaths or deep imports.
- Omit unnecessary layers. Group by capability beneath `src/` if a library genuinely contains multiple capabilities.
- Treat framework concepts such as tokens, scopes, or configuration precedence as domain concepts where meaningful; do not manufacture business-style entities.
- Provide no bootstrap entry or `bootstrap/` layer, and do not start resources on import. Expose integration factories, registration functions, and explicit lifecycle operations through the barrel for consuming applications to invoke.
- Keep inner layers independent of concrete integrations and outer adapters. A capability can span packages, such as an HTTP contract library and an optional transport-adapter library; this does not authorize deep imports.
- Test every public runtime export with Vitest through the package-root API, keeping tests under the library's `tests/` and meeting
  100% coverage per library and per file. Document representative public API usage examples. Follow
  [ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md) and the
  [testing guidelines](../../Guidelines/Overview.md#testing) for layout, doubles, discovery, and enforcement.
