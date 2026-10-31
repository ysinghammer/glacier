# 0003 — Capabilities and boundaries

1. Every package MUST organize production source by architectural layer first, then by domain-oriented capability. In these paths, `<domain>` names the owning capability, not a requirement to place all of its code in the `domain/` layer. Each capability MUST own a coherent responsibility, concepts, behavior, invariants/policies, and relevant state. Boundaries MUST follow shared invariants and reasons to change, not merely nouns, REST resources, API versions, or database tables. Capabilities MUST NOT be equated with npm packages/services: packages are distribution boundaries and capabilities MAY span packages. Layer-first organization MUST NOT transfer ownership to global technical buckets.
2. Applications and libraries MUST place applicable layers directly under `src/` and camelCase domain folders directly within those layers, using the same domain name wherever that capability participates. Single-capability libraries MUST also use domain folders; they MUST NOT omit this ownership level. Optional cohesive responsibility folders MAY exist beneath a domain folder, but MUST NOT recreate a feature-first tree containing architectural layers. Optional standard grouping folders defined by policy 0005 MAY exist within an owning capability or its semantic responsibility folders, subordinate to the prescribed port/adapter paths where applicable. These groups MUST NOT replace capability ownership or become layer-wide/package-wide technical buckets. Existing layers MUST use these paths; unneeded layers MUST be omitted rather than populated with artificial entities, aggregates, repositories, interfaces, or empty skeletons.

| Path                                             | Responsibility                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `src/domain/<domain>/`                           | Capability concepts, invariants, policies                               |
| `src/application/<domain>/`                      | Use cases coordinating domain behavior                                  |
| `src/application/<domain>/ports/inbound/`        | Optional invocation contracts                                           |
| `src/application/<domain>/ports/outbound/`       | Application-needed external capability contracts                        |
| `src/infrastructure/<domain>/adapters/inbound/`  | HTTP controllers, CLI commands, message consumers                       |
| `src/infrastructure/<domain>/adapters/outbound/` | Persistence, external API, environment and other integrations           |
| `src/presentation/<domain>/`                     | React components/hooks/contexts and rendering-only behavior/state       |
| `src/bootstrap/`                                 | Application-wide supporting composition/lifecycle, outside capabilities |

3. Application dependencies MUST point inward to domain, not infrastructure, presentation, or bootstrap. Infrastructure/presentation MUST depend on the application operations and domain contracts they serve, never reverse this direction. Domain MUST remain independent of React, Glacier framework facilities, transport/persistence implementations, and environment access. Application MUST remain technology-independent and access external I/O through owned ports, not concrete clients/framework facilities. Inner layers MAY use approved pure supporting libraries and compatible deliberate public domain/application APIs.
4. Ports MUST belong to their consuming layer and capability. Genuinely domain-owned contracts MUST stay in `src/domain/<domain>/`; application ports MUST use the specified paths. Direct application invocation MAY omit inbound interfaces. HTTP/browser-storage I/O MUST use outbound adapters. Framework libraries MUST treat their own meaningful concepts as domain where applicable, without artificial business entities; consumer business domains MUST remain framework-independent and be connected through adapters/composition.
5. Cross-capability dependencies MUST be deliberate, public, and acyclic, including within one package. Consumers MUST NOT import another capability's internals. Domain/application consumers MUST use compatible public domain/application operations/contracts; replaceable external behavior MUST use consumer-owned ports when direct consumption would couple implementations. Adapters/composition MAY use explicitly public concrete integration APIs needed to connect implementations; presentation MAY deliberately reuse public components/hooks, but domain/application MUST NOT consume presentation APIs.
6. Each library MUST expose its curated public API, including required adapter factories/registration functions, through package-root `index.ts` outside `src/`. Its `package.json` export map MUST expose only the root entry, prohibiting public subpaths/deep imports, except for `@glacier/reflection`'s sole `"./register"` exception: a minimal package-root `register.ts` with zero public symbols that explicitly activates only the compiler protocol. It is not a second barrel or a general subpath permission. Application capability APIs MUST also be explicitly identified and curated; package exports MUST NOT be treated as protection inside a package. Illustrative framework package names are not a mandatory inventory.
7. Shared concepts MUST enter a small shared kernel only when semantics and ownership are genuinely shared. Similar code with different meanings MUST remain separate, not become a generic shared bucket. Repositories MUST stay capability-owned. Cross-capability consumers MUST use public query operations/their own ports, not a global repository folder exposing all persistence. Separate ports MUST NOT imply duplicate database implementations; shared connections/transaction infrastructure MUST NOT transfer repository ownership.

## Layout example

The HTTP library's request handling and OpenAPI generation illustrate the ownership level. Only layers and responsibility folders containing real code exist:

```text
index.ts
src/
  domain/
    requestHandling/
      requests/
      responses/
      routing/
      server/
    openApiGeneration/
  application/
    requestHandling/
    openApiGeneration/
  infrastructure/
    requestHandling/
      adapters/inbound/
    openApiGeneration/
      adapters/inbound/
```

## Migration compatibility

Existing libraries MAY retain their preexisting source layout temporarily until their library-wide structural migration. New libraries and newly introduced capabilities MUST use the layer-first layout. A library's structural migration MUST move all of its production source to the prescribed paths, update relative imports, public-entry references, path-sensitive tooling and documentation together, and preserve public exports and behavior. It MUST NOT leave parallel old/new implementations, add compatibility barrels/deep exports, or move scenario tests into production layers. Unrelated behavior changes MUST remain separate from the structural migration.
