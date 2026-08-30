---
name: code-style
description: The mandatory TypeScript code style and architecture ruleset for this monorepo. Use whenever writing, generating, reviewing, or refactoring any TypeScript code in this repository (backend services, frontend apps, or shared packages).
---

# Glacier code style

Every rule below is a **MUST** or **MUST NOT**. There is no "should", "may", or "it depends" — if a
situation isn't covered by a rule here, it is not important enough to police, and normal judgment
applies. Do not invent exceptions to the rules that follow.

This ruleset applies uniformly to the entire monorepo (backend services, frontend apps, shared
packages) unless a rule explicitly says otherwise (the only carve-out is React components, see
"Frontend exception" below).

## General principle: minimal dependencies

- The monorepo MUST use as few third-party dependencies as possible.
- A new external dependency MUST NOT be added unless the standard library and existing
  `@glacier/*` packages cannot reasonably solve the problem.

## File size

- A file MUST NOT exceed 100 lines of code where this is reasonably achievable. When a file grows
  past 100 lines, it MUST be split (e.g. by extracting a class, helper, or subfolder) rather than
  left to grow, unless splitting would break another mandatory rule in this document (e.g. one
  class per file), in which case the file MAY exceed the limit.

## Architecture: hexagonal, layer-first

- Every service/app MUST be organized into exactly four top-level layers:

  ```text
  Domain/
  Application/
  Infrastructure/
  Presentation/
  ```

- Within each layer, code MUST be grouped into subfolders by feature/subdomain (e.g.
  `Domain/User/`, `Domain/Order/`). A flat, ungrouped layer folder MUST NOT exist.
- Within a feature subfolder, DTOs, interfaces, exceptions, standalone functions, and constants
  MUST further be grouped into the shared subfolders described in "Grouping folders" below (e.g.
  `Domain/User/_interfaces/`, `Application/User/_dtos/`) rather than sitting loose alongside classes.
- Dependencies MUST only point inward: `Presentation → Application → Domain`.
- `Domain` MUST NOT import from `Application`, `Infrastructure`, or `Presentation`.
- `Infrastructure` MUST implement interfaces ("ports") that are owned and defined by `Domain`
  (e.g. `IUserRepository` is declared in `Domain`, implemented in `Infrastructure`). Ports MUST
  NOT be defined inside `Infrastructure`.
- `Presentation` MUST contain controllers/route handlers (or, in frontend apps, views/components)
  together with the Zod schemas and DTOs that validate/shape data at the boundary. `Application`
  MUST stay free of transport-specific concerns (HTTP shapes, view models).
- This dependency direction MUST be enforced mechanically via `oxlint-plugin-boundaries`, not left
  to code review alone.

### Dependency injection

- All cross-layer wiring MUST go through the `@glacier/di` container.
- Code MUST NOT instantiate an `Infrastructure` class directly with `new` from `Application` or
  `Presentation` code — dependencies MUST always be injected via the constructor.
- (`@glacier/di`'s concrete decorator/token API is not yet designed; once it exists, this section
  MUST be extended with the exact binding syntax.)

### Frontend exception (React)

- Frontend apps use React and keep the same four-layer structure as backend services.
- The OOP mandate below is waived **only** for the `Presentation` layer's component functions
  themselves: a React component MUST be a function and MAY use hooks (`useState`, `useEffect`,
  etc.).
- Everything a component calls into (services in `Application`, entities in `Domain`) MUST still
  be class-based per the OOP rules, and MUST be resolved through a DI-aware hook (e.g.
  `useService(IUserService)`) backed by `@glacier/di` — components MUST NOT reach into
  `Application`/`Domain` classes by constructing them directly.
- State-management library choice (server cache, global client state, etc.) is out of scope for
  this ruleset.

### Library packages

- The four service/application layers do not apply to reusable libraries under `packages/`.
- A package's `src/` folder MUST be organized by stable responsibility using widely understood
  domain terms, such as `definition`, `validation`, `serialization`, `parsing`, or
  `transformation`. A responsibility folder MUST exist only when that responsibility exists.
- A package MUST NOT use generic catch-all top-level folders such as `types`, `utils`, `helpers`,
  `common`, or `shared`. Types, functions, constants, interfaces, and exceptions MUST belong to
  the responsibility that owns them.
