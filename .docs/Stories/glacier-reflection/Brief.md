---
created: 2026-10-04
tags:
  - story
---

# Glacier reflection - Brief

This document owns why and what, not implementation design or task progress. The requirements baseline was confirmed
during discovery; joint approval of these criteria and the implementation plan is recorded under
[ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md). The
[plan's approval record](Plan.md#approval) owns joint requirements/design approval.

## Problem

Glacier needs its first library, `glacier-reflection`, to provide reliable metadata declarations for a future dependency
injection library. Other library authors and application developers must also be able to use it independently.

`reflect-metadata` stores metadata but does not discover complete TypeScript types. Its public metadata declarations
use `any`, without a trustworthy association between a metadata key and its value type. TypeScript's legacy
`emitDecoratorMetadata` output supplies limited runtime representations through global `Reflect.metadata`; interfaces
and generic arguments are not recoverable as complete runtime dependency identities.

The desired replacement is a deliberately bounded, easy-to-use, type-safe metadata contract, not compatibility with
every existing `reflect-metadata` consumer. The user does not intend to use external libraries that require that package.

## Intended outcome

Consumers can define typed metadata once, attach it to classes and every valid legacy-decorator location, and retrieve
it with sound type inference and predictable inheritance. The same declarations can be expressed through direct
operations or ready-to-use legacy decorators.

Importing the library automatically enables recording of TypeScript-emitted design metadata. Compiler metadata and
explicit custom annotations together provide a demonstrated foundation for future DI, without implementing DI itself
or implying that erased TypeScript types can be reconstructed.

The first version is independently usable in modern server and browser environments. Minimality means excluding
capabilities beyond the contracts selected here, not weakening type safety, discovery, or inheritance guarantees.

## Scope

### In scope

- The first `glacier-reflection` library and its independently usable public contract.
- Metadata on class declarations, instance/static properties, methods, accessors, constructor parameters, and method
  parameters wherever legacy TypeScript decorators are valid.
- Direct metadata operations and typed legacy-decorator authoring.
- Isolated metadata definitions with declared value types and inheritance meanings.
- Replacement values, accumulating lists, and accumulating homogeneous records.
- Inherited and direct-only retrieval, presence, discovery, direct declaration replacement, and deletion.
- Ordinary class instances as read, presence, and discovery aliases for their class declarations, not annotation targets.
- Automatic compatibility with emitted `design:type`, `design:paramtypes`, and `design:returntype`.
- Representative usage examples, public runtime contracts, type-safety contracts, and DI-foundation examples.

### Out of scope

- A drop-in `reflect-metadata` replacement, arbitrary third-party compatibility, or coexistence with another global
  metadata implementation.
- Ordinary object instances and plain objects as annotation targets. Such objects may still be metadata values.
- Modern standard decorators and their separate metadata mechanism.
- General untyped custom-metadata ingestion or runtime validation of arbitrary JavaScript custom writes.
- Full TypeScript type reconstruction, including erased interfaces, generic arguments, and parameter names.
- Enumeration of every runtime member or parameter independently of metadata declarations.
- Recursive record merging, list deduplication, inheritance reset, and suppression of inherited entries or declarations.
- Deep cloning or deep immutability of metadata values.
- DI token abstractions, DI-specific decorators, provider registries, dependency resolution, instance construction,
  lifecycle scopes, and cycle detection.
- Obsolete runtime compatibility, publication, release, or deployment as product acceptance outcomes.

## Requirements and constraints

### Metadata definitions and type safety

- A metadata definition establishes its value type and inheritance meaning once. Ordinary writes, reads, and decorator
  use must infer their types without repeated type arguments or consumer-side casts.
- Definitions created independently must remain isolated even when their descriptive names match. Sharing metadata
  requires deliberately sharing the same definition; a name alone must not establish identity.
- Incompatible custom values and incompatible uses of a definition must be rejected at compile time. Retrieval must
  not let consumers invent a return type independently of the definition.
- Statically known member names and positions in known fixed parameter lists must be checked. Dynamic information
  must not be presented as providing guarantees it cannot establish.
- Metadata value types are independent of the annotated member's own value type.
- Accumulating records are homogeneous dictionaries, such as `Record<string, Person>`: each contributed entry must have
  the declared value type. They are not heterogeneous sets of separately typed fields. Undeclared entries remain
  possibly absent.
- Compiler metadata is the only supported untyped input boundary. Its supported runtime shapes must be checked before
  exposure through typed definitions. This guarantee does not extend to arbitrary JavaScript custom writes or recover
  erased source types.

### Storage and inheritance

- Writes and deletion require class constructors. Reads, presence checks, and discovery also accept ordinary class
  instances and resolve to the same class declarations, without per-instance storage, constructing consumers, or
  invoking their getters. Instance lookups support class and instance-side locations only.
- Instance-owned constructor properties must not redirect lookup. Plain objects, class prototype objects, and
  instance requests for static or individual constructor-parameter locations must be rejected observably.
- Metadata belongs to its class declaration or exact supported decorator location. Static, instance, constructor, and
  method-parameter locations must remain distinguishable.
- Inherited lookup is the default; explicit direct-only lookup must also be available.
- Each definition's declared meaning determines inheritance behavior, not the stored value's apparent runtime shape:
  - Replacement values use the nearest declaration, including primitives and whole objects.
  - Lists concatenate ancestor-first and preserve all duplicates.
  - Records accumulate entries ancestor-first, with the nearest declaration replacing each conflicting entry in full.
    Nested values must not be recursively merged.
- The same-shaped object can be a whole replacement value or an accumulating record according to its definition.
- Parameter annotations inherit by matching location and position. Retrieval must not claim that an ancestor's and a
  descendant's parameter at that position have equivalent dependency meaning. Direct-only lookup is available when
  inherited annotations are inappropriate.
- Every write replaces the previous direct declaration of that definition at that exact location. Accumulation occurs
  across inheritance, not across repeated direct writes.
- Absence must be distinguishable from a declaration whose value is explicitly `undefined`, when its value contract
  permits that value. An explicit replacement value of `undefined` must not fall back to an ancestor.
- Deletion removes only a direct declaration and leaves ancestors unchanged. An inherited declaration can become
  visible afterward.
- There is no inheritance reset or suppression capability. An empty accumulating list or record does not clear
  ancestor contributions.
- Accumulating lists and records have isolated outer structure. Later caller changes to supplied containers must not
  add, remove, or reassign stored entries; returned collection structure must be readonly and must not allow changes
  to stored declarations.
- Contained values and whole-object replacement values retain their original identities. Deep copying and deep
  immutability are not promised.

### Discovery

- Consumers can discover metadata definitions present at a target or location.
- Consumers can discover member names and parameter positions carrying a known metadata definition without already
  knowing those locations.
- Both discovery directions include inherited declarations by default and offer a direct-only alternative.
- Discovery must not duplicate a definition identity or location because multiple ancestors declare it. An explicitly
  stored `undefined` or empty accumulating collection still counts as a present declaration.
- Discovery concerns metadata-bearing locations, not all members or complete runtime type information.

### Compiler compatibility and failures

- Importing `glacier-reflection` automatically enables recording of TypeScript's legacy emitted design metadata through
  global `Reflect.metadata`. This is an intentional, documented import effect, not opt-in behavior.
- All three emitted metadata definitions use nearest-declaration replacement. In particular, `design:paramtypes` is a
  positional list for one constructor or method and must be replaced as a whole, never concatenated.
- Compiler metadata must be accessible through supported checked definitions with inferred retrieval types.
- Unsupported or malformed compiler-boundary writes must fail observably before changing stored declarations. A
  rejected write must leave any previous valid declaration unchanged; compiler-driven decorator execution must not
  silently discard that rejection.
- If import encounters a global `Reflect.metadata` handler belonging to another implementation, compatibility must fail
  explicitly, preserve the existing handler, and not claim successful activation.
- Unrelated built-in Reflect operations must remain unchanged.

### Project constraints

- All accepted, active ADRs remain binding, including the curated package-root API, strict TypeScript contracts,
  public-contract test-first development, dependency approval, and library verification requirements.
- Public runtime behavior requires meaningful package-root tests with ADR-0005's 100% statements, branches, functions,
  and lines per library and relevant production file. Erased type contracts require type checking, not runtime
  coverage claims.
- This is library-only work. It introduces no application/service behavior or business acceptance-catalog criteria;
  the eventual plan must retain `E2E tests` and explain that inapplicability.
- The exact API, package design, supported modern-runtime baselines, and verification approach belong in the separate
  implementation plan. Requirements confirmation alone does not authorize implementation, commits, push, PR
  publication, or merge.

## Acceptance criteria

These are stable story-local library criteria, not application/service acceptance-catalog entries.

- **AC-001 - Independent use:** A consumer can use `glacier-reflection` without a DI library or another Glacier package.
  Its documented public contract is available from the package root in the supported modern server and browser
  environments.
- **AC-002 - Legacy location coverage:** Custom metadata can be attached and retrieved at every valid legacy-decorator
  location, including class declarations, instance/static properties, methods, accessors, constructor parameters, and
  method parameters. Corresponding direct operations expose the same stored declarations.
- **AC-003 - Location isolation:** The same definition at distinct classes, static/instance locations, members, or
  constructor/method parameter positions does not overwrite an unrelated declaration. Standalone instances and plain
  objects are not supported annotation targets.
- **AC-004 - Definition identity:** Two independent definitions with the same descriptive name do not collide. Consumers
  deliberately sharing one definition observe the same metadata contract and declarations.
- **AC-005 - Inferred value contracts:** After defining metadata once, valid writes, reads, and decorators infer the
  definition's types without repeated type arguments or consumer casts. Wrong value types and attempts to request an
  unrelated retrieval type fail type checking.
- **AC-006 - Checked locations:** A misspelled statically known member name or out-of-range position in a known fixed
  parameter list fails type checking. The API does not assert equivalent guarantees for locations it cannot know
  statically.
- **AC-007 - Declared inheritance meaning:** Identically shaped object values can exhibit whole-value replacement or
  record accumulation according to their definitions. Reusing a definition cannot silently change that meaning.
- **AC-008 - Replacement lookup:** Given different replacement declarations on a base and descendant, default lookup
  returns the nearest declaration intact; direct-only lookup returns only the declaration at the queried target.
- **AC-009 - List accumulation:** Given base `["a", "b"]` and descendant `["b", "c"]` declarations, inherited lookup
  returns `["a", "b", "b", "c"]`. Direct-only lookup returns the descendant's own list.
- **AC-010 - Record accumulation:** Nonconflicting record entries accumulate. Given base
  `{ service: { optional: true, label: "base" } }` and descendant `{ service: { optional: false } }`, inherited lookup
  returns `{ service: { optional: false } }`, without retaining `label` through recursive merging.
- **AC-011 - Homogeneous records:** For a record definition with value type `Person`, separate declarations can
  contribute different person entries. An incompatible entry value fails type checking, and retrieval does not
  promise that an undeclared key exists.
- **AC-012 - Parameter inheritance boundary:** Default parameter lookup applies the definition's ordinary inheritance
  behavior at the matching position. Direct-only lookup excludes ancestor declarations, and documentation makes no
  claim that inherited parameter annotations prove equivalent signatures or dependency meaning.
- **AC-013 - Repeated writes:** Two writes at the same definition and location leave only the second direct declaration.
  For accumulating metadata, ancestor contributions still participate in default lookup, but the first direct write
  does not.
- **AC-014 - Absence and undefined:** A missing declaration and an explicitly stored `undefined` are distinguishable
  when the definition permits `undefined`. Such a direct replacement declaration is present and overrides an ancestor
  value rather than falling back.
- **AC-015 - Direct deletion:** Deleting a direct declaration leaves all ancestor and unrelated declarations unchanged.
  Default lookup can subsequently reveal inherited data; direct-only presence reflects the removal.
- **AC-016 - No inheritance reset:** Empty descendant lists and records preserve inherited contributions. The public
  contract offers neither inheritance reset nor suppression of inherited entries or declarations.
- **AC-017 - Collection ownership:** Changing a supplied accumulating list/record's outer structure after storage
  cannot change the stored declaration. Returned collection structure is readonly and cannot modify stored entries.
  Contained object values and whole-object replacement values preserve identity, without a deep-copy promise.
- **AC-018 - Definition discovery:** Discovery at a target or location reports each present definition identity once
  under inherited lookup, with a direct-only alternative. Stored `undefined` and empty collections remain discoverable.
- **AC-019 - Location discovery:** Given a known definition, consumers can discover annotated member names and
  parameter positions without knowing them beforehand. Inherited discovery and direct-only discovery follow their
  respective boundaries and do not duplicate a location because of repeated ancestor declarations.
- **AC-020 - Automatic compiler recording:** With the library imported before decorated declarations execute, real
  TypeScript legacy-emitted `design:type`, `design:paramtypes`, and `design:returntype` are recorded and retrievable
  through their supported checked definitions. No separate compatibility opt-in is required.
- **AC-021 - Compiler replacement semantics:** A descendant's direct compiler declaration overrides the corresponding
  inherited declaration as a whole. A parameter-type list replaces an ancestor list rather than concatenating it,
  including when the descendant list is empty.
- **AC-022 - Compiler boundary rejection:** Unsupported or malformed compiler metadata is rejected observably without
  changing a previous valid declaration. Compiler-driven decorator invocation must not conceal the failure or expose
  invalid metadata as checked typed data.
- **AC-023 - Foreign-handler conflict:** Given an existing foreign global `Reflect.metadata` handler, importing the
  library fails explicitly and leaves that handler unchanged. Successful activation leaves unrelated built-in Reflect
  operations unchanged.
- **AC-024 - Bounded runtime information:** Documentation and examples distinguish runtime representations from erased
  source types and do not promise interface/generic reconstruction, parameter names, semantic signature compatibility,
  or general untyped custom-value validation.
- **AC-025 - DI foundation examples:** Representative examples demonstrate retrieval of emitted constructor parameter
  representations and explicit typed dependency annotations, including an interface-based dependency with an
  explicitly supplied runtime identity. They do not require or introduce a DI resolver, DI token abstraction, or
  provider registry.
- **AC-026 - Public-contract verification:** Every public runtime export has meaningful success, failure, and boundary
  assertions through the package-root API, with the required 100% coverage per library and relevant production file.
  Public type contracts are checked independently, including accepted use and rejected misuse.
- **AC-027 - Instance lookup aliases:** For ordinary instances of a base class or subclass, reads, presence checks,
  and both discovery directions match lookup through their class constructor in inherited and direct-only modes
  at class and instance-side locations. Two instances share class declarations; an instance-owned constructor
  property does not redirect lookup. Writes and deletion still require constructors. Plain objects, class prototype
  objects, and instance requests for static or individual constructor-parameter locations are rejected observably,
  without constructing consumers or invoking their getters. Exceptional inspection failures remain observable.

## Open questions

None for the requirements baseline. API design, runtime-version baselines, dependencies, failure representation,
verification sequencing, and other implementation decisions remain for the separate plan rather than this brief.

## References

- [reflect-metadata documentation](https://github.com/rbuckton/reflect-metadata#readme) describes storage, direct/inherited
  lookup, decorator helpers, global effects, legacy-decorator support, and the proposal's standardization status.
- [reflect-metadata public declarations](https://github.com/rbuckton/reflect-metadata/blob/main/index.d.ts) show the
  untyped metadata key/value contract.
- [TypeScript emitDecoratorMetadata](https://www.typescriptlang.org/tsconfig/emitDecoratorMetadata.html) shows emitted
  design metadata and its global `Reflect.metadata` integration.
- [TypeScript legacy decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) describes valid legacy
  decorator locations.
- [Workspace package configuration](../../../pnpm-workspace.yaml) includes the future library package location.
- [Workspace manifest](../../../package.json) defines existing tooling and runtime requirements.

## Related notes

- [Stories](../Index.md)
- [Architecture decisions](../../Architecture/Decisions/Index.md)
- [ADR-0001: Techstack](../../Architecture/Decisions/ADR-0001-Techstack.md)
- [ADR-0002: Package architecture](../../Architecture/Decisions/ADR-0002-Package-architecture.md)
- [ADR-0003: Code style](../../Architecture/Decisions/ADR-0003-Code-style.md)
- [ADR-0005: Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
- [ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)
- [Plan](Plan.md)
- [Requirements and plan approval](Plan.md#approval)
- [Tasks](Tasks.md)
