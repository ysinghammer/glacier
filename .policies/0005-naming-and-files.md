# 0005 — Naming and files

1. Project-authored folders beneath `src/` MUST use descriptive camelCase and the prescribed layer-first architectural paths from policy 0003. Domain folders MUST describe their owning capability (`requestHandling`, `openApiGeneration`, `dependencyInjection`); nested responsibility folders MUST follow the same naming convention (`compilerMetadata`, `jsonSchema`). Generic `utils`, `helpers`, or shared dumping grounds MUST NOT replace semantic ownership. Names MUST use descriptive domain language, not unexplained abbreviations/vague placeholders. Workspace package directory names and externally mandated directories MUST retain their prescribed names; source-folder camelCase MUST NOT rename packages or change dot-separated filename roles. Test-folder naming remains governed by the applicable testing policies, not the production source layout. Preexisting library source folders MAY retain their spelling only during the migration compatibility period defined by policy 0003.
2. Variables, parameters, properties, functions, and methods MUST use camelCase; classes MUST use PascalCase without an `I` prefix. Interfaces/named type aliases MUST use PascalCase with `I`, except aliases consisting solely of class-instance unions MUST omit `I`. Interface/string-literal unions do not qualify. Boolean names MUST be affirmative predicates (`isReady`, `hasAccess`, `canSubmit`). Acronyms MUST be words (`HttpClient`, `userId`), except externally defined spellings. Hungarian notation and underscore prefixes MUST NOT be used.
3. True module-level fixed constants MUST use UPPER_SNAKE_CASE. Local bindings/other `const` values MUST use camelCase, except React context values MUST use PascalCase (`OrderContext`). Components MUST use PascalCase; custom hooks MUST use camelCase beginning with `use`. JSX files MUST use `.tsx`; hooks/context files without JSX MUST use `.ts`.
4. Source filenames MUST align a responsibility stem with the primary symbol: PascalCase for classes/types/React contexts, camelCase for permitted functions. Applicable files MUST use one dot-separated role suffix before `.ts`/`.tsx`, without repeating the terminal role word in the stem (`PostgresOrder.repository.ts` for `PostgresOrderRepository`; `IOrderRepository.port.ts` retains its contract stem). Roles MUST reflect primary responsibility, not be chained; ordinary files without a matching role MUST remain unsuffixed.

| Closed role  | Exact responsibility                                     |
| ------------ | -------------------------------------------------------- |
| `repository` | Concrete capability-owned persistence implementation     |
| `controller` | Transport entry controller                               |
| `service`    | Specifically named service responsibility, not catch-all |
| `model`      | Data representation without entity domain identity       |
| `dto`        | Boundary data contract                                   |
| `entity`     | Domain identity and invariants                           |
| `route`      | Transport route definition/registration                  |
| `view`       | Screen/page                                              |
| `element`    | Low-level UI primitive                                   |
| `component`  | Reusable composite UI                                    |
| `connected`  | Smart React side-effect/external-state component         |
| `port`       | Consumer-owned dependency/invocation contract            |
| `adapter`    | Integration implementation without a more specific role  |
| `use-case`   | Application operation                                    |
| `hook`       | React custom hook                                        |
| `context`    | React context definition                                 |
| `provider`   | React provider component                                 |
| `factory`    | Construction responsibility                              |
| `mapper`     | Representation conversion                                |
| `schema`     | Schema definition/validation                             |
| `error`      | Exceptional failure type                                 |
| `config`     | Configuration contract/assembly                          |

5. The role vocabulary MUST NOT be extended without an explicitly approved update to this policy. Roles MUST NOT change layers or require unused classes, wrappers, directories, abstractions, or a fixed UI hierarchy. Required `src/Application.bootstrap.ts`, package-root `index.ts`, and externally mandated filenames MUST retain their prescribed names.
6. Runner suffixes MUST replace, not chain with, production roles: Playwright `.spec.ts`, Vitest runtime `.test.ts`/`.test.tsx`, and type contracts `.test-d.ts`; stems MUST identify public scenarios/API contracts, not implementation files. Storybook MUST use PascalCase component stems with `.stories.tsx` (`Button.stories.tsx`), as a suffix rather than prefix, replacing production roles. These are filename exceptions, not additions to the production vocabulary. Supporting test code MUST retain ordinary naming rules.