- A package's primary public behavior MUST live in a folder named for its primary concept (for
  example, `schema`, `client`, or `parser`), rather than in a generic `core` folder.
- Implementation details MUST remain below their owning responsibility. For example, a validator
  compiler belongs in `validation/compiler/`, not in a package-root `compiler/` folder.
- The package-root `index.ts` MUST be the only public entry point. It MAY re-export the package's
  public API; package-internal code MUST import defining modules directly.

## Object orientation

- Code MUST be class-based (fully OOP). Classes are the primary unit of encapsulation everywhere
  except the React exception above.
- The only other exception: pure, stateless, side-effect-free utility functions (formatting, math,
  string helpers) MAY exist as standalone functions, and MUST live in the feature's `_functions/`
  folder (see "Grouping folders" below). Anything with behavior tied to domain/application state
  MUST be a class method.
- Class methods MUST use standard method syntax (`method() {}`). Arrow-function class properties
  (`method = () => {}`) MUST NOT be used. Arrow functions are reserved for callbacks/closures only.
- Class members MUST default to `private`. `public`/`protected` MUST only be used with a concrete
  reason to expose the member.
- Class properties MUST default to `readonly`. A property MUST only be mutable if mutation is
  actually required.
- A method or function MUST NOT exceed 40 lines or a cyclomatic complexity of 10. This MUST be
  enforced by the linter.

## Type system

- `strict` mode MUST be enabled repo-wide.
- `any` MUST NOT be used anywhere. Use `unknown` and narrow it instead.
- `interface` MUST be used for every object shape, including DTOs and config objects, and MUST be
  the type used for all ports (e.g. `IUserRepository`).
- `type` MUST only be used where `interface` syntax cannot express the shape: unions,
  intersections, tuples, and mapped/utility-type compositions.
- Native TypeScript `enum` MUST NOT be used. Use a union of string literal types (or a `const`
  object plus a derived union) instead.
- `null` MUST NOT be used. Use `undefined` uniformly for "no value" (including optional properties
  via `?:` rather than `| null`).

## Naming

- Filenames MUST match the casing of the single symbol they export (e.g. `UserService.ts` for
  class `UserService`, `formatDate.ts` for function `formatDate`) — one file per export, filename
  matches the export name exactly, including case. See "Module exports" below.
- Folder names MUST be `camelCase`, except the five grouping folders (`_dtos`, `_interfaces`,
  `_exceptions`, `_functions`, `_constants` — see "Grouping folders" below), which MUST use exactly
  that literal, lowercase, underscore-prefixed name.
- Variables, functions, methods, and parameters MUST be `camelCase`.
- Classes, interfaces, and types MUST be `PascalCase`.
- Interfaces MUST be prefixed with `I` (e.g. `IUserRepository`).
- True module-level constants MUST be `UPPER_SNAKE_CASE`. Config objects and derived values are
  not "true constants" and MUST follow the normal `camelCase`/`PascalCase` rules for their kind.

## Grouping folders

- Within every feature subfolder (in any of the four layers), files MUST be grouped by kind into
  the following folders whenever a file of that kind exists. Files MUST NOT be left loose alongside
  classes when a matching grouping folder applies:

  ```text
  Domain/User/
    _dtos/          -- DTOs and Zod-validated shapes
    _interfaces/    -- interfaces/ports (IUserRepository, etc.)
    _exceptions/    -- custom AppError subclasses
    _functions/     -- standalone utility functions
    _constants/     -- true module-level constants
    UserEntity.ts   -- classes stay directly in the feature folder
  ```

- Each grouping folder MUST contain one file per export, and that file's name MUST be the exact
  name of the export (see "Module exports") — no suffix-based naming (`*.dto.ts`, `*.utils.ts`,
  `*.interface.ts`, `*.exception.ts`, `*.constants.ts`, etc.) MUST be used anywhere.
- A file whose only export is a standalone function MUST live in `_functions/` and MUST be named
  with the exact, unmodified function name (e.g. function `formatDate` MUST be in
  `_functions/formatDate.ts`).
- A grouping folder MUST NOT be created empty or "just in case" — it exists only once a file of
  that kind is actually needed for that feature.

## Module exports

- A file MUST export exactly one symbol (class, function, const, type, or interface), except the
  package root `index.ts`, which is the sole barrel/entry-point file permitted to re-export multiple
  symbols.
