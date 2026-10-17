# Module composition

Lets consumers split an application into `@Module` classes that own their providers, share only what they
export, re-export imported modules, publish container-wide `global` modules and configure modules at runtime
with dynamic modules such as `forRoot()`. Public contract: `Module`, `IModuleOptions`, `IDynamicModule`,
`GlacierContainer.create/get/select` and `ModuleLookup` of the package-root API of `@glacier/ioc`.
Story-local criteria are `AC-001`..`AC-005` of story 003.

| ID      | Title                                  | Verifies                                                               | Source           | Test                                                 |
| ------- | -------------------------------------- | ---------------------------------------------------------------------- | ---------------- | ---------------------------------------------------- |
| IOC-011 | Private and exported providers         | Own, imported-export and private visibility; invalid exports rejected  | story 003 AC-001 | [ModuleVisibility.test.ts](ModuleVisibility.test.ts) |
| IOC-012 | Re-exports of imported modules         | Re-exported modules and tokens are visible; others stay hidden         | story 003 AC-001 | [ModuleVisibility.test.ts](ModuleVisibility.test.ts) |
| IOC-013 | Global modules                         | Global exports are visible everywhere reachable; private ones are not  | story 003 AC-002 | [GlobalModules.test.ts](GlobalModules.test.ts)       |
| IOC-014 | Dynamic modules extend static metadata | Dynamic lists append to `@Module`; `global` overrides; roots supported | story 003 AC-003 | [DynamicModules.test.ts](DynamicModules.test.ts)     |
| IOC-015 | Strict and non-strict lookup           | `strict: true` follows visibility; `false` searches the container      | story 003 AC-004 | [ModuleLookup.test.ts](ModuleLookup.test.ts)         |
| IOC-016 | Module de-duplication                  | A module imported repeatedly yields one module and one provider set    | story 003 AC-005 | [ModuleLookup.test.ts](ModuleLookup.test.ts)         |
| IOC-017 | Invalid modules are rejected eagerly   | Undecorated, malformed or unsatisfiable modules fail `create` together | story 003 AC-001 | [ModuleValidation.test.ts](ModuleValidation.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario IOC-nnn` line. Type contracts live in
[`tests/contracts`](../../contracts/ModuleContracts.test-d.ts).

`get` defaults to `strict: false` on the container and `strict: true` on a module selected with
`select(Module)`. Without `strict`, a token not visible to the root is searched in every module, dependents
before their imports.
