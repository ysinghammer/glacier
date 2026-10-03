---
status: accepted
created: 2026-10-03
tags:
  - ADR
---

# ADR-0003: Code style

## Context

ADR-0001 selects
TypeScript, Oxlint, Oxfmt, and Turborepo; ADR-0002 defines package architecture. Contributors also need consistent
naming, implementation, documentation, and quality standards.

Readability takes precedence over brevity. Class-based behavior and static utility methods are chosen over standalone
functions, with exceptions for framework and platform APIs that require functions. Role suffixes make file responsibilities
discoverable without imposing additional architectural layers. Oxfmt defaults are chosen over separately maintained
formatting preferences, and responsibility-based review over arbitrary file-size and complexity limits.

This decision defines framework-neutral code conventions. React-specific conventions belong to ADR-0004. Testing is
defined by ADR-0005; this decision authorizes its test-filename conventions without adding testing policy.
Storybook's component documentation requires dedicated filenames and metadata/story exports; these are narrow
exceptions rather than changes to production naming or export boundaries.
React's smart/dumb separation uses the `connected` production role for smart components, as defined by ADR-0004.

Husky and lint-staged provide the fast staged-file feedback selected by ADR-0001. Their pre-commit checks are distinct
from the Turbo-based checks required for accepting a code change.

## Decision

### Naming and files

- Source folders must use descriptive kebab-case names and the architectural paths required by ADR-0002. Names must
  express capability or responsibility rather than creating generic `utils`, `helpers`, or shared dumping grounds.
- Variables, parameters, properties, functions, and methods must use camelCase. Classes must use PascalCase. Interfaces
  and named type aliases must use PascalCase with an `I` prefix, except aliases consisting solely of a union of class
  instance types, which must omit the prefix.
- Boolean names must express affirmative predicates such as `isReady`, `hasAccess`, and `canSubmit`. Acronyms must be
  treated as words, as in `HttpClient` and `userId`, except when preserving externally defined names. Names must not use
  Hungarian notation or underscore prefixes.
- True module-level fixed constants must use UPPER_SNAKE_CASE; local bindings and other `const` values must use
  camelCase, except that a React context value must use PascalCase, as in `OrderContext`. Names must use descriptive
  domain language rather than unexplained abbreviations or vague placeholders.
- Source filenames must use a responsibility stem aligned with the primary symbol: PascalCase for classes, types, and
  React contexts, and camelCase for permitted functions. Applicable files must append one dot-separated role suffix before `.ts` or
  `.tsx`; the stem must not repeat the terminal role word. For example, `PostgresOrder.repository.ts` exports
  `PostgresOrderRepository`, and `IOrderRepository.port.ts` exports `IOrderRepository`.
- Role suffixes must come from this closed set: `repository`, `controller`, `service`, `model`, `dto`, `entity`, `route`,
  `view`, `element`, `component`, `connected`, `port`, `adapter`, `use-case`, `hook`, `context`, `provider`, `factory`, `mapper`,
  `schema`, `error`, and `config`. Files must use the role representing their primary responsibility, not a chain of
  suffixes. Files without an applicable role must omit the suffix; additions to the vocabulary must update this decision
  and its companion rules.
- Required `src/Application.bootstrap.ts` entries, package-root `index.ts`, and externally mandated filenames must
  retain their prescribed names. Role names must not require unused layers, classes, or abstractions.
- Test files must use ADR-0005's dedicated suffixes: `.spec.ts` for Playwright, `.test.ts` or `.test.tsx` for Vitest
  runtime tests, and `.test-d.ts` for library type-contract checks. Test stems must identify their public scenario or
  API contract rather than an internal implementation file. These suffixes must be test-specific naming exceptions,
  not additions to the production role vocabulary, and must replace rather than chain with production role suffixes.
  Supporting test code must retain the ordinary naming rules.
- Storybook story files required by ADR-0004 must use a PascalCase component stem and the `.stories.tsx` suffix, for
  example `Button.stories.tsx`. This suffix must replace rather than chain with a production role suffix and must not
  extend the production role vocabulary.

### Readable, class-first implementation

- Standalone behavior must be implemented in classes rather than standalone functions. Utilities must use static methods
  on purpose-specific classes, not a general utility container. Stateless operations must not require artificial state.
- Functions must be limited to framework/platform-required entry points and callbacks, including React function components
  and hooks. Callbacks must stay focused and delegate substantial behavior to named methods. Plain records, interfaces,
  and type aliases must remain valid data contracts; behaviorless classes must not be manufactured merely to hold data.
- Code must favor explicit, straightforward control flow over clever expressions, compressed statements, nested ternaries,
  or abstraction solely to reduce line count. Files and methods must have cohesive responsibilities; guard clauses must
  be used where they improve clarity.
- Bindings must use `const` by default and `let` only for reassignment; `var` must not be used. Contracts not intended
  for mutation must use readonly members or collections. Runtime-private class state must use native `#private` fields.
- Speculative abstractions, dead code, unexplained magic values, and accidental import-time side effects must not be
  introduced. Named constants must explain meaningful fixed values. Reuse must respect semantic ownership under ADR-0002.

### TypeScript and modules