- The filename MUST match the name of that single export exactly, including case (e.g.
  `UserService.ts` exports `UserService`, `formatDate.ts` exports `formatDate`,
  `MAX_RETRIES.ts` exports `MAX_RETRIES`). Private helpers that are not exported MAY still live in
  the same file.

## Formatting

- All code MUST be formatted with the repo's Oxfmt configuration. There MUST be no manual
  formatting debates or hand-authored formatting rules — Oxfmt is the single source of truth for
  indentation, quotes, semicolons, line length, and import sorting.

## Imports and modules

- Imports that cross a layer or feature boundary MUST use TypeScript path aliases (e.g.
  `@domain/user`, `@glacier/di`), never relative paths.
- Imports within the same feature folder MUST use relative paths (e.g. `./UserEntity`).
- Barrel files (`index.ts` files that only re-export other modules) MUST NOT be used. Import
  directly from the file that defines the symbol.

## Error handling

- Errors MUST be represented as thrown, custom `Error` subclasses. Result/Either return types
  MUST NOT be used.
- Every custom error MUST extend one shared abstract base class, `AppError`, which carries a
  `code` property (and MAY carry `cause`).
- Every distinct failure case MUST have its own named error subclass (e.g.
  `UserNotFoundError extends AppError`), owned by the domain that raises it. Generic, reused error
  classes MUST NOT be used across unrelated failure cases.
- JSDoc for any method that can throw MUST document the specific error subclass(es) via `@throws`.

## Async

- All asynchronous code MUST use `async`/`await`. Raw `.then()`/`.catch()` chains MUST NOT be
  used.
- Independent concurrent operations MUST use `Promise.all`/`Promise.allSettled`. Sequentially
  `await`-ing independent operations in a loop MUST NOT be done.

## Input validation and configuration

- All external input — HTTP request bodies, environment variables, third-party API responses —
  MUST be validated through a schema library (Zod or equivalent) at the boundary before being
  trusted as typed data.
- All `process.env` access MUST be centralized through one Zod-validated config module, read once
  at startup. Scattered `process.env.X` reads elsewhere in the codebase MUST NOT exist.

## Logging

- All logging MUST go through the shared `@glacier/logger` library. Raw `console.log` (or
  equivalent) MUST NOT be used.
- Log statements MUST NOT include secrets or PII (passwords, tokens, full request bodies), whether
  directly or via dumping an object that contains them.
- (`@glacier/logger`'s concrete API is not yet designed; once it exists, this section MUST be
  extended with exact usage examples.)

## Documentation

- Every exported class, interface, method, and property MUST have a JSDoc comment.
- The comment MUST explain purpose/intent (the "why"), not merely restate the name or signature.
- Where applicable, the comment MUST include `@param`, `@returns`, and `@throws` (naming the
  specific `AppError` subclass(es) that can be thrown).

## Testing

- Unit tests MUST use Vitest and MUST be colocated with the source file they test (e.g.
  `UserService.ts` next to `UserService.test.ts`).
- Black-box tests for applications MUST live in the shared, global Playwright package — not
  colocated with application source.
- Tests MUST mock only at port boundaries (e.g. mock `IUserRepository`), never internal
  domain/application classes.
- `Domain` and `Application` unit tests MUST run with zero real infrastructure (no real DB,
  network, etc.). `Infrastructure` adapters MUST instead have their own integration tests against
  real (containerized) dependencies.
- Tests MUST be structured with a visible Arrange-Act-Assert layout (blank-line separation or
  `// Arrange` / `// Act` / `// Assert` comments).
- Test descriptions MUST follow the template `describe(ClassName)` → `it('MUST <behavior> when
<condition>')`.

### Packages (`packages/*`)

- For every package under `packages/`, all tests MUST live in that package's `./test` directory.
  Tests MUST NOT be colocated in `src/` and no `*.test.ts` file MUST exist anywhere under a
  package's `src/` tree — the colocation rule above applies only to applications/services, not to
  packages.
- Package tests MUST be black-box only: they MUST exercise the package exclusively through what
  `index.ts` exports. Tests MUST NOT import internal modules directly (no deep imports like
  `../src/Internal/Foo`), and MUST NOT be written against internal, unexported classes or
  functions.
- Every package MUST have 100% test coverage (statements, branches, functions, and lines). This
  MUST be enforced by the coverage tool in CI; a package MUST NOT merge with coverage below 100%.