- Compiler configuration must enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- Local types must be inferred when clear. Public methods and permitted exported functions must declare return types.
  Untrusted values must enter as `unknown` and be narrowed or validated before use.
- Routine `any`, unchecked type assertions, non-null assertions, and `@ts-ignore` must not be used. Unavoidable
  interoperability exceptions must be narrow, justified, and must not silently weaken surrounding contracts.
  Finite scalar choices must use string-literal unions rather than enums.
- Imports used only as types must use `import type`. Each source file must have at most one primary named export, with only
  supporting interfaces needed to describe or consume that export allowed as additional exports. Private helpers and
  types must stay unexported. Default exports must be limited to externally required conventions.
- Storybook `.stories.tsx` files must be exempt from the single-primary-export rule only for their default metadata
  export and named story exports. This exception must not authorize production barrels or unrelated exports.
- Each library's package-root `index.ts` must remain its curated public barrel as required by ADR-0002 and must be exempt
  from the single-export rule. All other barrel files and convenience re-exports must be prohibited. Public capability
  APIs inside applications must be explicitly identified single-export files, not barrels.
- Imports within a package must use relative paths, including across deliberately public capability files. Imports between
  packages must use the supplying package's public root, not relative traversal into another package or deep imports.
  TypeScript path aliases and equivalent internal import aliases must not be used; normal package names are not aliases.
  Type declarations must remain permitted. Module-extension syntax must follow the eventual build/runtime configuration.

### Failures and asynchronous behavior

- Expected validation and business rejections must use typed discriminated outcomes. Exceptional failures must use thrown
  `Error` instances, with specific subclasses where callers need to distinguish them and causes preserved when wrapping.
- Untrusted input must be validated at adapters, while domain invariants must be enforced by the domain. Public
  boundaries must translate failures without disclosing secrets or implementation details.
- Errors must be caught only for recovery, translation, or cleanup. Failures must not be swallowed, replaced with
  success-shaped fallbacks, or logged with secrets. Observability must respect layer independence and avoid redundant
  logging of the same failure at every layer.
- Promises must be awaited, returned, or explicitly supervised with observable failure handling. Unsupervised
  fire-and-forget work must not be used. Resource handling must preserve ADR-0002's construction, startup, cleanup,
  and dependency-aware shutdown requirements.

### Documentation and acceptance

- Classes, methods, interfaces, named type aliases, and permitted standalone functions must have JSDoc explaining their
  purpose and contract. JSDoc must describe applicable inputs, outcomes, failures, mutation, and lifecycle obligations
  rather than merely repeat names. Inline comments must explain non-obvious reasons or constraints, not narrate code.
- Formatting must follow Oxfmt defaults. Contributors must not maintain competing handwritten whitespace, quote, or
  line-length rules.
- After every code change, contributors must run Oxlint and Oxfmt compliance checks through Turborepo, using pnpm, and
  resolve violations before acceptance. Applicable type-check and build tasks must also pass. Editor formatting or
  invoking the tools directly must not substitute for the Turbo checks.
- Husky pre-commit hooks must invoke lint-staged through pnpm for quick Oxlint and Oxfmt compliance checks on matching
  staged files. lint-staged may invoke these tools directly for file-scoped feedback, but a successful hook must not
  substitute for the Turbo checks above. Failed staged-file checks must block the commit until violations are resolved.
- Requirements not enforceable by the configured tools must still be reviewed manually. Suppressions must be narrowly
  scoped and justified, not broad file-level escapes. An exception conflicting with an accepted ADR must be authorized
  by updating that ADR before acceptance.
- Workspace scaffolding must provide the required compiler settings, Turbo lint/format-check tasks, and Husky/lint-staged
  configuration. Documentation must not claim automated enforcement or successful execution of unavailable checks.

## Consequences

Consistent role names, class-based behavior, explicit exports, and JSDoc improve discoverability and contract clarity.
The interface/type prefix distinguishes contracts from classes, but class-union aliases require a specific exception.
Single-export files increase file count and prohibit convenient exported companion type aliases; supporting interfaces
and the required public library barrel are deliberate exceptions.
Dedicated test suffixes keep runner discovery explicit without extending the production role vocabulary.
The dedicated Storybook suffix and metadata/story export exception support component documentation without weakening
production naming and export rules.

Class-first conventions require some additional structure compared with standalone functions. Readability and cohesive
responsibilities remain the goal, not mandatory state or new architectural layers. Framework/platform callbacks remain
practical without weakening the default.

Scaffolding must implement the specified checks and compiler configuration. Automated coverage of semantic naming and responsibility rules may be
incomplete, so review remains necessary.

Staged-file pre-commit checks shorten the feedback loop without running builds or container-backed tests on every commit.
They do not validate unstaged files or replace the required workspace checks and CI.

## Related notes

- [Code style rules](../../Engineering/Code%20Style/Rules/Code%20Style%20Rules.md)
- [Code style overview](../../Engineering/Code%20Style/Overview.md)
- [ADR-0001: Techstack](ADR-0001-Techstack.md)
- [ADR-0002: Package architecture](ADR-0002-Package-architecture.md)
- [ADR-0005: Testing strategy](ADR-0005-Testing-strategy.md)
- [ADR-0004: React conventions](ADR-0004-React-conventions.md)
